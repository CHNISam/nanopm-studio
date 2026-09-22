import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  extractSignals,
  loadProject,
  parseRoadmap,
  section,
} from "../server/model.js";

test("NanoPM relationships, sections, roadmap, and explicit evidence states", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nanopm-studio-"));
  const write = async (name, body) => {
    const target = path.join(root, ".nanopm/wiki", name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body);
  };
  try {
    await write(
      "docs/objectives.md",
      "---\ntype: objectives\ntitle: Current Product Outcome\n---\n# PO-1 — target outcome\n",
    );
    await write(
      "entities/opportunities/need.md",
      "---\nid: need\ntype: opportunity\ntitle: Customer need\nstatus: ready-for-solutions\npriority: high\nlinked_objectives: [PO-1]\nlast_updated: 2026-09-22\n---\nNeed narrative",
    );
    await write(
      "entities/solutions/idea.md",
      "---\nid: idea\ntype: solution\ntitle: Possible solution\nopportunity: need\nstatus: proposed\n---\n## Riskiest assumption\nIt might work.\n\n## Cheapest test\nWatch a player.\n",
    );
    await write(
      "docs/evidence.md",
      "---\ntype: evidence\n---\nPO-1 is UNPROVEN.\n\nSA1 is CONTRADICTED.",
    );
    await write(
      "docs/roadmap.md",
      "---\ntype: roadmap\n---\n| Horizon | Result |\n| --- | --- |\n| Now — test | Watch players |\n| Next | Iterate |\n| Later | Expand |",
    );
    await write("entities/solutions/INDEX.md", "# index");
    const snapshot = await loadProject(root);
    assert.equal(snapshot.objective.id, "PO-1");
    assert.equal(snapshot.opportunities.length, 1);
    assert.equal(snapshot.opportunities[0].updated, "2026-09-22");
    assert.equal(
      snapshot.solutions[0].opportunity,
      snapshot.opportunities[0].id,
    );
    assert.equal(snapshot.solutions[0].assumption, "It might work.");
    assert.equal(snapshot.solutions[0].test, "Watch a player.");
    assert.equal(snapshot.roadmap.lanes.now[0].detail, "Watch players");
    assert.deepEqual(
      snapshot.signals.map((x) => x.states[0]),
      ["UNPROVEN", "CONTRADICTED"],
    );
    assert.equal(
      snapshot.items.some((x) => x.title === "Index"),
      false,
    );
    assert.deepEqual(snapshot.diagnostics, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("malformed file and broken parent are reported without hiding valid entities", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nanopm-studio-"));
  const dir = path.join(root, ".nanopm/wiki/entities/solutions");
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, "broken.md"),
      "---\na: [unterminated\n---\n",
    );
    await fs.writeFile(
      path.join(dir, "orphan.md"),
      "---\ntype: solution\nopportunity: missing\n---\n# Orphan",
    );
    const snapshot = await loadProject(root);
    assert.equal(snapshot.solutions.length, 1);
    assert.equal(snapshot.diagnostics.length, 2);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("section and roadmap heading forms", () => {
  assert.equal(
    section(
      "## Riskiest assumption\nOne.\n## Cheapest test\nTwo.",
      "Riskiest assumption",
    ),
    "One.",
  );
  assert.deepEqual(
    parseRoadmap(
      "## Now\n- Verify outcome\n## Next\n- Improve cue\n## Later\n- Extend world",
    ),
    { now: ["Verify outcome"], next: ["Improve cue"], later: ["Extend world"] },
  );
  assert.equal(extractSignals("The result is unknown.").length, 0);
});

test("duplicate Opportunity IDs never create ambiguous Solution tree edges", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nanopm-studio-"));
  const wiki = path.join(root, ".nanopm/wiki/entities");
  try {
    await fs.mkdir(path.join(wiki, "opportunities"), { recursive: true });
    await fs.mkdir(path.join(wiki, "solutions"), { recursive: true });
    await fs.writeFile(
      path.join(wiki, "opportunities/first.md"),
      "---\nid: same\ntype: opportunity\ntitle: First\n---\n",
    );
    await fs.writeFile(
      path.join(wiki, "opportunities/second.md"),
      "---\nid: same\ntype: opportunity\ntitle: Second\n---\n",
    );
    await fs.writeFile(
      path.join(wiki, "solutions/child.md"),
      "---\nid: child\ntype: solution\ntitle: Child\nopportunity: same\n---\n",
    );
    const snapshot = await loadProject(root);
    assert.equal(snapshot.opportunities.length, 2);
    assert.equal(snapshot.solutions[0].opportunity, "");
    assert.equal(snapshot.solutions[0].declaredOpportunity, "same");
    assert(
      snapshot.diagnostics.some((x) =>
        x.includes("duplicate opportunity id same"),
      ),
    );
    assert(
      snapshot.diagnostics.some((x) =>
        x.includes("ambiguous opportunity same"),
      ),
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
