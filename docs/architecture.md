# Architecture

NanoPM Studio is a local human control surface over an existing `.nanopm/wiki`. Upstream NanoPM owns schemas, query/ingest/lint commands, and human decision gates. The read-only adapter interprets frontmatter and canonical page structure, attaches only explicit parent and objective links, and reports broken references as diagnostics. It does not synthesize evidence verdicts.

The local Node service exposes one normalized Product snapshot and source content. React Router owns stable browser navigation for Current, Tree, Opportunities, Solutions, Evidence, Roadmap, and entity Detail. The CLI binds a random loopback port and uses `open` to launch the browser. The client polls for external file changes; no persistent Product index is created.

`server/workspaces.js` uses Conf for an atomic, bounded MRU in the operating system user configuration location. It stores only Studio preferences: last project, display name, last-opened time, and local path. Entries are persisted only after a NanoPM project parses successfully. Missing folders are reported as unavailable. No preference or derived state is written into `.nanopm`.

The client is split by responsibility: `src/app` owns routing and application lifecycle, `src/api` owns HTTP access, `src/components` owns reusable Product presentation, `src/features` owns management surfaces, and `src/model.js` holds shared formatting. NanoPM parsing and relations remain in the server adapter rather than React components.

## Sources and capability choices

The adapter follows upstream NanoPM opportunities, solutions, objectives, strategy, roadmap, PRD, ingest, schemas, Viewer PRD/source, and current Nameless Reach `develop` data. The official Viewer remains a reference rather than a dependency. Nameless Reach Product proof pages are parsed from explicit `Current judgment` sections without changing NanoPM's generic entity schema.

VS Code's workspace history provides the MRU pattern: explicit workspace precedence, recent ordering, deduplication, and graceful missing-entry handling. Plane's web package uses TanStack Table, cmdk, React Router, and other mature primitives; its AGPL implementation was studied but not copied. Backlog.md's MIT package informed the lightweight local CLI pattern.

Studio directly adopts permissive React Router, TanStack Table, cmdk, Conf, and open capabilities. Gray-matter parses NanoPM frontmatter, and React Markdown with remark-gfm renders secondary narrative. Native HTML details supplies Opportunity expansion without a custom tree state machine. Drag and drop has no valid NanoPM relationship mutation use case in this read-only release, so no dependency is included.

Windows is the maintained production platform. CI runs full browser coverage on Windows and keeps one low-cost Linux build signal. Complex Product decisions stay in upstream NanoPM skills and files.
