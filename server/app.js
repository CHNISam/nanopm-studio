import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProject } from "./model.js";
import { createWorkspaceStore } from "./workspaces.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export function createApp(initialProject = "", options = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const host = req.hostname;
    if (host !== "127.0.0.1" && host !== "localhost")
      return res.status(403).send("Localhost access only.");
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  let project = initialProject;
  let remembered = false;
  const workspaces = options.workspaces || createWorkspaceStore();
  const snapshot = async (projectPath, forceRemember = false) => {
    const result = await loadProject(projectPath);
    let resolvedProject = projectPath;
    if (forceRemember || !remembered) {
      resolvedProject = await workspaces.remember(projectPath);
      project = resolvedProject;
      remembered = true;
    }
    return { ...result, project: resolvedProject };
  };
  app.get("/api/project", async (_req, res) => {
    if (!project)
      return res.json({
        project: "",
        items: [],
        opportunities: [],
        solutions: [],
        evidence: [],
        recent: [],
        diagnostics: [],
      });
    try {
      res.json(await snapshot(project));
    } catch (error) {
      res.status(400).json({ error: error.message, project });
    }
  });
  app.post("/api/project", async (req, res) => {
    const candidate = req.body?.path;
    if (typeof candidate !== "string" || !path.isAbsolute(candidate))
      return res
        .status(400)
        .json({ error: "Enter an absolute project folder path." });
    try {
      res.json(await snapshot(candidate, true));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.get("/api/workspaces", async (_req, res) => {
    res.json({ current: project, recent: await workspaces.list() });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Unknown API endpoint." }),
  );
  app.use(express.static(path.resolve(here, "../dist")));
  app.get("/{*path}", async (_req, res) => {
    const html = path.resolve(here, "../dist/index.html");
    try {
      await fs.access(html);
      res.sendFile(html);
    } catch {
      res
        .status(404)
        .send("Build the UI with npm run build, or use npm run dev.");
    }
  });
  return app;
}
