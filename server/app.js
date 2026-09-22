import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProject } from "./model.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export function createApp(initialProject = "") {
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
      res.json(await loadProject(project));
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
      const snapshot = await loadProject(candidate);
      project = candidate;
      res.json(snapshot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
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
