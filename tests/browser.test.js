import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { createApp } from "../server/app.js";
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
  const server = createApp(root).listen(0, "127.0.0.1");
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
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Opportunities" })
      .click();
    if (!own) assert.equal(await page.locator("tbody tr").count(), 3);
    await page.getByRole("row", { name: /worthwhile direction/i }).click();
    await page
      .getByRole("complementary", { name: /opportunity detail/ })
      .getByRole("heading", { name: /worthwhile direction/i })
      .waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Solutions" })
      .click();
    await page
      .getByRole("row", { name: /Authored world-native cues|Authored cues/ })
      .waitFor();
    if (!own) {
      await page
        .getByRole("combobox", { name: "Filter opportunity" })
        .selectOption("find-a-worthwhile-direction");
      assert.equal(await page.locator("tbody tr").count(), 3);
    }
    await page.keyboard.press("Control+k");
    await page
      .getByPlaceholder("Search Product entities and pages…")
      .fill("roadmap");
    await page
      .getByRole("option", { name: /roadmap/i })
      .first()
      .click();
    await page.getByRole("complementary", { name: /roadmap detail/ }).waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Evidence & learning" })
      .click();
    await page.getByText("UNPROVEN", { exact: true }).first().waitFor();
    if (!own) assert.equal(await page.locator(".proof-card").count(), 16);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Roadmap" })
      .click();
    await page
      .getByText("Test PO-VFP01 connected player chain", { exact: false })
      .or(page.getByText("Test cues"))
      .first()
      .waitFor();
    if (own) {
      const file = path.join(
        root,
        ".nanopm/wiki/entities/opportunities/need.md",
      );
      await fs.appendFile(file, "\n\nUpdated externally.");
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("button", { name: "Opportunities" })
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
  const server = createApp("").listen(0, "127.0.0.1");
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
    await page.getByRole("button", { name: "Open project" }).click();
    await page
      .getByRole("alert")
      .getByText(/absolute project folder/)
      .waitFor();
    await page.getByRole("textbox", { name: "Project folder" }).fill(root);
    await page.getByRole("button", { name: "Open project" }).click();
    await page.getByRole("heading", { name: /PO-1/ }).first().waitFor();
    await page.getByText("1 source diagnostics").waitFor();

    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Product tree" })
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
    await fs.rm(root, { recursive: true, force: true });
  }
});
