#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import open from "open";
import { createApp } from "./app.js";
import { cliHelp, parseCliArgs } from "./cli-args.js";
import { createWorkspaceStore } from "./workspaces.js";

let options;
try {
  options = parseCliArgs(process.argv.slice(2));
} catch (error) {
  console.error(
    `NanoPM Studio: ${error.message}\nRun nanopm-studio --help for usage.`,
  );
  process.exit(2);
}
if (options.help) {
  console.log(cliHelp());
  process.exit(0);
}

const here = path.dirname(fileURLToPath(import.meta.url));
if (!existsSync(path.resolve(here, "../dist/index.html"))) {
  console.error("NanoPM Studio UI is not built. Run npm run build first.");
  process.exit(1);
}

const workspaces = createWorkspaceStore({
  cwd: process.env.NANOPM_STUDIO_CONFIG_DIR,
});
const project = await workspaces.startupProject(options.project, process.cwd());
const app = createApp(project, { workspaces });
const server = app.listen(options.port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${server.address().port}`;
  if (options.json) {
    console.log(
      JSON.stringify({
        event: "ready",
        url,
        host: "127.0.0.1",
        port: server.address().port,
        project: project || null,
        pid: process.pid,
      }),
    );
  } else console.log(`NanoPM Studio: ${url}`);
  if (options.open) {
    open(url).catch((error) =>
      console.warn(`Open ${url} manually (${error.message}).`),
    );
  }
});
server.on("error", (error) => {
  console.error(`NanoPM Studio: ${error.message}`);
  process.exitCode = 1;
});
