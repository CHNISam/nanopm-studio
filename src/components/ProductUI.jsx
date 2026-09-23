import React, { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDownUp, ArrowRight, CircleHelp, Search, X } from "lucide-react";
import { date, low, pretty } from "../model.js";
export function Badge({ value, tone }) {
  return value ? (
    <span className={`badge ${tone || low(value).replaceAll(" ", "-")}`}>
      {pretty(value)}
    </span>
  ) : (
    <span className="muted">—</span>
  );
}
export function Meta({ label, children }) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong>{children || "—"}</strong>
    </div>
  );
}
export function Empty({ title, text }) {
  return (
    <div className="empty">
      <CircleHelp size={22} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function ItemLink({ item, select, children }) {
  return item ? (
    <button className="text-link" onClick={() => select(item)}>
      {children || item.title}
      <ArrowRight size={14} />
    </button>
  ) : (
    <span className="muted">—</span>
  );
}

export function Grid({
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
          <table style={{ width: table.getTotalSize() }}>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th
                      key={header.id}
                      className={header.column.columnDef.meta?.className}
                      style={{ width: header.getSize() }}
                    >
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
                    <td
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className}
                      style={{ width: cell.column.getSize() }}
                    >
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

export function Detail({ item, data, select, close }) {
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
          <h3>Details</h3>
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
              Opportunity <ItemLink item={parent} select={select} />
            </p>
          )}
          {children.length > 0 && (
            <div className="related">
              <span>Solutions</span>
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
            <Meta label="Evidence">{item.evidenceSources.join(", ")}</Meta>
          )}
        </section>
        <section className="detail-section narrative">
          <h3>Full description</h3>
          <p className="source-path">{item.path}</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.body}</ReactMarkdown>
        </section>
      </aside>
    </div>
  );
}
