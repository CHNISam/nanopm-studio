# NanoPM Studio

NanoPM Studio is a local, browser-based Product management surface for [NanoPM](https://github.com/nmrtn/nanopm). It turns an existing `.nanopm/wiki` into a current Product view, Opportunity Solution Tree, structured Opportunity and Solution tables, explicit evidence signals, a Now–Next–Later roadmap, detail panels, and global search. `.nanopm/` remains the sole Product source of truth.

## Run

Requires Node.js 20 or newer. Windows is the maintained production platform. The local Node/browser architecture remains portable, with an inexpensive Linux build signal retained in CI.

```powershell
npm install
npm run build
npm link
cd D:\path\to\a\NanoPM\project
nanopm-studio
```

The command binds an available port on `127.0.0.1`, opens the default browser, and stops with the terminal process. Studio remembers the last successfully opened project in the normal per-user application configuration folder. You can also run `nanopm-studio .`, pass another positional folder, or use `nanopm-studio --project D:\path\to\project`; an explicit path always wins. Use `--no-open` when browser launching is undesirable. There is no account, daemon, or external database.

For development:

```powershell
npm install
npm run dev
```

Run the API separately with `npm start -- --project D:\path\to\project --no-open`. Vite proxies `/api` to the local API during development.

## How to use it

- **Current** shows the Product outcome, active Opportunities, selected Solution bets, explicit unproven or unknown evidence signals, and recent NanoPM changes.
- **Product tree** uses only explicit objective and Solution parent links. Assumption and Test summaries stay compact; full narrative remains in Detail.
- **Opportunities** and **Solutions** provide sorting, text search, status filters, a fixed identity column, and structured details.
- **Evidence & learning** exposes explicit source judgments with search and state filtering. Studio never strengthens Product proof.
- **Roadmap** presents canonical Now, Next, and Later Product horizons.
- Use the sidebar project switcher or **Ctrl+K** to open and switch recent projects without restarting Studio. Missing recent folders remain visible as unavailable.
- Product surfaces and open entity details have stable browser routes, including refresh and back/forward behavior.

The browser refreshes the model every three seconds, so Agent or human edits to `.nanopm/` appear without an import step. Malformed files and unresolved Solution parents are reported in source diagnostics. Product decisions remain read-only in Studio; make them through NanoPM's canonical skills and files. Studio does not call Backlog.md or create execution state.

## Architecture

`server/model.js` parses the wiki into a disposable snapshot. `server/app.js` serves the snapshot and browser bundle. `server/workspaces.js` owns bounded MRU preferences outside the project. `server/cli.js` binds to loopback and opens the browser. The React client separates routing and application state, API access, shared Product components, and Product surfaces. There is no persistent Studio Product store or secondary index. See [architecture notes](docs/architecture.md).

NanoPM's query, ingest, lint, and skill workflows remain authoritative for Product reasoning and mutation. The official NanoPM Viewer is a reference, not a dependency.

## Verify

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Tests cover parsing, explicit relations, roadmap structures, malformed source handling, evidence labels, ambiguous parent IDs, MRU persistence and deduplication, CLI restore and explicit override, HTTP project selection, stable routes, project switching, missing recent folders, external file updates, and malformed-file recovery. Browser failures save a screenshot under `test-results/`.

The [CI gate](.github/workflows/verify.yml) runs the full browser workflow on Windows Node 22 and repeats core checks on Windows Node 20. Ubuntu Node 22 provides a low-cost portability signal. Windows is the release criterion.

For the real acceptance case, set `NANOPM_ACCEPTANCE` to a clean checkout of the current `develop` branch of [Nameless Reach](https://github.com/CHNISam/LiteTavern-Prototype), then run `npm run test:browser`. Set `STUDIO_SCREENSHOT` to capture the real Current surface.

## License and attribution

NanoPM Studio is MIT licensed; see [LICENSE](LICENSE). NanoPM itself is MIT licensed, copyright its respective contributors. The Studio adapter is independent code built against NanoPM's published file conventions. React Router, TanStack Table, cmdk, Conf, open, gray-matter, Express, React Markdown, Vite, React, and Lucide are permissively licensed dependencies. Product interaction research included VS Code, Plane, and Backlog.md; their code is not copied into this repository.
