#!/usr/bin/env node
import { createApp } from "./app.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import open from "open";
import { createWorkspaceStore } from "./workspaces.js";
const args = process.argv.slice(2);
const index = args.indexOf("--project");
const positional = args.find(
  (value, position) =>
    !value.startsWith("-") && (index < 0 || position !== index + 1),
);
const requestedProject =
  index >= 0 ? args[index + 1] : positional || process.env.NANOPM_PROJECT || "";
const port = Number(process.env.PORT || 0);
const here = path.dirname(fileURLToPath(import.meta.url));
if (!existsSync(path.resolve(here, "../dist/index.html"))) {
  console.error("NanoPM Studio UI is not built. Run npm run build first.");
  process.exit(1);
}
const workspaces = createWorkspaceStore({
  cwd: process.env.NANOPM_STUDIO_CONFIG_DIR,
});
const project = await workspaces.startupProject(
  requestedProject,
  process.cwd(),
);
const server = createApp(project, { workspaces }).listen(
  port,
  "127.0.0.1",
  () => {
    const url = `http://127.0.0.1:${server.address().port}`;
    console.log(`NanoPM Studio: ${url}`);
    if (!args.includes("--no-open")) {
      open(url).catch((error) =>
        console.warn(`Open ${url} manually (${error.message}).`),
      );
    }
  },
);
