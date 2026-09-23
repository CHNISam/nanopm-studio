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

The source-backed local acceptance subset contains 13 current `develop` wiki pages: current-work, objectives, product, roadmap, formal proof and outcome pages, three Opportunities and three Solutions. It has three Opportunity parents, three Solution candidates, 16 unproven formal claims and no broken parent diagnostics. It is a subset, not a complete private repository checkout. Full browser scenario and screenshots require a Chromium binary and the complete checkout; a model-level pass alone cannot establish product usability.
