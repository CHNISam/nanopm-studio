import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { createApp } from "../server/app.js";
import { createWorkspaceStore } from "../server/workspaces.js";
import { createProject, writePage } from "./support/project.js";

async function captureFailure(page, name, error) {
  const directory = path.resolve("test-results");
  await fs.mkdir(directory, { recursive: true });
  await page
    .screenshot({ path: path.join(directory, `${name}.png`), fullPage: true })
    .catch(() => {});
  throw error;
}

test("browser navigates Product model, search, details, and external file changes", async () => {
  const own = !process.env.NANOPM_ACCEPTANCE;
  const root = own
    ? await createProject()
    : path.resolve(process.env.NANOPM_ACCEPTANCE);
  const config = await fs.mkdtemp(
    path.join(path.dirname(root), "nanopm-browser-config-"),
  );
  const workspaces = createWorkspaceStore({ cwd: config });
  const server = createApp(root, { workspaces }).listen(0, "127.0.0.1");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    const port = server.address().port;
    await page.goto(`http://127.0.0.1:${port}`);
    await page
      .getByRole("heading", { name: /PO-1|PO-VFP01/ })
      .first()
      .waitFor();
    if (!own) {
      const response = await page.request.get(
        `http://127.0.0.1:${port}/api/project`,
      );
      const snapshot = await response.json();
      assert.equal(snapshot.objective.id, "PO-VFP01");
      assert.equal(snapshot.opportunities.length, 3);
      assert.equal(snapshot.solutions.length, 3);
      assert.equal(
        snapshot.solutions.filter(
          (x) => x.opportunity === "find-a-worthwhile-direction",
        ).length,
        3,
      );
      assert.equal(snapshot.claims.length, 16);
      assert(snapshot.claims.every((x) => x.status === "UNPROVEN"));
      assert.deepEqual(Object.keys(snapshot.roadmap.lanes), [
        "now",
        "next",
        "later",
      ]);
      assert.deepEqual(snapshot.diagnostics, []);
    }
    if (process.env.STUDIO_SCREENSHOT)
      await page.screenshot({
        path: process.env.STUDIO_SCREENSHOT,
        fullPage: true,
      });
    if (process.env.STUDIO_SCREENSHOT_DIR) {
      await fs.mkdir(process.env.STUDIO_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({
        path: path.join(process.env.STUDIO_SCREENSHOT_DIR, "current.png"),
        fullPage: true,
      });
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Product tree" })
        .click();
      await page.screenshot({
        path: path.join(process.env.STUDIO_SCREENSHOT_DIR, "product-tree.png"),
        fullPage: true,
      });
    }
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Opportunities" })
      .click();
    assert.match(page.url(), /\/opportunities$/);
    await page.reload();
    await page.getByRole("heading", { name: "Opportunities" }).waitFor();
    if (process.env.STUDIO_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.STUDIO_SCREENSHOT_DIR, "opportunities.png"),
        fullPage: true,
      });
    if (!own) assert.equal(await page.locator("tbody tr").count(), 3);
    await page.getByRole("row", { name: /worthwhile direction/i }).click();
    await page
      .getByRole("complementary", { name: /opportunity detail/ })
      .getByRole("heading", { name: /worthwhile direction/i })
      .waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Solutions" })
      .click();
    await page
      .getByRole("row", { name: /Authored world-native cues|Authored cues/ })
      .waitFor();
    if (process.env.STUDIO_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.STUDIO_SCREENSHOT_DIR, "solutions.png"),
        fullPage: true,
      });
    if (!own) {
      await page
        .getByRole("combobox", { name: "Filter opportunity" })
        .selectOption("find-a-worthwhile-direction");
      assert.equal(await page.locator("tbody tr").count(), 3);
    }
    await page.keyboard.press("Control+k");
    await page
      .getByPlaceholder("Search Product entities, pages, and projects…")
      .fill("roadmap");
    await page
      .getByRole("option", { name: /roadmap/i })
      .first()
      .click();
    await page.getByRole("complementary", { name: /roadmap detail/ }).waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Evidence & learning" })
      .click();
    await page.locator(".badge", { hasText: "UNPROVEN" }).first().waitFor();
    if (process.env.STUDIO_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.STUDIO_SCREENSHOT_DIR, "evidence.png"),
        fullPage: true,
      });
    if (!own) assert.equal(await page.locator(".proof-card").count(), 16);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Roadmap" })
      .click();
    await page
      .getByText("Test PO-VFP01 connected player chain", { exact: false })
      .or(page.getByText("Test cues"))
      .first()
      .waitFor();
    if (process.env.STUDIO_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.STUDIO_SCREENSHOT_DIR, "roadmap.png"),
        fullPage: true,
      });
    if (own) {
      const file = path.join(
        root,
        ".nanopm/wiki/entities/opportunities/need.md",
      );
      await fs.appendFile(file, "\n\nUpdated externally.");
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Opportunities" })
        .click();
      await page.getByRole("row", { name: /worthwhile direction/i }).click();
      await page.getByText("Updated externally.").waitFor({ timeout: 7000 });
    }
    assert.equal(await page.locator("body").count(), 1);
    assert.deepEqual(pageErrors, []);
  } catch (error) {
    await captureFailure(page, "product-flow", error);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    workspaces.close();
    await fs.rm(config, { recursive: true, force: true });
    if (own) await fs.rm(root, { recursive: true, force: true });
  }
});

test("browser opens a project, filters the tree, and recovers after a malformed page is repaired", async () => {
  const root = await createProject();
  const broken = await writePage(
    root,
    "entities/solutions/broken.md",
    "---\nfoo: [unterminated\n---\n",
  );
  const config = await fs.mkdtemp(
    path.join(path.dirname(root), "nanopm-browser-config-"),
  );
  const workspaces = createWorkspaceStore({ cwd: config });
  const server = createApp("", { workspaces }).listen(0, "127.0.0.1");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page
      .getByRole("heading", { name: "Open a NanoPM project" })
      .waitFor();
    await page
      .getByRole("textbox", { name: "Project folder" })
      .fill("relative-folder");
    await page
      .getByRole("button", { name: "Open project", exact: true })
      .click();
    await page
      .getByRole("alert")
      .getByText(/absolute project folder/)
      .waitFor();
    await page.getByRole("textbox", { name: "Project folder" }).fill(root);
    await page
      .getByRole("button", { name: "Open project", exact: true })
      .click();
    await page.getByRole("heading", { name: /PO-1/ }).first().waitFor();
    await page.getByText("1 source diagnostics").waitFor();

    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Product tree" })
      .click();
    await page
      .getByRole("textbox", { name: "Search Product tree" })
      .fill("Authored cues");
    await page.getByRole("button", { name: "Authored cues" }).waitFor();

    await fs.writeFile(
      broken,
      "---\nid: repaired\ntype: solution\ntitle: Repaired candidate\nopportunity: need\nstatus: proposed\n---\n## Riskiest assumption\nA player notices it.\n",
    );
    await page
      .getByText("1 source diagnostics")
      .waitFor({ state: "detached", timeout: 7000 });
    await page
      .getByRole("textbox", { name: "Search Product tree" })
      .fill("Repaired candidate");
    await page.getByRole("button", { name: "Repaired candidate" }).waitFor();
    assert.deepEqual(pageErrors, []);
  } catch (error) {
    await captureFailure(page, "project-recovery", error);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    workspaces.close();
    await fs.rm(config, { recursive: true, force: true });
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("browser switches workspaces through recent projects without restarting", async () => {
  const first = await createProject();
  const second = await createProject();
  await writePage(
    first,
    "docs/objectives.md",
    "---\ntype: objectives\n---\n# PO-FIRST — first workspace outcome\n",
  );
  await writePage(
    second,
    "docs/objectives.md",
    "---\ntype: objectives\n---\n# PO-SECOND — second workspace outcome\n",
  );
  const config = await fs.mkdtemp(
    path.join(path.dirname(first), "nanopm-browser-config-"),
  );
  const workspaces = createWorkspaceStore({ cwd: config });
  await workspaces.remember(first);
  const server = createApp(second, { workspaces }).listen(0, "127.0.0.1");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    await page.goto(url);
    await page.getByRole("heading", { name: /PO-SECOND/ }).waitFor();
    await page.getByRole("button", { name: /CURRENT PROJECT/ }).click();
    await page.getByTitle(await fs.realpath(first)).click();
    await page.getByRole("heading", { name: /PO-FIRST/ }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/");

    await fs.rm(second, { recursive: true, force: true });
    await page.waitForTimeout(3200);
    await page.getByRole("button", { name: /CURRENT PROJECT/ }).click();
    const missing = page.getByTitle("Project folder is unavailable");
    assert.equal(await missing.isDisabled(), true);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    workspaces.close();
    await fs.rm(first, { recursive: true, force: true });
    await fs.rm(second, { recursive: true, force: true });
    await fs.rm(config, { recursive: true, force: true });
  }
});
