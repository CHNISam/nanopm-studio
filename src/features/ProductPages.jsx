import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Empty, ItemLink } from "../components/ProductUI.jsx";
import { date, low, pretty } from "../model.js";
import { decisionForSolution, decisionSnapshot } from "../decision.js";

function SourceNote({ item, select, children }) {
  return item ? (
    <ItemLink item={item} select={select}>
      {children || item.title}
    </ItemLink>
  ) : (
    <span className="muted">Unspecified in .nanopm/wiki</span>
  );
}

export function DecisionBrief({ data, select }) {
  const view = decisionSnapshot(data);
  const personas = data.items.find(
    (item) => item.type === "personas" || item.key === "docs/personas.md",
  );
  const context = data.items.find((item) => item.type === "product");
  const strategy = data.items.find((item) => item.type === "strategy");
  const relevant = view.opportunities.filter((item) =>
    item.linkedObjectives.includes(data.objective?.id),
  );
  const focusExcerpt = data.current?.body
    .match(/^# Now\s*\n([\s\S]*?)(?=^##\s|$)/m)?.[1]
    ?.split(/\n\s*\n/)
    .slice(0, 3)
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`]/g, "")
    .slice(0, 440);
  const productExcerpt = context?.body
    .match(/^\| Anime[^\n]+/m)?.[0]
    ?.split("|")?.[2]
    ?.trim();
  return (
    <section className="decision-brief" aria-label="Product decision brief">
      <div className="brief-heading">
        <span className="eyebrow">DECISION BRIEF · SOURCE: .NANOPM</span>
        <h2>What needs a decision now?</h2>
        <p>
          Source links open the canonical page. Missing relations remain
          unspecified.
        </p>
      </div>
      <div className="brief-grid">
        <article className="brief-card">
          <span className="brief-number">01 / WHO & JOB</span>
          <h3>For whom, in what situation?</h3>
          <SourceNote item={personas} select={select}>
            {personas?.title}
          </SourceNote>
          {!personas && (
            <p>
              No Persona / JTBD page. The Opportunity below describes a need;
              its segment and anti-persona remain unspecified here.
            </p>
          )}
        </article>
        <article className="brief-card">
          <span className="brief-number">02 / OUTCOME</span>
          <h3>What change are we testing?</h3>
          <strong>{data.objective?.title || "Unspecified"}</strong>
          <p>{data.objective?.summary}</p>
          <SourceNote item={data.objective} select={select}>
            Open outcome
          </SourceNote>
        </article>
        <article className="brief-card">
          <span className="brief-number">03 / OPPORTUNITY</span>
          <h3>Which needs link to the Outcome?</h3>
          <strong>{relevant.length} linked Opportunities</strong>
          <div className="brief-list">
            {relevant.map((item) => (
              <SourceNote key={item.key} item={item} select={select} />
            ))}
          </div>
          {!relevant.length && <p>No explicit links recorded.</p>}
        </article>
        <article className="brief-card">
          <span className="brief-number">04 / SOLUTION SPACE</span>
          <h3>Which candidates exist?</h3>
          <strong>{view.solutions.length} candidate Solutions</strong>
          <p>
            Grouped by Opportunity below. Compare their explicit Outcome links,
            assumptions and cheapest tests.
          </p>
          <a href="#opportunity-map">Compare candidates ↓</a>
        </article>
        <article className="brief-card">
          <span className="brief-number">05 / STRATEGY & SCOPE</span>
          <h3>What is the current bet?</h3>
          {productExcerpt && (
            <p className="source-excerpt">Source excerpt: {productExcerpt}</p>
          )}
          <SourceNote item={strategy || context} select={select}>
            {strategy?.title || context?.title}
          </SourceNote>
          <p>
            Release membership and prerequisites are unspecified in structured
            source. An Outcome link alone does not establish either.
          </p>
        </article>
        <article className="brief-card">
          <span className="brief-number">06 / EVIDENCE</span>
          <h3>What has Product proof?</h3>
          <strong>
            {view.proof.total
              ? `${view.proof.unproven} / ${view.proof.total} explicit claims UNPROVEN`
              : "No structured Product claims"}
          </strong>
          <p>
            Assumptions and cheapest tests are shown on each candidate.
            Technical PASS is a separate proof type.
          </p>
          <SourceNote item={data.evidence?.[0]} select={select}>
            Open evidence
          </SourceNote>
        </article>
        <article className="brief-card brief-focus">
          <span className="brief-number">07 / FOCUS & NEXT</span>
          <h3>What should we examine next?</h3>
          {focusExcerpt && (
            <p className="source-excerpt">
              Current-work excerpt: {focusExcerpt}…
            </p>
          )}
          <SourceNote item={data.current || data.roadmap} select={select}>
            {data.current?.title || "Open roadmap"}
          </SourceNote>
          <p>Now / Next / Later is Product direction, not delivery status.</p>
        </article>
      </div>
    </section>
  );
}

export function Tree({ data, select }) {
  const [term, setTerm] = useState("");
  const matches = (opportunity) =>
    !term ||
    low(opportunity.title).includes(low(term)) ||
    low(opportunity.status).includes(low(term)) ||
    data.solutions.some(
      (solution) =>
        solution.opportunity === opportunity.id &&
        (low(solution.title).includes(low(term)) ||
          low(solution.status).includes(low(term))),
    );
  const linked = (id) =>
    data.opportunities.filter((x) => x.linkedObjectives.includes(id));
  const root = data.objective;
  const opps = root ? linked(root.id) : data.opportunities;
  const unlinked = root
    ? data.opportunities.filter((x) => !x.linkedObjectives.includes(root.id))
    : [];
  const renderOpp = (opportunity) =>
    matches(opportunity) && (
      <details className="tree-node" key={opportunity.key} open>
        <summary>
          <button
            onClick={(e) => {
              e.preventDefault();
              select(opportunity);
            }}
          >
            {opportunity.title}
          </button>
          <Badge value={opportunity.status} />
          <Badge value={opportunity.priority} tone="subtle" />
        </summary>
        <div className="tree-children">
          {data.solutions
            .filter(
              (x) =>
                x.opportunity === opportunity.id &&
                (!term ||
                  low(opportunity.title).includes(low(term)) ||
                  low(x.title).includes(low(term)) ||
                  low(x.status).includes(low(term))),
            )
            .map((solution) => (
              <details className="tree-node tree-solution" key={solution.key}>
                <summary>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      select(solution);
                    }}
                  >
                    {solution.title}
                  </button>
                  <Badge value={solution.status} />
                  <span className="relation-label">
                    {decisionForSolution(solution, root).outcome === "linked"
                      ? `Linked to outcome ${root.id}`
                      : "No explicit outcome link"}
                  </span>
                  <span className="relation-label neutral">
                    Release scope unspecified
                  </span>
                  <span className="relation-label neutral">
                    Evidence: {pretty(solution.provenance) || "unspecified"}
                  </span>
                </summary>
                {(solution.assumption || solution.test) && (
                  <div
                    className="tree-facts"
                    aria-label="Assumption and test summary"
                  >
                    {solution.assumption && (
                      <div className="tree-leaf" title={solution.assumption}>
                        <b>Assumption</b> {solution.assumption}
                      </div>
                    )}
                    {solution.test && (
                      <div className="tree-leaf" title={solution.test}>
                        <b>Test</b> {solution.test}
                      </div>
                    )}
                  </div>
                )}
              </details>
            ))}
          {!data.solutions.some((x) => x.opportunity === opportunity.id) && (
            <p className="muted">No solutions</p>
          )}
        </div>
      </details>
    );
  return (
    <section className="panel tree-panel" id="opportunity-map">
      <div className="tree-explainer">
        <h2>Opportunity → candidate solutions</h2>
        <p>
          Indentation shows the Solution’s Opportunity parent. It does not
          establish Outcome membership, Release scope, or a prerequisite.
        </p>
      </div>
      <label className="search-field tree-search">
        <Search size={16} />
        <input
          aria-label="Search Product tree"
          placeholder="Find opportunity or solution"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </label>
      {root && (
        <div className="tree-root">
          <button onClick={() => select(root)}>
            <span className="eyebrow">OUTCOME</span>
            <strong>{root.title}</strong>
          </button>
        </div>
      )}
      {opps.map(renderOpp)}
      {unlinked.length > 0 && (
        <>
          <h3>Other opportunities</h3>
          {unlinked.map(renderOpp)}
        </>
      )}
      {!data.opportunities.length && (
        <Empty
          title="No opportunities yet"
          text="Create an Opportunity in NanoPM to see it here."
        />
      )}
    </section>
  );
}

export function Evidence({ data, select }) {
  const [term, setTerm] = useState("");
  const [state, setState] = useState("");
  const matches = (item) =>
    (!term ||
      low(
        `${item.title || ""} ${item.text || ""} ${item.summary || ""}`,
      ).includes(low(term))) &&
    (!state || item.status === state || item.states?.includes(state));
  const claims = (data.claims || []).filter(matches);
  const signals = data.signals.filter(matches);
  const states = [
    ...new Set(
      [
        ...(data.claims || []).map((item) => item.status),
        ...data.signals.flatMap((item) => item.states),
      ].filter(Boolean),
    ),
  ];
  return (
    <>
      <p className="section-intro">
        Review explicit Product judgments and their source evidence. Technical
        checks remain technical evidence.
      </p>
      <div className="toolbar">
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Search evidence"
            placeholder="Search claims and evidence"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter evidence state"
          value={state}
          onChange={(event) => setState(event.target.value)}
        >
          <option value="">All evidence states</option>
          {states.map((value) => (
            <option key={value} value={value}>
              {pretty(value)}
            </option>
          ))}
        </select>
        <span className="count">{claims.length + signals.length} results</span>
      </div>
      {claims.length > 0 && (
        <section className="proof-section">
          <h3>Claims · {claims.length}</h3>
          <div className="proof-grid">
            {claims.map((claim) => (
              <button
                key={claim.key}
                className="proof-card"
                onClick={() => select(claim)}
              >
                <div>
                  <strong>{claim.title}</strong>
                  <Badge value={claim.status} />
                </div>
                <p>
                  {claim.body.match(
                    /\*\*Scoped evidence at cutover\.\*\*\s*([^\n]+)/,
                  )?.[1] ||
                    claim.body.match(
                      /\*\*Current judgment\.\*\*\s*([^\n]+)/,
                    )?.[1] ||
                    claim.summary}
                </p>
                <small>{claim.source}</small>
              </button>
            ))}
          </div>
        </section>
      )}
      {signals.length ? (
        <section className="proof-section">
          <h3>Evidence notes · {signals.length}</h3>
          <div className="evidence-list">
            {signals.map((s, i) => (
              <button
                className="evidence-card"
                key={i}
                onClick={() =>
                  select(data.items.find((x) => x.key === s.source))
                }
              >
                <div>
                  {s.states.map((state) => (
                    <Badge key={state} value={state} />
                  ))}
                </div>
                <p>{s.text}</p>
                <small>
                  {s.source} · {date(s.updated)}
                </small>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <Empty
          title="No matching evidence"
          text="Try another search or judgment filter."
        />
      )}
      {data.evidence.length > 0 && (
        <div className="page-links">
          {data.evidence.map((x) => (
            <ItemLink key={x.key} item={x} select={select} />
          ))}
        </div>
      )}
    </>
  );
}

export function Roadmap({ data, select }) {
  const lanes = data.roadmap?.lanes;
  return data.roadmap ? (
    <>
      <p className="section-intro">
        Now, Next, and Later communicate Product direction, not delivery status.
      </p>
      <div className="roadmap-grid">
        {["now", "next", "later"].map((lane) => (
          <section className="roadmap-lane" key={lane}>
            <div className="lane-title">
              <span className="lane-dot" />
              <h3>{pretty(lane)}</h3>
              <small>{lanes[lane].length}</small>
            </div>
            {lanes[lane].length > 0 && (
              <ol
                className="roadmap-list"
                aria-label={`${pretty(lane)} roadmap items`}
              >
                {lanes[lane].map((entry, i) => (
                  <li className="roadmap-card" key={i}>
                    <span className="roadmap-order">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>
                        {typeof entry === "string" ? entry : entry.title}
                      </strong>
                      {entry.detail && <p>{entry.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {!lanes[lane].length && (
              <p className="quiet">No {lane} items recorded.</p>
            )}
          </section>
        ))}
      </div>
      <div className="page-links">
        <ItemLink item={data.roadmap} select={select}>
          Open full roadmap
        </ItemLink>
        {data.items
          .filter((x) => x.type === "strategy")
          .map((x) => (
            <ItemLink key={x.key} item={x} select={select}>
              Strategy
            </ItemLink>
          ))}
      </div>
    </>
  ) : (
    <Empty
      title="No Product roadmap"
      text="Add a NanoPM roadmap page to view its Now, Next, and Later horizons."
    />
  );
}
