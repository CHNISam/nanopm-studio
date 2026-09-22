import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Command } from "cmdk";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Compass,
  FileText,
  GitBranch,
  Layers3,
  ListFilter,
  Map,
  Search,
  X,
} from "lucide-react";
import "./style.css";
import "./evidence.css";

const views = [
  ["current", "Current", Compass],
  ["tree", "Product tree", GitBranch],
  ["opportunities", "Opportunities", Layers3],
  ["solutions", "Solutions", ListFilter],
  ["evidence", "Evidence & learning", BookOpen],
  ["roadmap", "Roadmap", Map],
];
const low = (x) => String(x || "").toLowerCase();
const pretty = (x) => String(x || "—").replaceAll("-", " ");
const date = (x) => (x ? x.slice(0, 10) : "—");

function Badge({ value, tone }) {
  return value ? (
    <span className={`badge ${tone || low(value).replaceAll(" ", "-")}`}>
      {pretty(value)}
    </span>
  ) : (
    <span className="muted">—</span>
  );
}
function Meta({ label, children }) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong>{children || "—"}</strong>
    </div>
  );
}
function Empty({ title, text }) {
  return (
    <div className="empty">
      <CircleHelp size={22} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function ItemLink({ item, select, children }) {
  return item ? (
    <button className="text-link" onClick={() => select(item)}>
      {children || item.title}
      <ArrowRight size={14} />
    </button>
  ) : (
    <span className="muted">—</span>
  );
}

function Grid({
  rows,
  columns,
  onSelect,
  query,
  setQuery,
  filter,
  setFilter,
  filters,
  parent,
  setParent,
  parents,
  empty,
}) {
  const [sorting, setSorting] = useState([]);
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matches = Object.values(row).some((value) =>
          low(value).includes(low(query)),
        );
        return (
          matches &&
          (!filter || row.status === filter) &&
          (!parent || row.opportunity === parent)
        );
      }),
    [rows, query, filter, parent],
  );
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return (
    <>
      <div className="toolbar">
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Search table"
            placeholder="Search this view"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {filters.map((x) => (
            <option key={x} value={x}>
              {pretty(x)}
            </option>
          ))}
        </select>
        {parents && (
          <select
            aria-label="Filter opportunity"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
          >
            <option value="">All opportunities</option>
            {parents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        )}
        <span className="count">{filtered.length} items</span>
      </div>
      {!filtered.length ? (
        <Empty title={empty} text="Try another search or status filter." />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      <button onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <ArrowDownUp size={12} />
                      </button>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={0}
                  onClick={() => onSelect(row.original)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelect(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Detail({ item, data, select, close }) {
  if (!item) return null;
  const parent = data.opportunities.find((x) => x.id === item.opportunity);
  const children =
    item.type === "opportunity"
      ? data.solutions.filter((x) => x.opportunity === item.id)
      : [];
  return (
    <div
      className="detail-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside className="detail" aria-label={`${item.type} detail`}>
        <div className="detail-top">
          <span className="eyebrow">{pretty(item.type)}</span>
          <button
            aria-label="Close detail"
            className="icon-button"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        <h2>{item.title}</h2>
        <div className="detail-badges">
          <Badge value={item.status} />
          <Badge value={item.priority} />
          {item.provenance && <Badge value={item.provenance} tone="subtle" />}
        </div>
        <section className="detail-section">
          <h3>Product context</h3>
          <div className="meta-grid">
            <Meta label="ID">{item.id}</Meta>
            <Meta label="Updated">{date(item.updated)}</Meta>
            {item.theme && <Meta label="Theme">{item.theme}</Meta>}
            {item.lens && <Meta label="Lens">{item.lens}</Meta>}
            {item.appetite && (
              <Meta label="Appetite">{pretty(item.appetite)}</Meta>
            )}
            {item.impact && <Meta label="Impact">{item.impact}</Meta>}
            {item.linkedObjectives?.length > 0 && (
              <Meta label="Linked outcome">
                {item.linkedObjectives.join(", ")}
              </Meta>
            )}
          </div>
          {parent && (
            <p className="relation">
              Parent opportunity <ItemLink item={parent} select={select} />
            </p>
          )}
          {children.length > 0 && (
            <div className="related">
              <span>Candidate solutions</span>
              {children.map((x) => (
                <ItemLink key={x.key} item={x} select={select} />
              ))}
            </div>
          )}
          {item.assumption && (
            <div className="callout">
              <small>Riskiest assumption</small>
              <p>{item.assumption}</p>
            </div>
          )}
          {item.test && (
            <div className="callout">
              <small>Cheapest test</small>
              <p>{item.test}</p>
            </div>
          )}
          {item.evidenceSources?.length > 0 && (
            <Meta label="Evidence sources">
              {item.evidenceSources.join(", ")}
            </Meta>
          )}
        </section>
        <section className="detail-section narrative">
          <h3>Source narrative</h3>
          <p className="source-path">{item.path}</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.body}</ReactMarkdown>
        </section>
      </aside>
    </div>
  );
}

function Current({ data, select, go }) {
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

function Tree({ data, select }) {
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
              <details className="tree-node" key={solution.key}>
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
                <div className="tree-children">
                  {solution.assumption && (
                    <div className="tree-leaf">
                      <b>Assumption</b> {solution.assumption}
                    </div>
                  )}
                  {solution.test && (
                    <div className="tree-leaf">
                      <b>Test</b> {solution.test}
                    </div>
                  )}
                </div>
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

function Evidence({ data, select }) {
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
      {data.claims?.length > 0 && (
        <section className="proof-section">
          <h3>Product proof judgments</h3>
          <div className="proof-grid">
            {data.claims.map((claim) => (
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
      {data.signals.length ? (
        <section className="proof-section">
          <h3>Evidence signals</h3>
          <div className="evidence-list">
            {data.signals.map((s, i) => (
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

function Roadmap({ data, select }) {
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

function App() {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [view, setView] = useState("current"),
    [selected, setSelected] = useState(null),
    [palette, setPalette] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [parent, setParent] = useState(""),
    [path, setPath] = useState("");
  async function refresh() {
    try {
      const response = await fetch("/api/project", { cache: "no-store" });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error);
      setData(next);
      setError("");
    } catch (err) {
      setError(err.message);
      setData(
        (old) =>
          old || {
            project: "",
            items: [],
            opportunities: [],
            solutions: [],
            evidence: [],
            signals: [],
            recent: [],
            diagnostics: [],
          },
      );
    }
  }
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const listener = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((open) => !open);
      }
      if (e.key === "Escape") {
        setPalette(false);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  async function openProject(e) {
    e.preventDefault();
    const response = await fetch("/api/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    const next = await response.json();
    if (!response.ok) setError(next.error);
    else {
      setData(next);
      setError("");
      setPath("");
      setSelected(null);
    }
  }
  const select = (item) => {
    if (item) {
      setSelected(item);
      setPalette(false);
    }
  };
  const c = createColumnHelper();
  const oppColumns = [
    c.accessor("title", {
      header: "Opportunity",
      cell: (x) => <strong>{x.getValue()}</strong>,
    }),
    c.accessor("theme", { header: "Theme" }),
    c.accessor("priority", {
      header: "Priority",
      cell: (x) => <Badge value={x.getValue()} />,
    }),
    c.accessor("status", {
      header: "Status",
      cell: (x) => <Badge value={x.getValue()} />,
    }),
    c.accessor("provenance", {
      header: "Provenance",
      cell: (x) => <Badge value={x.getValue()} tone="subtle" />,
    }),
    c.accessor("evidenceSources", {
      header: "Evidence source",
      cell: (x) => x.getValue()?.join(", ") || "—",
    }),
    c.accessor("linkedObjectives", {
      header: "Outcome",
      cell: (x) => x.getValue()?.join(", ") || "—",
    }),
    c.accessor(
      (row) => data.solutions.filter((x) => x.opportunity === row.id).length,
      { id: "solutions", header: "Solutions" },
    ),
    c.accessor("updated", {
      header: "Updated",
      cell: (x) => date(x.getValue()),
    }),
  ];
  const solColumns = [
    c.accessor("title", {
      header: "Solution",
      cell: (x) => <strong>{x.getValue()}</strong>,
    }),
    c.accessor(
      (row) =>
        data.opportunities.find((x) => x.id === row.opportunity)?.title ||
        row.opportunity,
      { id: "parent", header: "Opportunity" },
    ),
    c.accessor("status", {
      header: "Status",
      cell: (x) => <Badge value={x.getValue()} />,
    }),
    c.accessor("lens", { header: "Lens" }),
    c.accessor("appetite", {
      header: "Appetite",
      cell: (x) => pretty(x.getValue()),
    }),
    c.accessor("impact", { header: "Impact" }),
    c.accessor("assumption", {
      header: "Riskiest assumption",
      cell: (x) => <span className="truncate">{x.getValue() || "—"}</span>,
    }),
    c.accessor("test", {
      header: "Cheapest test",
      cell: (x) => <span className="truncate">{x.getValue() || "—"}</span>,
    }),
    c.accessor("updated", {
      header: "Updated",
      cell: (x) => date(x.getValue()),
    }),
  ];
  const title = views.find((x) => x[0] === view)?.[1];
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">N</span>
          <span>
            <strong>NanoPM</strong>
            <small>STUDIO</small>
          </span>
        </div>
        <div className="project-label">PRODUCT SPACE</div>
        <nav aria-label="Main navigation">
          {views.map(([key, label, Icon]) => (
            <button
              key={key}
              className={view === key ? "active" : ""}
              onClick={() => {
                setView(key);
                setQuery("");
                setFilter("");
                setParent("");
                setSelected(null);
              }}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setPalette(true)}>
            <Search size={16} /> Search anything <kbd>⌘ K</kbd>
          </button>
          <div className="project-root" title={data?.project}>
            {data?.project || "No project open"}
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="crumb">
            <span>Product</span>
            <ArrowRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="top-actions">
            <button className="top-search" onClick={() => setPalette(true)}>
              <Search size={15} /> Search <kbd>Ctrl K</kbd>
            </button>
            <span className="live-dot" title="Reads changes every 3 seconds" />{" "}
            Live from .nanopm
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">NANOPM WIKI</span>
              <h1>{title}</h1>
            </div>
            {data?.project && (
              <span className="project-name">
                {data.project.split(/[\\/]/).pop()}
              </span>
            )}
          </div>
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
          {!data ? (
            <div className="loading">Loading Product model…</div>
          ) : !data.project || (!data.items.length && !data.objective) ? (
            <section className="open-project">
              <h2>Open a NanoPM project</h2>
              <p>
                Enter the absolute path to a repository containing{" "}
                <code>.nanopm/wiki</code>.
              </p>
              <form onSubmit={openProject}>
                <input
                  aria-label="Project folder"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="C:\\path\\to\\project"
                  required
                />
                <button type="submit">Open project</button>
              </form>
            </section>
          ) : (
            <>
              {data.diagnostics.length > 0 && (
                <details className="diagnostics">
                  <summary>
                    {data.diagnostics.length} source diagnostics
                  </summary>
                  {data.diagnostics.map((x, i) => (
                    <p key={i}>{x}</p>
                  ))}
                </details>
              )}
              {view === "current" && (
                <Current data={data} select={select} go={setView} />
              )}
              {view === "tree" && <Tree data={data} select={select} />}
              {view === "opportunities" && (
                <Grid
                  rows={data.opportunities}
                  columns={oppColumns}
                  onSelect={select}
                  query={query}
                  setQuery={setQuery}
                  filter={filter}
                  setFilter={setFilter}
                  filters={[
                    ...new Set(
                      data.opportunities.map((x) => x.status).filter(Boolean),
                    ),
                  ]}
                  empty="No matching opportunities"
                />
              )}
              {view === "solutions" && (
                <Grid
                  rows={data.solutions}
                  columns={solColumns}
                  onSelect={select}
                  query={query}
                  setQuery={setQuery}
                  filter={filter}
                  setFilter={setFilter}
                  filters={[
                    ...new Set(
                      data.solutions.map((x) => x.status).filter(Boolean),
                    ),
                  ]}
                  parent={parent}
                  setParent={setParent}
                  parents={data.opportunities}
                  empty="No matching solutions"
                />
              )}
              {view === "evidence" && <Evidence data={data} select={select} />}
              {view === "roadmap" && <Roadmap data={data} select={select} />}
            </>
          )}
        </main>
      </div>
      {selected && data && (
        <Detail
          item={data.items.find((x) => x.key === selected.key) || selected}
          data={data}
          select={select}
          close={() => setSelected(null)}
        />
      )}
      {palette && data && (
        <div
          className="palette-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPalette(false);
          }}
        >
          <Command className="palette" label="Global search">
            <div className="palette-input">
              <Search size={19} />
              <Command.Input
                autoFocus
                placeholder="Search Product entities and pages…"
              />
            </div>
            <Command.List>
              <Command.Empty>No matching Product item.</Command.Empty>
              <Command.Group heading="Product items">
                {data.items.map((item) => (
                  <Command.Item
                    key={item.key}
                    value={`${item.title} ${item.id} ${item.type} ${item.summary}`}
                    onSelect={() => select(item)}
                  >
                    <FileText size={16} />
                    <span>
                      {item.title}
                      <small>
                        {pretty(item.type)} · {item.id}
                      </small>
                    </span>
                    <ArrowRight size={14} />
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            <div className="palette-footer">
              ↑↓ navigate · Enter open · Esc close
            </div>
          </Command>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
