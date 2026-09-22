import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { once } from "node:events";
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createApp } from "../server/app.js";
import { createProject, writePage } from "./support/project.js";

async function serve(project) {
  const server = createApp(project).listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

test("HTTP project selection is read-only, validates paths, and reflects external edits", async () => {
  const first = await createProject();
  const second = await createProject();
  const { server, url } = await serve(first);
  const source = path.join(
    first,
    ".nanopm/wiki/entities/opportunities/need.md",
  );
  const original = await fs.readFile(source, "utf8");
  try {
    const initial = await fetch(`${url}/api/project`);
    assert.equal(initial.status, 200);
    assert.equal(initial.headers.get("cache-control"), "no-store");
    assert.equal((await initial.json()).objective.id, "PO-1");

    const invalid = await fetch(`${url}/api/project`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "relative-folder" }),
    });
    assert.equal(invalid.status, 400);
    assert.equal(
      (await (await fetch(`${url}/api/project`)).json()).project,
      first,
    );

    await writePage(
      second,
      "docs/objectives.md",
      "---\ntype: objectives\n---\n# PO-2 — changed outcome\n",
    );
    const selected = await fetch(`${url}/api/project`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: second }),
    });
    assert.equal(selected.status, 200);
    assert.equal((await selected.json()).objective.id, "PO-2");

    await writePage(
      second,
      "docs/objectives.md",
      "---\ntype: objectives\n---\n# PO-3 — external update\n",
    );
    assert.equal(
      (await (await fetch(`${url}/api/project`)).json()).objective.id,
      "PO-3",
    );
    assert.equal(await fs.readFile(source, "utf8"), original);
    assert.deepEqual((await fs.readdir(path.join(first, ".nanopm"))).sort(), [
      "wiki",
    ]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(first, { recursive: true, force: true });
    await fs.rm(second, { recursive: true, force: true });
  }
});

test("HTTP rejects non-local Host and unknown API paths", async () => {
  const root = await createProject();
  const { server, url } = await serve(root);
  try {
    const foreign = await new Promise((resolve, reject) => {
      http
        .get(
          `${url}/api/project`,
          { headers: { Host: "evil.example" } },
          (response) => {
            response.resume();
            resolve(response.statusCode);
          },
        )
        .on("error", reject);
    });
    assert.equal(foreign, 403);
    const missing = await fetch(`${url}/api/missing`);
    assert.equal(missing.status, 404);
    const html = await fetch(url);
    assert.equal(html.status, 200);
    assert.match(await html.text(), /NanoPM Studio/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("CLI starts on loopback using the current project directory", async () => {
  const root = await createProject();
  const cli = fileURLToPath(new URL("../server/cli.js", import.meta.url));
  const env = { ...process.env, PORT: "0" };
  delete env.NANOPM_PROJECT;
  const child = spawn(process.execPath, [cli, "--no-open"], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    const url = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("CLI did not print its URL")),
        10000,
      );
      let output = "";
      child.stdout.on("data", (chunk) => {
        output += chunk.toString();
        const match = output.match(
          /NanoPM Studio: (http:\/\/127\.0\.0\.1:\d+)/,
        );
        if (match) {
          clearTimeout(timeout);
          resolve(match[1]);
        }
      });
      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once("exit", (code) => {
        clearTimeout(timeout);
        reject(new Error(`CLI exited before ready: ${code}`));
      });
    });
    const response = await fetch(`${url}/api/project`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).objective.id, "PO-1");
  } finally {
    child.kill();
    if (child.exitCode === null) await once(child, "exit");
    await fs.rm(root, { recursive: true, force: true });
  }
});
