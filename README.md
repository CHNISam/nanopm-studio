# NanoPM Studio

NanoPM Studio is a local, browser-based Product management surface for [NanoPM](https://github.com/nmrtn/nanopm). It turns an existing `.nanopm/wiki` into a current Product view, an Opportunity Solution Tree, sortable Opportunity and Solution tables, explicit evidence signals, a Now–Next–Later roadmap, structured detail panels, and global search. The files in `.nanopm/` remain the Product source of truth.

## Run

Requires Node.js 20 or newer. Windows, macOS, and Linux are supported.

```sh
npm install
npm run build
npm link
cd /path/to/a/NanoPM/project
nanopm-studio
```

The command binds an available port on `127.0.0.1`, opens the default browser, and stops when you stop the terminal process. Use `nanopm-studio --project /absolute/path/to/project` from elsewhere. Use `--no-open` when browser launching is undesirable. There is no account, daemon, or external database.

For development:

```sh
npm install
npm run dev
```

Run the API separately with `npm start -- --project /absolute/path/to/project --no-open`. Vite proxies `/api` to the local API during development.

## How to use it

- **Current** shows the outcome, active Opportunities, selected Solution bets, explicit unproven or unknown evidence signals, and recent NanoPM page changes.
- **Product tree** uses the objective links and each Solution's single Opportunity parent. Assumption and test text is shown under its Solution when present.
- **Opportunities** and **Solutions** offer sorting, text search, status filters, and structured details. Select a row to open the detail panel.
- **Evidence & learning** extracts only explicit verdict words from NanoPM evidence pages. Read the cited source narrative for scope and limitations.
- **Roadmap** presents the canonical Product roadmap's Now, Next, and Later horizons.
- Press **Ctrl+K** (or **⌘K**) for global navigation across NanoPM entities and pages.

The browser refreshes the model every three seconds, so agent or human edits to `.nanopm/` appear without an import step. Malformed files and unresolved Solution parents are reported in source diagnostics. Product decisions are currently read-only in Studio; make them through NanoPM's canonical skills and files. Studio does not call Backlog.md or create execution state.

## Architecture

`server/model.js` parses the wiki into a disposable snapshot. `server/app.js` serves that snapshot and the browser bundle. `server/cli.js` binds to loopback and opens the browser. `src/` contains the React interface. There is no persistent Studio Product store or secondary index. Search filters the current snapshot, which is small for the known NanoPM projects. See [architecture notes](docs/architecture.md).

The adapter reads canonical NanoPM frontmatter, section headings, and roadmap tables/headings. It does not infer evidence verdicts. NanoPM's query, ingest, lint, and skill workflows remain authoritative for Product reasoning and mutation. The official NanoPM Viewer is a reference, not a dependency.

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Tests cover parsing, explicit relations, roadmap structures, malformed source handling, and evidence labels. The browser test uses a temporary fixture by default and checks external file updates. Set `NANOPM_ACCEPTANCE` to a current `develop` checkout of [Nameless Reach](https://github.com/CHNISam/LiteTavern-Prototype) to run its real Product acceptance assertions. If using an installed Chromium instead of Playwright's browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to that executable path.

## License and attribution

NanoPM Studio is MIT licensed; see [LICENSE](LICENSE). NanoPM itself is MIT licensed, copyright its respective contributors. The Studio adapter is independent code built against NanoPM's published file conventions. React, TanStack Table, cmdk, gray-matter, Express, React Markdown, Vite, and Lucide are permissively licensed dependencies. Product interaction research included Plane and Backlog.md; their code is not copied into this repository.
