import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function createProject() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nanopm-studio-test-"));
  await writePage(
    root,
    "docs/objectives.md",
    "---\ntype: objectives\ntitle: Current Product Outcome\n---\n# PO-1 — valuable outcome\n",
  );
  await writePage(
    root,
    "entities/opportunities/need.md",
    "---\nid: need\ntype: opportunity\ntitle: Find a worthwhile direction\nstatus: ready-for-solutions\npriority: high\nlinked_objectives: [PO-1]\n---\nNeed",
  );
  await writePage(
    root,
    "entities/solutions/idea.md",
    "---\nid: idea\ntype: solution\ntitle: Authored cues\nopportunity: need\nstatus: proposed\n---\n## Riskiest assumption\nPlayers notice cues.\n## Cheapest test\nWatch players.",
  );
  await writePage(
    root,
    "docs/evidence.md",
    "---\ntype: evidence\n---\nPO-1 is UNPROVEN.",
  );
  await writePage(
    root,
    "docs/roadmap.md",
    "---\ntype: roadmap\n---\n| Horizon | Result |\n| --- | --- |\n| Now | Test cues |\n| Next | Improve cues |\n| Later | Expand |",
  );
  return root;
}

export async function writePage(root, relative, content) {
  const file = path.join(root, ".nanopm/wiki", relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
  return file;
}
