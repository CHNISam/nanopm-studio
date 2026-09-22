import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createWorkspaceStore } from "../server/workspaces.js";
import { createProject } from "./support/project.js";

test("workspace history persists a bounded, deduplicated Windows MRU", async () => {
  const config = await fs.mkdtemp(path.join(os.tmpdir(), "nanopm-workspaces-"));
  const projects = [];
  let store;
  try {
    for (let index = 0; index < 10; index += 1)
      projects.push(await createProject());
    store = createWorkspaceStore({ cwd: config });
    for (const project of projects) await store.remember(project);
    await store.remember(projects[5]);
    const recent = await store.list();
    assert.equal(recent.length, 8);
    assert.equal(recent[0].path, await fs.realpath(projects[5]));
    assert.equal(
      recent.filter((item) => item.path === recent[0].path).length,
      1,
    );
    store.close();

    store = createWorkspaceStore({ cwd: config });
    assert.equal(
      await store.startupProject(""),
      await fs.realpath(projects[5]),
    );
    const explicit = path.resolve(projects[2]);
    assert.equal(await store.startupProject(explicit), explicit);

    await fs.rm(projects[5], { recursive: true, force: true });
    assert.equal((await store.list())[0].available, false);
  } finally {
    store?.close();
    await Promise.all(
      projects.map((project) =>
        fs.rm(project, { recursive: true, force: true }),
      ),
    );
    await fs.rm(config, { recursive: true, force: true });
  }
});
