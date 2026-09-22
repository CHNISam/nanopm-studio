import fs from "node:fs/promises";
import path from "node:path";
import Conf from "conf";

const MAX_RECENT_PROJECTS = 8;

function comparisonKey(projectPath) {
  const normalized = path.normalize(projectPath);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

async function isNanoPMProject(projectPath) {
  const wiki = path.join(projectPath, ".nanopm", "wiki");
  return fs
    .stat(wiki)
    .then((value) => value.isDirectory())
    .catch(() => false);
}

export function createWorkspaceStore(options = {}) {
  const config = new Conf({
    projectName: "nanopm-studio",
    configName: "workspaces",
    ...(options.cwd ? { cwd: options.cwd } : {}),
    defaults: { lastProject: "", recentProjects: [] },
    schema: {
      lastProject: { type: "string" },
      recentProjects: {
        type: "array",
        maxItems: MAX_RECENT_PROJECTS,
        items: {
          type: "object",
          required: ["path", "name", "lastOpenedAt"],
          properties: {
            path: { type: "string" },
            name: { type: "string" },
            lastOpenedAt: { type: "string" },
          },
        },
      },
    },
  });

  return {
    get path() {
      return config.path;
    },
    get lastProject() {
      return config.get("lastProject");
    },
    async remember(projectPath) {
      const resolved = await fs.realpath(path.resolve(projectPath));
      const key = comparisonKey(resolved);
      const recentProjects = config
        .get("recentProjects")
        .filter((entry) => comparisonKey(entry.path) !== key);
      recentProjects.unshift({
        path: resolved,
        name: path.basename(resolved),
        lastOpenedAt: new Date().toISOString(),
      });
      config.set({
        lastProject: resolved,
        recentProjects: recentProjects.slice(0, MAX_RECENT_PROJECTS),
      });
      return resolved;
    },
    async list() {
      return Promise.all(
        config.get("recentProjects").map(async (entry) => ({
          ...entry,
          available: await isNanoPMProject(entry.path),
        })),
      );
    },
    async startupProject(explicitProject, cwd = process.cwd()) {
      if (explicitProject) return path.resolve(explicitProject);
      if (config.get("lastProject")) return config.get("lastProject");
      return (await isNanoPMProject(cwd)) ? path.resolve(cwd) : "";
    },
    close() {
      config._closeWatcher();
    },
  };
}
