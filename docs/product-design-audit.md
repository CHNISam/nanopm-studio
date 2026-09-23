# Decision surface audit · 2026-09-23

## Intended use

Studio reads `.nanopm/wiki` and helps a product owner decide what is known, which alternatives exist, what is linked, and what to test next. It is read-only. The seven questions are a cognitive checklist, not seven entity types or pages.

## Surface contracts

| Surface | Main judgment | First glance | Expand for | Next action | Success signal |
| --- | --- | --- | --- | --- | --- |
| Decision brief / current work | Where is the Product decision now? | Who source availability, Outcome, linked Opportunities, candidate count, proof summary, source excerpt for focus | Full current-work, strategy, Product choice and roadmap pages | Open the relevant source or candidate | Reader can answer seven questions and identify honest unknowns without source Markdown |
| Opportunity map | Which needs and candidates relate, and how? | Opportunity parent, Solution status, explicit Outcome link, missing Release relation, evidence provenance | Assumption, cheapest test, full detail | Compare alternatives and open detail | Event-created is not inferred as a VFP01 prerequisite |
| Opportunities | Which problem deserves attention? | Name, priority, lifecycle, provenance and solution count | Need, evidence sources, Outcome links and source | Investigate or compare solutions | Priority and evidence strength remain distinct |
| Solutions | What are the alternatives and explicit links? | Parent, status, Outcome link, provenance | Assumption, test, appetite, scope uncertainty | Compare candidates | Proposed is not read as selected, deferred or in Release |
| Evidence | Which Product claims are supported? | Explicit judgment and source | Full contract and observation | Run the test or inspect a claim | Technical PASS never becomes Product validation |
| Roadmap | What is Now / Next / Later? | Canonical lane order | Full source, promotion wording | Inspect Product gate | Horizon is not delivery status |
| Detail / navigation / search | What exactly does this item mean? | Typed relations, state, assumption and source | Narrative and original path | Follow a related entity or source | Opening from any route preserves context and returns correctly |

## Model decision

The current NanoPM schema supplies `opportunity`, `linked_objectives`, lifecycle `status`, `provenance`, `priority`, assumption and cheapest test. It does not supply a general structured Release scope or prerequisite relation. Studio shows the missing relation as unspecified. It presents narrative source excerpts as excerpts, never promotes them into typed facts. No schema delta is introduced in this repository; any future promotion needs a canonical upstream decision and migration rule.

The existing tree remains an Opportunity comparison map. Its Outcome grouping reflects the Opportunity's explicit objective link, while each candidate independently shows its own objective link. This avoids a visual parent relationship masquerading as a Release commitment. The brief uses existing pages; missing Persona/JTBD material is named as a gap.

## External patterns used

- [Teresa Torres's Opportunity Solution Tree](https://www.producttalk.org/2016/08/opportunity-solution-tree/) separates outcome, opportunity, solution and experiment; comparing options supports decisions.
- [Shape Up's appetite and scope](https://basecamp.com/shapeup/1.2-chapter-03) informed the separation of candidate appetite from a bet or scope commitment.
- [Jira Product Discovery views](https://www.atlassian.com/software/jira/product-discovery/guides/views/overview) and [insights](https://www.atlassian.com/software/jira/product-discovery/guides/insights/overview) informed table/list views, source context and details.
- [Linear initiatives](https://linear.app/docs/initiatives) informed distinct initiative properties and views, without copying its delivery model.

## Real-source acceptance boundary

The source-backed local acceptance subset contains 13 current `develop` wiki pages: current-work, objectives, product, roadmap, formal proof and outcome pages, three Opportunities and three Solutions. It has three Opportunity parents, three Solution candidates, 16 unproven formal claims and no broken parent diagnostics. It is a subset, not a complete private repository checkout. Browser tests and screenshots run against this subset using a local Chromium binary. The observed seven-question walkthrough below is a self-review of the UI, not an independent human study.

| Question | Answer available from Studio | Limit |
| --- | --- | --- |
| Who / Job | Current-work excerpt identifies a player without a salient direction and the need to discover a personally worthwhile pursuit | Persona, anti-persona and segment have no dedicated canonical page in the fetched subset |
| Outcome | PO-VFP01 tests a connected First Playable player value chain | A test objective, not achieved Product validation |
| Opportunity | Three explicit Outcome-linked Opportunities; current-work calls out direction discovery as active | The active marker is displayed as a labeled source excerpt, not a typed relation |
| Solution Space | Authored cues, state-derived exposure and event-created provider under the direction Opportunity | All are proposed, assumed alternatives |
| Strategy / Scope | Current Product choices and two explicit Solution links to PO-VFP01 | Release scope and prerequisite have no structured field; event-created's source prose says it is not a VFP01 prerequisite |
| Evidence / Confidence | 16 formal claims UNPROVEN; each candidate's assumption and cheapest test can be opened | Product proof cannot be inferred from technical checks |
| Focus / Next | Current-work excerpt names VFP-2/W170 composition, VFP-22 candidate and VFP-23 fresh-player adoption test; Roadmap holds Now / Next / Later | The promotion rule is narrative; no structured gate relation is projected |
