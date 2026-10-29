import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.BAKIBUDDY_URL ?? "http://localhost:8083";
const output = path.resolve("test-results/phase4");
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(output, "profile-"));
const checks = [],
  errors = [];
let context, page;
const visible = (locator) => locator.filter({ visible: true });
const button = (name) =>
  visible(page.getByRole("button", { name, exact: true }));
const radio = (name) => visible(page.getByRole("radio", { name, exact: true }));
const text = (value) => visible(page.getByText(value, { exact: true }));
async function launch() {
  context = await chromium.launchPersistentContext(profile, {
    channel: "chrome",
    headless: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(120000);
  await page.clock.install({ time: new Date("2026-10-27T04:00:00Z") });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
}
async function navigate(route = "/insights") {
  await page.waitForLoadState("networkidle");
  await page.goto(base + route, { waitUntil: "networkidle" });
  await visible(page.getByTestId("screen-title")).waitFor({ timeout: 120000 });
}
async function saved(pattern) {
  await page.waitForURL((url) => !pattern.test(url.pathname), {
    waitUntil: "networkidle",
  });
}
async function capture(name) {
  await page.screenshot({
    path: path.join(output, `${name}.png`),
    fullPage: true,
  });
}
async function metric(name, value) {
  await visible(page.getByTestId(`analytics-${name}`))
    .filter({ hasText: value })
    .waitFor();
}
async function account(name, amount) {
  await navigate("/account/new");
  await page.getByLabel("Account name", { exact: true }).fill(name);
  await page.getByLabel("Opening balance (RM)", { exact: true }).fill(amount);
  await button("Save account").click();
  await saved(/^\/account\//);
}
async function record(kind, name, amount, date, category = "Food & drinks") {
  await navigate("/transaction/new");
  await radio(`Transaction type: ${kind}`).click();
  await page.getByLabel("Title", { exact: true }).fill(name);
  await page.getByLabel("Amount (RM)", { exact: true }).fill(amount);
  await page.getByLabel("Transaction date", { exact: true }).fill(date);
  if (kind === "Transfer") await radio("To account: Analytics Wallet").click();
  if (kind === "Expense" || kind === "Refund")
    await radio(`Category: ${category}`).click();
  await button("Save transaction").click();
  await saved(/^\/transaction\//);
}
async function custom(start, end) {
  await radio("Insights period: Custom dates").click();
  await page.getByLabel("Insights start date", { exact: true }).fill(start);
  await page.getByLabel("Insights end date", { exact: true }).fill(end);
  await button("Apply date range").click();
}
async function scroll(fraction) {
  await page.evaluate((fraction) => {
    const element = [...document.querySelectorAll("div")].find(
      (element) =>
        ["auto", "scroll"].includes(getComputedStyle(element).overflowY) &&
        element.scrollHeight > element.clientHeight + 1,
    );
    if (element)
      element.scrollTop =
        (element.scrollHeight - element.clientHeight) * fraction;
  }, fraction);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function fits(name) {
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll("*")]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          getComputedStyle(element).visibility !== "hidden" &&
          (box.left < -1 || box.right > innerWidth + 1)
        );
      })
      .map((element) => element.textContent?.slice(0, 80)),
  );
  assert.deepEqual(overflow, [], name);
  checks.push(`${name}: no horizontal overflow`);
}
try {
  await launch();
  await navigate();
  await text("No records in this period.").waitFor();
  await button("Add your first account").waitFor();
  await capture("insights-empty-390");
  checks.push(
    "Fresh analytics has no fabricated data and offers account setup",
  );
  await account("Analytics Bank", "1000");
  await account("Analytics Wallet", "0");
  await record("Expense", "Prior groceries", "100", "2026-09-10", "Groceries");
  await record("Income", "Monthly income", "500", "2026-10-01");
  await record("Expense", "Room rent", "200", "2026-10-05", "Bills");
  await record("Expense", "Lunch", "12.50", "2026-10-26");
  await record("Expense", "Train", "7.50", "2026-10-27", "Transport");
  await record("Refund", "Lunch refund", "2.50", "2026-10-27");
  await record("Transfer", "Wallet move", "50", "2026-10-27");
  await navigate();
  await metric("income", "RM500.00");
  await metric("expenses", "RM220.00");
  await metric("refunds", "RM2.50");
  await metric("net", "RM282.50");
  await text(
    "6 records in this range. 1 transfer excluded from income and spending.",
  ).waitFor();
  await text(
    "Recorded expenses are RM120.00 higher than the previous period. Change: 120.0%.",
  ).waitFor();
  checks.push(
    "Actual income/expense/refund/transfer records reconcile and comparison uses equal preceding days",
  );
  await visible(page.getByTestId("spending-chart")).waitFor();
  await visible(page.getByTestId("cash-flow-chart")).waitFor();
  await text("90.91% · 1 expense").waitFor();
  await text("5.68% · 1 expense").waitFor();
  await text("3.41% · 1 expense").waitFor();
  checks.push(
    "Category values and rounded shares reconcile with gross spending",
  );
  await button("Show chart values").click();
  await visible(page.getByTestId("spending-values"))
    .getByText("RM12.50", { exact: true })
    .waitFor();
  await visible(page.getByTestId("spending-values"))
    .getByText("RM7.50", { exact: true })
    .waitFor();
  await button("Earlier periods").click();
  await button("Later periods").click();
  await radio("Chart grouping: Weekly").click();
  await visible(page.getByTestId("spending-values"))
    .getByText("RM200.00", { exact: true })
    .waitFor();
  await radio("Chart grouping: Monthly").click();
  await visible(page.getByTestId("spending-values"))
    .getByText("RM220.00", { exact: true })
    .waitFor();
  checks.push(
    "Daily/weekly/monthly chart groups and earlier/later pagination expose exact readable values",
  );
  await radio("Insights period: Last 7 days").click();
  await metric("expenses", "RM20.00");
  await metric("net", "−RM17.50");
  await text(
    "No expenses are recorded in the previous comparison period. A percentage change is unavailable from zero.",
  ).waitFor();
  await capture("insights-no-baseline-390");
  checks.push(
    "Seven-day range reports negative net flow and no invented zero-baseline percentage",
  );
  await radio("Insights period: Last 30 days").click();
  await metric("expenses", "RM220.00");
  await visible(page.getByTestId("insights-range"))
    .filter({ hasText: "28 Sept 2026 – 27 Oct 2026" })
    .waitFor();
  checks.push(
    "Thirty-day preset crosses the calendar month with inclusive dates",
  );
  await radio("Insights period: Last 7 days").click();
  await radio("Insights account: Analytics Wallet").click();
  await metric("expenses", "RM0.00");
  await metric("income", "RM0.00");
  await text("No expenses recorded here.").waitFor();
  await capture("insights-transfer-only-390");
  checks.push(
    "Receiving-account transfer filter does not manufacture income or expenses",
  );
  await radio("Insights account: All accounts").click();
  await custom("2026-10-26", "2026-10-27");
  await metric("expenses", "RM20.00");
  await page
    .getByLabel("Insights start date", { exact: true })
    .fill("2026-10-28");
  await button("Apply date range").click();
  await text(
    "Use dates from 1900 through today, with the start on or before the end.",
  ).waitFor();
  await metric("expenses", "RM20.00");
  await capture("insights-invalid-range-390");
  checks.push(
    "Inclusive custom dates apply; invalid draft retains prior data and form input",
  );
  await page
    .getByLabel("Insights start date", { exact: true })
    .fill("2026-08-01");
  await page
    .getByLabel("Insights end date", { exact: true })
    .fill("2026-08-07");
  await button("Apply date range").click();
  await text("No records in this period.").waitFor();
  await capture("insights-empty-filter-390");
  await button("Reset Insights filters").click();
  await metric("expenses", "RM220.00");
  checks.push("Empty filtered range offers recovery to current real records");
  await navigate("/transactions");
  await page.getByLabel("Search transactions", { exact: true }).fill("Lunch");
  await visible(page.getByRole("button", { name: /^Lunch, expense/ })).click();
  await page.getByLabel("Amount (RM)", { exact: true }).fill("15.00");
  await button("Save transaction").click();
  await saved(/^\/transaction\//);
  await navigate();
  await metric("expenses", "RM222.50");
  await metric("net", "RM280.00");
  checks.push(
    "Editing a stored transaction updates chart data and summary together",
  );
  await navigate("/transactions");
  await page.getByLabel("Search transactions", { exact: true }).fill("Train");
  await visible(page.getByRole("button", { name: /^Train, expense/ })).click();
  await button("Delete transaction").click();
  await button("Confirm deletion").click();
  await saved(/^\/transaction\//);
  await navigate();
  await metric("expenses", "RM215.00");
  await metric("net", "RM287.50");
  assert.equal(await text("Transport").count(), 0);
  checks.push(
    "Deleting a stored expense removes its category and recalculates analytics",
  );
  await navigate("/budget-plan");
  await radio("Income cycle: Monthly").click();
  await page
    .getByLabel("First cycle starts", { exact: true })
    .fill("2026-10-01");
  await page
    .getByLabel("Next income date / cycle end", { exact: true })
    .fill("2026-11-01");
  await page.getByLabel("Savings reserve (RM)", { exact: true }).fill("100");
  await page
    .getByLabel("Cycle spending limit (RM, optional)", { exact: true })
    .fill("600");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await navigate("/planned/new");
  await page.getByLabel("Schedule name", { exact: true }).fill("Upcoming bill");
  await page.getByLabel("Scheduled amount (RM)", { exact: true }).fill("300");
  await page.getByLabel("First due date", { exact: true }).fill("2026-10-28");
  await button("Save scheduled item").click();
  await saved(/^\/planned\//);
  await navigate();
  await visible(page.getByTestId("budget-used"))
    .filter({ hasText: "RM515.00 of RM600.00" })
    .waitFor();
  await radio("Insights period: Last 7 days").click();
  await radio("Insights account: Analytics Wallet").click();
  await visible(page.getByTestId("budget-used"))
    .filter({ hasText: "RM515.00 of RM600.00" })
    .waitFor();
  checks.push(
    "Current-cycle usage includes gross expenses/pending bills and is explicitly independent of analytics filters",
  );
  await navigate("/budget-plan");
  await page
    .getByLabel("Cycle spending limit (RM, optional)", { exact: true })
    .fill("500");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await navigate();
  await text("103.0% used or committed. RM15.00 above the cap.").waitFor();
  await scroll(1);
  await capture("insights-over-cap-390");
  checks.push(
    "Over-cap amount and actual percentage remain visible while progress graphic is bounded",
  );
  await navigate("/budget-plan");
  await page
    .getByLabel("Cycle spending limit (RM, optional)", { exact: true })
    .fill("0");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await navigate();
  await text(
    "Zero spending cap. Recorded expenses and bills exceed it by RM515.00.",
  ).waitFor();
  await scroll(1);
  await capture("insights-zero-cap-390");
  checks.push("Zero cap has a clear non-dividing state");
  await navigate("/budget-plan");
  await page
    .getByLabel("Cycle spending limit (RM, optional)", { exact: true })
    .fill("");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await navigate();
  await text(
    "Your plan has no spending cap. Add an optional limit to track its usage here.",
  ).waitFor();
  checks.push("Uncapped budget has an actionable empty utilization state");
  await navigate("/budget-plan");
  await page
    .getByLabel("Cycle spending limit (RM, optional)", { exact: true })
    .fill("600");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await context.close();
  await launch();
  await navigate();
  await metric("expenses", "RM215.00");
  await visible(page.getByTestId("budget-used"))
    .filter({ hasText: "RM515.00 of RM600.00" })
    .waitFor();
  checks.push(
    "Analytics derives persisted ledger and budget after a complete browser restart",
  );
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await navigate();
    for (const grouping of ["Daily", "Weekly", "Monthly"]) {
      await radio(`Chart grouping: ${grouping}`).click();
      await fits(`Insights ${grouping} ${width}px`);
      await scroll(0);
      await capture(`insights-${grouping.toLowerCase()}-${width}`);
      for (const [position, fraction] of [
        ["middle", 0.5],
        ["bottom", 1],
      ]) {
        await scroll(fraction);
        await capture(
          `insights-${grouping.toLowerCase()}-${width}-${position}`,
        );
      }
    }
    await custom("2025-11-01", "2026-10-27");
    await radio("Chart grouping: Monthly").click();
    await fits(`Insights yearly custom ${width}px`);
    await scroll(0);
    await capture(`insights-custom-${width}`);
    await scroll(0.5);
    await capture(`insights-custom-${width}-middle`);
    await scroll(1);
    await capture(`insights-custom-${width}-bottom`);
  }
  await page.setViewportSize({ width: 568, height: 320 });
  await navigate();
  await fits("Insights landscape");
  await capture("insights-landscape");
  assert.deepEqual([...new Set(errors)], [], "No browser or console errors");
  await writeFile(
    path.join(output, "results.json"),
    JSON.stringify({ checks, errors }, null, 2),
  );
  process.stdout.write(`${checks.length} Phase 4 browser checks passed.\n`);
} catch (error) {
  await capture("failure").catch(() => {});
  await writeFile(
    path.join(output, "results.json"),
    JSON.stringify({ checks, errors, failure: String(error) }, null, 2),
  );
  throw error;
} finally {
  await context?.close();
  if (!profile.startsWith(output + path.sep))
    throw new Error("Unsafe profile cleanup");
  await rm(profile, { recursive: true, force: true });
}
