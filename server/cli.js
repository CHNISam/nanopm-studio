#!/usr/bin/env node
import { createApp } from "./app.js";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const args = process.argv.slice(2);
const index = args.indexOf("--project");
const project =
  index >= 0 ? args[index + 1] : process.env.NANOPM_PROJECT || process.cwd();
const port = Number(process.env.PORT || 0);
const here = path.dirname(fileURLToPath(import.meta.url));
if (!existsSync(path.resolve(here, "../dist/index.html"))) {
  console.error("NanoPM Studio UI is not built. Run npm run build first.");
  process.exit(1);
}
const server = createApp(project).listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${server.address().port}`;
  console.log(`NanoPM Studio: ${url}`);
  if (!args.includes("--no-open")) {
    const command =
      process.platform === "win32"
        ? "cmd"
        : process.platform === "darwin"
          ? "open"
          : "xdg-open";
    const openArgs =
      process.platform === "win32" ? ["/c", "start", "", url] : [url];
    execFile(command, openArgs, { windowsHide: true }, (error) => {
      if (error) console.warn(`Open ${url} manually (${error.message}).`);
    });
  }
});
