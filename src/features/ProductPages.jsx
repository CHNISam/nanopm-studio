import React, { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Badge, Empty, ItemLink } from "../components/ProductUI.jsx";
import { date, low, pretty } from "../model.js";
export function Current({ data, select, go }) {
  const active = data.opportunities.filter((x) => x.status !== "archived");
  const bets = data.solutions.filter((x) =>
    ["chosen", "speccing", "shortlisted"].includes(x.status),
  );
  const uncertain = data.signals
    .filter((x) =>
      x.states.some((state) =>
        ["UNPROVEN", "UNKNOWN", "UNTESTED"].includes(state),
      ),
    )
    .slice(0, 4);
  return (
    <>
      <div className="hero">
        <span className="eyebrow">PRODUCT CONTROL SURFACE</span>
        <h2>{data.objective?.title || "No Product Outcome recorded"}</h2>
        <p>
          {data.objective?.summary ||
            "Add an objectives page to the NanoPM wiki to show the current outcome here."}
        </p>
        {data.objective && (
          <ItemLink item={data.objective} select={select}>
            Open outcome
          </ItemLink>
        )}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h3>Active opportunities</h3>
            <button onClick={() => go("opportunities")}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {active.length ? (
            active.map((item) => (
              <button
                key={item.key}
                className="stack-row"
                onClick={() => select(item)}
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.theme || item.id}</small>
                </span>
                <Badge value={item.status} />
              </button>
            ))
          ) : (
            <Empty
              title="No active opportunities"
              text="NanoPM has no active Opportunity pages."
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Current solution bets</h3>
            <button onClick={() => go("solutions")}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {bets.length ? (
            bets.map((item) => (
              <button
                key={item.key}
                className="stack-row"
                onClick={() => select(item)}
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>{pretty(item.opportunity)}</small>
                </span>
                <Badge value={item.status} />
              </button>
            ))
          ) : (
            <div className="quiet">
              No solution has been shortlisted or chosen.{" "}
              {data.solutions.length} candidates remain proposed.
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Unknown or unproven</h3>
            <button onClick={() => go("evidence")}>
              Evidence <ArrowRight size={14} />
            </button>
          </div>
          {uncertain.length ? (
            uncertain.map((s, i) => (
              <button
                key={i}
                className="signal-row"
                onClick={() =>
                  select(data.items.find((x) => x.key === s.source))
                }
              >
                <Badge
                  value={s.states.find((state) =>
                    ["UNPROVEN", "UNKNOWN", "UNTESTED"].includes(state),
                  )}
                />
                <span>{s.text}</span>
              </button>
            ))
          ) : (
            <div className="quiet">
              No explicit unknown or unproven claims found in the evidence
              pages.
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Recently updated</h3>
          </div>
          {data.recent.slice(0, 6).map((item) => (
            <button
              className="stack-row"
              key={item.key}
              onClick={() => select(item)}
            >
              <span>
                <strong>{item.title}</strong>
                <small>{pretty(item.type)}</small>
              </span>
              <time>{date(item.updated)}</time>
            </button>
          ))}
        </section>
      </div>
    </>
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
          <small>{opportunity.priority}</small>
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
            <p className="muted">No linked solutions</p>
          )}
        </div>
      </details>
    );
  return (
    <section className="panel tree-panel">
      <p className="section-intro">
        Only explicit NanoPM objective and parent links form the tree. Open a
        node to inspect its Product context.
      </p>
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
          text="NanoPM Opportunity pages will appear here."
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
      <div className="evidence-summary">
        <div>
          <strong>{data.evidence.length}</strong>
          <span>Evidence & proof pages</span>
        </div>
        <div>
          <strong>{data.claims?.length || 0}</strong>
          <span>Explicit proof judgments</span>
        </div>
        <div>
          <strong>{data.signals.length}</strong>
          <span>Source signals</span>
        </div>
      </div>
      <p className="section-intro">
        Judgments and labels below come from NanoPM sources. Technical checks do
        not become Product proof.
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
          <h3>Product proof judgments</h3>
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
          <h3>Evidence signals</h3>
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
          title="No explicit evidence signals"
          text="Evidence pages remain available through search and the source narrative."
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
        Product roadmap horizons from the canonical NanoPM roadmap. These are
        not execution statuses.
      </p>
      <div className="roadmap-grid">
        {["now", "next", "later"].map((lane) => (
          <section className="roadmap-lane" key={lane}>
            <div className="lane-title">
              <span className="lane-dot" />
              <h3>{pretty(lane)}</h3>
              <small>{lanes[lane].length}</small>
            </div>
            {lanes[lane].map((entry, i) => (
              <div className="roadmap-card" key={i}>
                <strong>
                  {typeof entry === "string" ? entry : entry.title}
                </strong>
                {entry.detail && <p>{entry.detail}</p>}
              </div>
            ))}
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
