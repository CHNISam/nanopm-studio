// A projection of explicit NanoPM relations. Absence is not a negative scope decision.
export function decisionForSolution(solution, objective) {
  return {
    opportunityId: solution.opportunity || "",
    outcome:
      objective && solution.linkedObjectives?.includes(objective.id)
        ? "linked"
        : "no-explicit-link",
    release: "unspecified",
    prerequisite: "unspecified",
    status: solution.status || "unspecified",
    provenance: solution.provenance || "unspecified",
    assumption: solution.assumption || "",
    test: solution.test || "",
  };
}

export function decisionSnapshot(data) {
  const opportunities = data.opportunities || [];
  const solutions = (data.solutions || []).map((solution) => ({
    ...solution,
    ...decisionForSolution(solution, data.objective),
  }));
  return {
    opportunities,
    solutions,
    proof: {
      unproven: (data.claims || []).filter(
        (claim) => claim.status === "UNPROVEN",
      ).length,
      total: (data.claims || []).length,
    },
  };
}
