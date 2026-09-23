import React, { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { createColumnHelper } from "@tanstack/react-table";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  GitBranch,
  Layers3,
  ListFilter,
  Map,
  Search,
} from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Badge, Detail, Grid } from "../components/ProductUI.jsx";
import { Evidence, Roadmap, Tree } from "../features/ProductPages.jsx";
import { date, pretty } from "../model.js";
import { ProductProvider, useProduct } from "./ProductContext.jsx";

const views = [
  ["tree", "Product tree", GitBranch, "/"],
  ["opportunities", "Opportunities", Layers3, "/opportunities"],
  ["solutions", "Solutions", ListFilter, "/solutions"],
  ["evidence", "Evidence", BookOpen, "/evidence"],
  ["roadmap", "Roadmap", Map, "/roadmap"],
];
const validSurfaces = new Set(views.map(([key]) => key));
const columnHelper = createColumnHelper();
const surfacePath = (surface) => (surface === "tree" ? "/" : `/${surface}`);
const entityPath = (surface, item) =>
  `${surfacePath(surface).replace(/\/$/, "") || ""}/entity/${encodeURIComponent(item.type)}/${encodeURIComponent(item.id)}`;

function OpenProject({ recent = [], onOpen, compact = false }) {
  const [path, setPath] = useState("");
  return (
    <section className={compact ? "project-dialog" : "open-project"}>
      {!compact && <h2>Open a NanoPM project</h2>}
      <p>
        Enter a Windows folder containing <code>.nanopm\\wiki</code>.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (await onOpen(path)) setPath("");
        }}
      >
        <input
          aria-label="Project folder"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          placeholder="D:\\path\\to\\project"
          required
        />
        <button type="submit">Open project</button>
      </form>
      {!compact && recent.length > 0 && (
        <div className="recent-start">
          <span className="eyebrow">RECENT PROJECTS</span>
          {recent.map((project) => (
            <button
              key={project.path}
              disabled={!project.available}
              onClick={() => onOpen(project.path)}
              title={
                project.available
                  ? project.path
                  : "Project folder is unavailable"
              }
            >
              <FolderOpen size={16} />
              <span>
                {project.name}
                <small>
                  {project.available ? "NanoPM project" : "Folder unavailable"}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectSwitcher({ open, setOpen, onChoose, onAnother }) {
  const { data, workspaces } = useProduct();
  const name = data?.project?.split(/[\\/]/).pop() || "Open project";
  return (
    <div className="project-switcher">
      <button
        className="project-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>
          <small>CURRENT PROJECT</small>
          <strong>{name}</strong>
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="project-menu">
          <span className="menu-label">Recent projects</span>
          {workspaces.recent.map((project) => (
            <button
              key={project.path}
              disabled={!project.available}
              title={
                project.available
                  ? project.path
                  : "Project folder is unavailable"
              }
              onClick={() => onChoose(project.path)}
            >
              <FolderOpen size={15} />
              <span>
                {project.name}
                <small>{project.available ? "Available" : "Unavailable"}</small>
              </span>
              {project.path === data?.project && <Check size={14} />}
            </button>
          ))}
          <button onClick={onAnother}>
            <FolderOpen size={15} /> Open another project…
          </button>
        </div>
      )}
    </div>
  );
}

function Workspace() {
  const params = useParams();
  const navigate = useNavigate();
  const surface = params.surface || "tree";
  const { data, error, workspaces, selectProject } = useProduct();
  const [palette, setPalette] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [parent, setParent] = useState("");
  const title = views.find(([key]) => key === surface)?.[1];
  const selected = data?.items.find(
    (item) => item.type === params.type && String(item.id) === params.id,
  );

  useEffect(() => {
    const listener = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((value) => !value);
      }
      if (event.key === "Escape") {
        setPalette(false);
        setSwitcher(false);
        setProjectDialog(false);
        if (params.type) navigate(surfacePath(surface));
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [navigate, params.type, surface]);

  const invalidSurface = !validSurfaces.has(surface);
  const select = (item) => {
    if (item) {
      navigate(entityPath(surface, item));
      setPalette(false);
    }
  };
  const changeProject = async (path) => {
    const opened = await selectProject(path);
    if (opened) {
      setProjectDialog(false);
      setSwitcher(false);
      navigate("/");
    }
    return opened;
  };
  const opportunityColumns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Opportunity",
        size: 265,
        cell: (x) => <strong title={x.getValue()}>{x.getValue()}</strong>,
        meta: { className: "identity" },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 145,
        cell: (x) => <Badge value={x.getValue()} />,
      }),
      columnHelper.accessor("priority", {
        header: "Priority",
        size: 90,
        cell: (x) => <Badge value={x.getValue()} />,
      }),
      columnHelper.accessor("theme", { header: "Theme", size: 145 }),
      columnHelper.accessor("provenance", {
        header: "Provenance",
        size: 140,
        cell: (x) => <Badge value={x.getValue()} tone="subtle" />,
      }),
      columnHelper.accessor(
        (row) => data.solutions.filter((x) => x.opportunity === row.id).length,
        { id: "solutions", header: "Solutions", size: 80 },
      ),
      columnHelper.accessor("updated", {
        header: "Updated",
        size: 95,
        cell: (x) => date(x.getValue()),
      }),
    ],
    [data],
  );
  const solutionColumns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Solution",
        size: 250,
        cell: (x) => <strong title={x.getValue()}>{x.getValue()}</strong>,
        meta: { className: "identity" },
      }),
      columnHelper.accessor(
        (row) =>
          data.opportunities.find((x) => x.id === row.opportunity)?.title ||
          row.opportunity,
        { id: "parent", header: "Opportunity", size: 235 },
      ),
      columnHelper.accessor("status", {
        header: "Status",
        size: 110,
        cell: (x) => <Badge value={x.getValue()} />,
      }),
      columnHelper.accessor("lens", { header: "Lens", size: 90 }),
      columnHelper.accessor("appetite", {
        header: "Appetite",
        size: 100,
        cell: (x) => pretty(x.getValue()),
      }),
      columnHelper.accessor("updated", {
        header: "Updated",
        size: 95,
        cell: (x) => date(x.getValue()),
      }),
    ],
    [data],
  );

  if (invalidSurface) return <Navigate to="/" replace />;

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
        <ProjectSwitcher
          open={switcher}
          setOpen={setSwitcher}
          onChoose={changeProject}
          onAnother={() => {
            setSwitcher(false);
            setProjectDialog(true);
          }}
        />
        <nav aria-label="Main navigation">
          {views.map(([key, label, Icon, path]) => (
            <NavLink
              key={key}
              to={path}
              end={path === "/"}
              onClick={() => {
                setQuery("");
                setFilter("");
                setParent("");
              }}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setPalette(true)}>
            <Search size={16} /> Search anything <kbd>Ctrl K</kbd>
          </button>
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
            <OpenProject recent={workspaces.recent} onOpen={changeProject} />
          ) : (
            <>
              {data.diagnostics.length > 0 && (
                <details className="diagnostics">
                  <summary>
                    {data.diagnostics.length} source diagnostics
                  </summary>
                  {data.diagnostics.map((item, index) => (
                    <p key={index}>{item}</p>
                  ))}
                </details>
              )}
              {surface === "tree" && <Tree data={data} select={select} />}
              {surface === "opportunities" && (
                <Grid
                  rows={data.opportunities}
                  columns={opportunityColumns}
                  onSelect={select}
                  query={query}
                  setQuery={setQuery}
                  filter={filter}
                  setFilter={setFilter}
                  filters={[
                    ...new Set(
                      data.opportunities
                        .map((item) => item.status)
                        .filter(Boolean),
                    ),
                  ]}
                  empty="No matching opportunities"
                />
              )}
              {surface === "solutions" && (
                <Grid
                  rows={data.solutions}
                  columns={solutionColumns}
                  onSelect={select}
                  query={query}
                  setQuery={setQuery}
                  filter={filter}
                  setFilter={setFilter}
                  filters={[
                    ...new Set(
                      data.solutions.map((item) => item.status).filter(Boolean),
                    ),
                  ]}
                  parent={parent}
                  setParent={setParent}
                  parents={data.opportunities}
                  empty="No matching solutions"
                />
              )}
              {surface === "evidence" && (
                <Evidence data={data} select={select} />
              )}
              {surface === "roadmap" && <Roadmap data={data} select={select} />}
            </>
          )}
        </main>
      </div>
      {params.type && data && (
        <Detail
          item={selected}
          data={data}
          select={select}
          close={() => navigate(surfacePath(surface))}
        />
      )}
      {projectDialog && (
        <div
          className="palette-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setProjectDialog(false)
          }
        >
          <OpenProject onOpen={changeProject} compact />
        </div>
      )}
      {palette && data && (
        <div
          className="palette-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setPalette(false)
          }
        >
          <Command className="palette" label="Global search">
            <div className="palette-input">
              <Search size={19} />
              <Command.Input
                autoFocus
                placeholder="Search Product entities, pages, and projects…"
              />
            </div>
            <Command.List>
              <Command.Empty>No matching item.</Command.Empty>
              <Command.Group heading="Workspace">
                <Command.Item
                  onSelect={() => {
                    setPalette(false);
                    setProjectDialog(true);
                  }}
                >
                  <FolderOpen size={16} />
                  <span>
                    Open Project
                    <small>Choose a NanoPM repository by path</small>
                  </span>
                  <ArrowRight size={14} />
                </Command.Item>
                {workspaces.recent
                  .filter((item) => item.available)
                  .map((project) => (
                    <Command.Item
                      key={project.path}
                      value={`project ${project.name}`}
                      onSelect={() => changeProject(project.path)}
                    >
                      <FolderOpen size={16} />
                      <span>
                        {project.name}
                        <small>Recent project</small>
                      </span>
                      <ArrowRight size={14} />
                    </Command.Item>
                  ))}
              </Command.Group>
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

export function App() {
  return (
    <BrowserRouter>
      <ProductProvider>
        <Routes>
          <Route path="/" element={<Workspace />} />
          <Route path="/tree" element={<Navigate to="/" replace />} />
          <Route path="/entity/:type/:id" element={<Workspace />} />
          <Route path="/:surface" element={<Workspace />} />
          <Route path="/:surface/entity/:type/:id" element={<Workspace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProductProvider>
    </BrowserRouter>
  );
}
