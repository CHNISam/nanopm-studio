import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Empty, ItemLink } from "../components/ProductUI.jsx";
import { date, low, pretty } from "../model.js";

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
    <section className="panel tree-panel">
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
