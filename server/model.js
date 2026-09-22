import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const wikiPath = ".nanopm/wiki";
const skip = new Set(["INDEX.MD", "SCHEMA.MD", "LOG.MD"]);
const productDocs = new Set([
  "objectives",
  "strategy",
  "roadmap",
  "product",
  "evidence",
  "discovery",
  "feedback",
]);
const nice = (value) =>
  String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const list = (value) =>
  Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
const sourceDate = (value) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value || "");

async function walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(full)));
    else if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      !skip.has(entry.name.toUpperCase())
    )
      result.push(full);
  }
  return result;
}

export function section(content, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(
    new RegExp(
      `^##\\s+(?:\\d+\\.\\s*)?${escaped}\\s*\\n([\\s\\S]*?)(?=^##\\s|$)`,
      "im",
    ),
  );
  return match?.[1]?.trim() || "";
}

function firstText(markdown) {
  return markdown
    .replace(/^#+.*$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[\n*_`>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}

function record(file, root, diagnostics) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  let raw;
  try {
    raw = matter.read(file);
  } catch (error) {
    diagnostics.push(`${relative}: ${error.message}`);
    return null;
  }
  const data = raw.data || {};
  const parts = relative.split("/");
  const slug = path.basename(file, ".md");
  const entityTypes = {
    opportunities: "opportunity",
    solutions: "solution",
    objectives: "objective",
  };
  const type =
    parts[0] === "entities"
      ? data.type || entityTypes[parts[1]] || "entity"
      : parts[0] === "overview"
        ? parts[1]?.replace(".md", "")
        : parts[0] === "docs" && parts[1] === "prds"
          ? "prd"
          : productDocs.has(slug)
            ? slug
            : data.type || "document";
  const headingTitle = raw.content.match(/^#\s+(.+)$/m)?.[1];
  const title = String(
    type === "objectives"
      ? headingTitle || data.title || nice(slug)
      : data.title || headingTitle || nice(slug),
  );
  const outcomeId =
    type === "objectives" ? raw.content.match(/^#\s+(PO-[\w-]+)/m)?.[1] : "";
  return {
    key: relative,
    id: String(data.id || outcomeId || slug),
    type,
    title,
    path: `.nanopm/wiki/${relative}`,
    status: data.status ? String(data.status) : "",
    priority: data.priority ? String(data.priority) : "",
    theme: data.theme ? String(data.theme) : "",
    provenance: data.provenance ? String(data.provenance) : "",
    evidenceSources: list(data.evidence_sources),
    linkedObjectives: list(data.linked_objectives),
    opportunity: data.opportunity ? String(data.opportunity) : "",
    lens: data.lens ? String(data.lens) : "",
    appetite: data.appetite ? String(data.appetite) : "",
    impact: data.impact ? String(data.impact) : "",
    updated: sourceDate(data.last_updated || data.generated),
    summary: firstText(raw.content),
    assumption: firstText(section(raw.content, "Riskiest assumption")),
    test: firstText(section(raw.content, "Cheapest test")),
    body: raw.content,
  };
}

export function parseRoadmap(body) {
  const lanes = { now: [], next: [], later: [] };
  let lane = "";
  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      const h = heading[1].toLowerCase();
      lane = /\bnow\b/.test(h)
        ? "now"
        : /\bnext\b/.test(h)
          ? "next"
          : /\blater\b/.test(h)
            ? "later"
            : "";
    }
    if (lane && /^[-*]\s+/.test(line))
      lanes[lane].push(line.replace(/^[-*]\s+/, "").trim());
    const cells = line
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean);
    if (cells.length >= 2 && /^(now|next|later)\b/i.test(cells[0])) {
      const key = cells[0].match(/^(now|next|later)/i)[1].toLowerCase();
      lanes[key].push({ title: cells[0], detail: cells.slice(1).join(" · ") });
    } else if (
      lane &&
      cells.length >= 2 &&
      !/^[-:]+$/.test(cells[0]) &&
      !/^(item|horizon)$/i.test(cells[0])
    ) {
      lanes[lane].push({ title: cells[0], detail: cells.slice(1).join(" · ") });
    }
  }
  return lanes;
}

export function extractSignals(body) {
  const signals = [];
  for (const paragraph of body.split(/\n\s*\n|(?=^[-*]\s)/m)) {
    const states = [
      ...new Set(
        paragraph.match(
          /\b(?:PARTIAL_SUPPORT|CONTRADICTED|UNPROVEN|UNKNOWN|UNTESTED|INCONCLUSIVE|SUPPORT_IN_SLICE|FAIL_IN_SLICE)\b/g,
        ) || [],
      ),
    ];
    if (
      states.length &&
      !/^\s*(?:For new learning|Each tested slice)\b/i.test(paragraph)
    )
      signals.push({ states, text: firstText(paragraph) });
  }
  return signals;
}

export function extractProofClaims(page) {
  const claims = [];
  const headings = [...page.body.matchAll(/^##\s+(.+)$/gm)];
  for (let index = 0; index < headings.length; index++) {
    const heading = headings[index];
    const body = page.body
      .slice(heading.index, headings[index + 1]?.index ?? page.body.length)
      .trim();
    const judgment = body.match(/\*\*Current judgment\.\*\*\s*([A-Z_]+)/);
    if (!judgment) continue;
    const title = heading[1].trim();
    const id = title.split(/\s+[—–-]\s+/)[0];
    claims.push({
      ...page,
      key: `${page.key}#${id}`,
      id,
      type: "proof-claim",
      title,
      status: judgment[1],
      summary: firstText(body),
      body,
      source: page.key,
    });
  }
  return claims;
}

export async function loadProject(projectRoot) {
  const root = path.resolve(projectRoot);
  const wiki = path.join(root, wikiPath);
  const stat = await fs.stat(wiki).catch(() => null);
  if (!stat?.isDirectory())
    throw new Error("No .nanopm/wiki directory in this folder.");
  const diagnostics = [];
  const files = await walk(wiki);
  const pages = files
    .map((file) => record(file, wiki, diagnostics))
    .filter(Boolean);
  const claims = pages
    .filter((x) => ["release-outcomes", "product-proof"].includes(x.type))
    .flatMap(extractProofClaims);
  const items = [...pages, ...claims];
  const opportunities = items.filter((x) => x.type === "opportunity");
  const solutions = items.filter((x) => x.type === "solution");
  const byId = new Map();
  for (const opportunity of opportunities) {
    const matches = byId.get(opportunity.id) || [];
    matches.push(opportunity);
    byId.set(opportunity.id, matches);
  }
  for (const [id, matches] of byId) {
    if (matches.length > 1)
      diagnostics.push(
        `duplicate opportunity id ${id}: ${matches.map((x) => x.path).join(", ")}`,
      );
  }
  for (const solution of solutions) {
    if (!solution.opportunity)
      diagnostics.push(`${solution.path}: missing opportunity parent`);
    else if (!byId.has(solution.opportunity))
      diagnostics.push(
        `${solution.path}: unresolved opportunity ${solution.opportunity}`,
      );
    else if (byId.get(solution.opportunity).length > 1) {
      diagnostics.push(
        `${solution.path}: ambiguous opportunity ${solution.opportunity}`,
      );
      solution.declaredOpportunity = solution.opportunity;
      solution.opportunity = "";
    }
  }
  const objective =
    items.find((x) => x.type === "objectives") ||
    items.find((x) => x.type === "objective");
  const current = items.find((x) => x.type === "current-work");
  const roadmap = items.find((x) => x.type === "roadmap");
  const evidence = pages.filter((x) =>
    [
      "evidence",
      "feedback",
      "release-outcomes",
      "product-proof",
      "release-proof",
    ].includes(x.type),
  );
  const signals = evidence
    .filter((x) => ["evidence", "feedback"].includes(x.type))
    .flatMap((item) =>
      extractSignals(item.body).map((signal) => ({
        ...signal,
        source: item.key,
        updated: item.updated,
      })),
    );
  const recent = [...pages]
    .filter((x) => x.updated)
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 12);
  return {
    project: root,
    items,
    opportunities,
    solutions,
    claims,
    objective,
    current,
    roadmap: roadmap ? { ...roadmap, lanes: parseRoadmap(roadmap.body) } : null,
    evidence,
    signals,
    recent,
    diagnostics,
  };
}
