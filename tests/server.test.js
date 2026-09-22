import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { once } from "node:events";
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createApp } from "../server/app.js";
import { createWorkspaceStore } from "../server/workspaces.js";
import { createProject, writePage } from "./support/project.js";

async function serve(project) {
  const config = await fs.mkdtemp(
    path.join(path.dirname(project), "nanopm-config-"),
  );
  const workspaces = createWorkspaceStore({ cwd: config });
  const server = createApp(project, { workspaces }).listen(0, "127.0.0.1");
  await once(server, "listening");
  return {
    server,
    workspaces,
    config,
    url: `http://127.0.0.1:${server.address().port}`,
  };
}

async function startCli(args, cwd, config) {
  const cli = fileURLToPath(new URL("../server/cli.js", import.meta.url));
  const child = spawn(process.execPath, [cli, ...args, "--no-open"], {
    cwd,
    env: { ...process.env, PORT: "0", NANOPM_STUDIO_CONFIG_DIR: config },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("CLI did not print its URL")),
      10000,
    );
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/NanoPM Studio: (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      reject(new Error(`CLI exited before ready: ${code}`)),
    );
  });
  return { child, url };
}

async function stopCli(child) {
  child.kill();
  if (child.exitCode === null) await once(child, "exit");
}

test("HTTP project selection is read-only, validates paths, and reflects external edits", async () => {
  const first = await createProject();
  const second = await createProject();
  const { server, workspaces, config, url } = await serve(first);
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
      path.normalize(
        await fs.realpath(
          (await (await fetch(`${url}/api/project`)).json()).project,
        ),
      ),
      path.normalize(await fs.realpath(first)),
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
    workspaces.close();
    await fs.rm(config, { recursive: true, force: true });
    await fs.rm(first, { recursive: true, force: true });
    await fs.rm(second, { recursive: true, force: true });
  }
});

test("HTTP rejects non-local Host and unknown API paths", async () => {
  const root = await createProject();
  const { server, workspaces, config, url } = await serve(root);
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
    workspaces.close();
    await fs.rm(config, { recursive: true, force: true });
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("CLI starts on loopback using the current project directory", async () => {
  const root = await createProject();
  const cli = fileURLToPath(new URL("../server/cli.js", import.meta.url));
  const env = { ...process.env, PORT: "0" };
  const config = await fs.mkdtemp(
    path.join(path.dirname(root), "nanopm-cli-config-"),
  );
  env.NANOPM_STUDIO_CONFIG_DIR = config;
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
    await fs.rm(config, { recursive: true, force: true });
  }
});

test("CLI restores the last project and an explicit project always wins", async () => {
  const first = await createProject();
  const second = await createProject();
  const config = await fs.mkdtemp(
    path.join(os.tmpdir(), "nanopm-cli-history-"),
  );
  let running;
  try {
    running = await startCli([first], os.tmpdir(), config);
    assert.equal(
      (await (await fetch(`${running.url}/api/project`)).json()).objective.id,
      "PO-1",
    );
    await stopCli(running.child);

    running = await startCli([], os.tmpdir(), config);
    assert.equal(
      (await (await fetch(`${running.url}/api/project`)).json()).project,
      await fs.realpath(first),
    );
    await stopCli(running.child);

    await writePage(
      second,
      "docs/objectives.md",
      "---\ntype: objectives\n---\n# PO-2 — explicit project\n",
    );
    running = await startCli(["--project", second], os.tmpdir(), config);
    assert.equal(
      (await (await fetch(`${running.url}/api/project`)).json()).objective.id,
      "PO-2",
    );
  } finally {
    if (running?.child.exitCode === null) await stopCli(running.child);
    await fs.rm(first, { recursive: true, force: true });
    await fs.rm(second, { recursive: true, force: true });
    await fs.rm(config, { recursive: true, force: true });
  }
});
