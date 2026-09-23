import test from "node:test";
import assert from "node:assert/strict";
import { decisionForSolution, decisionSnapshot } from "../src/decision.js";
import { loadProject } from "../server/model.js";

const outcome = { id: "PO-VFP01", title: "Connected player value" };
const opportunity = {
  id: "direction",
  title: "Find a direction",
  linkedObjectives: ["PO-VFP01"],
  priority: "high",
  status: "ready-for-solutions",
  provenance: "evidence-backed",
};
const candidate = {
  id: "event-created",
  title: "Event-created provider",
  opportunity: "direction",
  linkedObjectives: [],
  status: "proposed",
  provenance: "assumed",
  assumption: "It is needed",
  test: "Compare with cues",
};

test("opportunity parent does not imply an outcome, release, or prerequisite relation", () => {
  const relation = decisionForSolution(candidate, outcome);
  assert.equal(relation.opportunityId, "direction");
  assert.equal(relation.outcome, "no-explicit-link");
  assert.equal(relation.release, "unspecified");
  assert.equal(relation.prerequisite, "unspecified");
});

test("lifecycle, evidence provenance, priority and explicit outcome link remain separate", () => {
  const linked = {
    ...candidate,
    id: "authored",
    linkedObjectives: ["PO-VFP01"],
  };
  const view = decisionSnapshot({
    objective: outcome,
    opportunities: [opportunity],
    solutions: [candidate, linked],
    claims: [{ status: "UNPROVEN" }],
  });
  assert.equal(view.opportunities[0].priority, "high");
  assert.equal(view.opportunities[0].status, "ready-for-solutions");
  assert.equal(view.opportunities[0].provenance, "evidence-backed");
  assert.equal(view.solutions[0].status, "proposed");
  assert.equal(view.solutions[0].provenance, "assumed");
  assert.equal(view.solutions[0].outcome, "no-explicit-link");
  assert.equal(view.solutions[1].outcome, "linked");
  assert.equal(view.proof.unproven, 1);
});

test(
  "Nameless Reach develop source retains three candidate relations and unproven Product claims",
  { skip: !process.env.NANOPM_ACCEPTANCE },
  async () => {
    const data = await loadProject(process.env.NANOPM_ACCEPTANCE);
    const view = decisionSnapshot(data);
    assert.equal(data.objective.id, "PO-VFP01");
    assert.equal(view.opportunities.length, 3);
    assert.equal(view.solutions.length, 3);
    assert.equal(view.proof.unproven, 16);
    assert.deepEqual(
      view.solutions.map((x) => [
        x.id,
        x.opportunity,
        x.outcome,
        x.status,
        x.provenance,
      ]),
      [
        [
          "authored-world-cues",
          "find-a-worthwhile-direction",
          "linked",
          "proposed",
          "assumed",
        ],
        [
          "event-created-opportunities",
          "find-a-worthwhile-direction",
          "no-explicit-link",
          "proposed",
          "assumed",
        ],
        [
          "state-derived-opportunity-exposure",
          "find-a-worthwhile-direction",
          "linked",
          "proposed",
          "assumed",
        ],
      ],
    );
    assert(
      view.solutions.every(
        (x) => x.release === "unspecified" && x.prerequisite === "unspecified",
      ),
    );
  },
);
