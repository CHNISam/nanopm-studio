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

The existing tree remains an Opportunity comparison map. Its Outcome grouping reflects the Opportunity's explicit objective link, while each candidate independently shows its own objective link. This avoids a visual parent relationship masquerading as a Release commitment. The brief projects the target player from the canonical company page as a labeled excerpt, while leaving a specific segment and anti-persona unspecified. It also links the canonical Release judgment without treating the Release page's prose as a per-Solution scope edge.

## Source-of-Truth trace · current develop

Read direction: Studio snapshot → Nameless Reach `.nanopm/wiki` → NanoPM's existing model and skills. The `develop` tree at `ed1c6e88e4517031164c3aca83afed6e42ea25b2` contains 25 tracked files under `.nanopm/`: 19 Product pages, five INDEX/SCHEMA files and one README. All 25 were fetched by path and checked against their tree blob hashes. Studio recursively loaded all 19 pages, including the three unindexed capability/migration/learning pages that the prior indexed-only fixture missed. This verifies the complete tracked NanoPM Product surface at that commit; the private repository's non-Product files were not checked out locally.

| Judgment | Studio input | Canonical Project state | NanoPM capability / actual gap | Minimum action |
| --- | --- | --- | --- | --- |
| Who and Job | Company and current-work pages load; the brief projects the company's target statement | `overview/company.md` names the primary player; `current-work.md` names the no-direction situation. A specific segment and anti-persona are absent from all 19 Product pages | NanoPM supports personas and JTBD; this instance has no dedicated Persona page. The earlier projection defect is closed at component-test level | Retain the narrower unknown; do not fabricate a Persona |
| Outcome and Opportunities | Objective and all three explicit Opportunity links load | `docs/objectives.md` sets PO-VFP01 as a test, three Opportunity pages link it; `current-work.md` names the active one | Existing objectives, Opportunity links and lifecycle suffice | No change |
| Solution space | Three Solution pages load, with parent, lifecycle, provenance and independent objective links | Three proposed alternatives; two have explicit PO-VFP01 links, Event-created has none | Existing Solution model suffices | No change |
| Strategy and Release scope | Product choices and the Release judgment load and appear in the brief | Release is OPEN, UNPROVEN. Event-created's source prose says it is outside committed VFP01 scope, but its page has no structured Release-scope relation | NanoPM has typed `scope-in` / `scope-out` decisions in its separate state log, while this project's current Product authority is the wiki. No supported per-Solution Release edge is established here. The earlier projection defect is closed at component-test level | Leave each Solution's structured Release and prerequisite relation unspecified; do not infer it from prose, status, nesting or objective links |
| Evidence and confidence | Formal claims, provenance, assumptions and cheapest tests load | 16 formal claims are UNPROVEN; `provenance: assumed` on each Solution | Existing claim and provenance surfaces suffice | No change |
| Focus and next | Current-work and roadmap load | Current work points to VFP-2/W170, VFP-22 and VFP-23, with separate Now/Next/Later horizons | Existing source is adequate for a labeled excerpt | No change |

No new NanoPM model capability was proven necessary. In particular, nesting, objective links, status and prose do not authorize calling Event-created selected, validated, included in VFP01 or a prerequisite. A future structured scope claim requires an explicit decision in the project's canonical Product authority. The current dominant gap is real-source browser/visual validation, not another schema or Product-data change.

## External patterns used

- [Teresa Torres's Opportunity Solution Tree](https://www.producttalk.org/2016/08/opportunity-solution-tree/) separates outcome, opportunity, solution and experiment; comparing options supports decisions.
- [Shape Up's appetite and scope](https://basecamp.com/shapeup/1.2-chapter-03) informed the separation of candidate appetite from a bet or scope commitment.
- [Jira Product Discovery views](https://www.atlassian.com/software/jira/product-discovery/guides/views/overview) and [insights](https://www.atlassian.com/software/jira/product-discovery/guides/insights/overview) informed table/list views, source context and details.
- [Linear initiatives](https://linear.app/docs/initiatives) informed distinct initiative properties and views, without copying its delivery model.

## Real-source acceptance boundary

The local acceptance input now contains all 19 Product pages from `develop`, plus the five INDEX/SCHEMA files and `.nanopm/README.md` (25/25 tree blobs match). Studio loads 19 pages, three Opportunities, three candidate Solutions and 16 unproven formal claims, with no parsing diagnostics. The rendered brief passed an automated component test against these real pages; the full unit suite passed 17/17 after the build. `npm run build` and `npm run format:check` passed. The browser suite could not launch: local Chromium is absent, Playwright downloaded invalid archives, and the cloud browser blocked local loopback access. No screenshot or target-user visual judgment is claimed. The walkthrough below is a source-backed self-review, not an independent human study or browser PASS.

| Question | Answer available from Studio | Limit |
| --- | --- | --- |
| Who / Job | Company direction names the primary target player; current-work names the no-direction situation | Specific segment and anti-persona have no dedicated canonical page in the indexed set |
| Outcome | PO-VFP01 tests a connected First Playable player value chain | A test objective, not achieved Product validation |
| Opportunity | Three explicit Outcome-linked Opportunities; current-work calls out direction discovery as active | The active marker is displayed as a labeled source excerpt, not a typed relation |
| Solution Space | Authored cues, state-derived exposure and event-created provider under the direction Opportunity | All are proposed, assumed alternatives |
| Strategy / Scope | Current Product choices, Release OPEN/UNPROVEN judgment, and two explicit Solution links to PO-VFP01 | Per-Solution Release scope and prerequisite remain unspecified in structured data; event-created's source prose says it is not a VFP01 prerequisite |
| Evidence / Confidence | 16 formal claims UNPROVEN; each candidate's assumption and cheapest test can be opened | Product proof cannot be inferred from technical checks |
| Focus / Next | Current-work excerpt names VFP-2/W170 composition, VFP-22 candidate and VFP-23 fresh-player adoption test; Roadmap holds Now / Next / Later | The promotion rule is narrative; no structured gate relation is projected |
