import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.BAKIBUDDY_URL ?? "http://localhost:8083";
const output = path.resolve("test-results/phase3");
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(output, "profile-"));
const errors = [],
  checks = [];
let context, page;
const visible = (locator) => locator.filter({ visible: true });
const button = (name) =>
  visible(page.getByRole("button", { name, exact: true }));
const radio = (name) => visible(page.getByRole("radio", { name, exact: true }));
const text = (value) => visible(page.getByText(value, { exact: true }));
async function launch() {
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    channel: "chrome",
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(120000);
  await page.clock.install({ time: new Date("2026-10-26T04:00:00Z") });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
}
async function navigate(route) {
  await page.waitForLoadState("networkidle");
  await page.goto(base + route, { waitUntil: "networkidle" });
  await visible(page.getByTestId("screen-title")).waitFor({ timeout: 120000 });
}
async function capture(name) {
  await page.screenshot({
    path: path.join(output, `${name}.png`),
    fullPage: true,
  });
}
async function saved(routePattern) {
  await page.waitForURL((url) => !routePattern.test(url.pathname), {
    waitUntil: "networkidle",
  });
}
async function allowance(value) {
  await navigate("/budget");
  await visible(page.getByTestId("daily-allowance"))
    .filter({ hasText: value })
    .waitFor();
}
async function schedule(name, kind, amount, date, repeat = "One time") {
  await navigate("/planned/new");
  await radio(`Scheduled type: ${kind}`).click();
  await page.getByLabel("Schedule name", { exact: true }).fill(name);
  await page.getByLabel("Scheduled amount (RM)", { exact: true }).fill(amount);
  await page.getByLabel("First due date", { exact: true }).fill(date);
  await radio(`Repeat: ${repeat}`).click();
  await button("Save scheduled item").click();
  await saved(/^\/planned\//);
}
try {
  await launch();
  await navigate("/budget");
  await button("Set up your budget").waitFor();
  await capture("budget-empty-390");
  checks.push("Empty budget offers setup without fictitious money");
  await navigate("/account/new");
  await page.getByLabel("Account name", { exact: true }).fill("Budget Bank");
  await page.getByLabel("Opening balance (RM)", { exact: true }).fill("1000");
  await button("Save account").click();
  await saved(/^\/account\//);
  await navigate("/budget-plan");
  await page.getByLabel("Savings reserve (RM)", { exact: true }).fill("100");
  await page
    .getByLabel("Next income date / cycle end", { exact: true })
    .fill("2026-10-26");
  await button("Save budget plan").click();
  await text(
    "The next income or review date must be 1 to 366 days after the cycle starts.",
  ).waitFor();
  assert.equal(
    await page.getByLabel("Savings reserve (RM)", { exact: true }).inputValue(),
    "100",
  );
  await capture("budget-plan-validation-390");
  checks.push("Invalid cycle rejected with amount and dates preserved");
  await page
    .getByLabel("Next income date / cycle end", { exact: true })
    .fill("2026-11-02");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await allowance("RM128.57");
  checks.push("Weekly plan protects reserve and floors daily sen");
  await schedule("Room rent", "Bill / expense", "200", "2026-10-27", "Monthly");
  await allowance("RM100.00");
  checks.push("Recurring bill protects funds before allowance");
  await schedule("Freelance payment", "Expected income", "500", "2026-10-28");
  await allowance("RM100.00");
  await text("RM1,300.00").waitFor();
  checks.push(
    "Expected income affects conditional forecast but not today's allowance",
  );
  await capture("budget-healthy-390");
  await navigate("/budget-plan");
  await page
    .getByLabel("Cycle spending limit (RM, optional)", { exact: true })
    .fill("500");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await allowance("RM42.85");
  checks.push(
    "Cycle cap includes pending bills and preserves rounding remainder",
  );
  await navigate("/planned-items");
  await button("Review Room rent due 27 Oct 2026").click();
  await page.waitForURL((url) => url.pathname === "/planned-payment");
  const paymentRoute =
    new URL(page.url()).pathname + new URL(page.url()).search;
  await button("Record payment now").click();
  assert.equal(
    await page.getByLabel("Title", { exact: true }).inputValue(),
    "Room rent",
  );
  assert.equal(
    await page.getByLabel("Amount (RM)", { exact: true }).inputValue(),
    "200.00",
  );
  await button("Save transaction").click();
  await saved(/^\/transaction\//);
  await text(
    "This occurrence is linked to a real transaction. It is no longer counted as an unpaid bill or expected income.",
  ).waitFor();
  checks.push(
    "Record payment prefills actual transaction and atomically links occurrence",
  );
  await allowance("RM42.85");
  checks.push(
    "Recording bill preserves available allowance without double counting",
  );
  await navigate(paymentRoute);
  await button("View recorded transaction").click();
  await page.waitForURL((url) => /^\/transaction\//.test(url.pathname));
  const recordedRoute = new URL(page.url()).pathname;
  await page.getByLabel("Amount (RM)", { exact: true }).fill("201");
  await button("Save transaction").click();
  await text(
    "A linked record must match the schedule's type, full amount and account. Unlink it in Bills & income before changing those fields.",
  ).waitFor();
  checks.push(
    "Linked transaction edits cannot silently break forecast reconciliation",
  );
  await navigate(paymentRoute);
  await button("Unlink this payment").click();
  await button("Keep it").click();
  await button("View recorded transaction").waitFor();
  await button("Unlink this payment").click();
  await button("Confirm deletion").click();
  await button("Link selected transaction").waitFor();
  await radio(
    "Existing matching transaction: Room rent · 26 Oct 2026 · RM200.00",
  ).click();
  await button("Link selected transaction").click();
  await button("View recorded transaction").waitFor();
  checks.push(
    "Existing payment link, unlink cancellation, and re-link work without another record",
  );
  await navigate("/planned-items");
  await radio("Payment status: Linked records").click();
  await button("Review Room rent due 27 Oct 2026").waitFor();
  checks.push(
    "Linked payment status is discoverable separately from pending occurrences",
  );
  await navigate("/planned-items");
  await button("Edit Room rent").click();
  await page.waitForURL((url) => /^\/planned\//.test(url.pathname));
  const itemRoute = new URL(page.url()).pathname;
  assert.equal(
    await page
      .getByLabel("Scheduled amount (RM)", { exact: true })
      .isEditable(),
    false,
  );
  await page
    .getByLabel("Schedule name", { exact: true })
    .fill("Room rent updated");
  await button("Save scheduled item").click();
  await saved(/^\/planned\//);
  checks.push(
    "Linked schedule protects financial fields while allowing a rename",
  );
  await context.close();
  await launch();
  await allowance("RM42.85");
  await navigate(paymentRoute);
  await button("View recorded transaction").waitFor();
  checks.push(
    "Budget, schedules and payment links survive browser process close/reopen",
  );
  await context.setOffline(true);
  await button("View recorded transaction").click();
  await page
    .getByLabel("Description (optional)", { exact: true })
    .fill("Offline payment note");
  await button("Save transaction").click();
  await saved(/^\/transaction\//);
  await context.setOffline(false);
  checks.push("Already-loaded app edits a linked payment offline");
  await navigate("/budget-plan");
  await page.getByLabel("Savings reserve (RM)", { exact: true }).fill("1000");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await allowance("RM0.00");
  await text(
    "Your recorded funds are RM200.00 short of unpaid bills and your savings reserve. The allowance stays at RM0.00.",
  ).waitFor();
  await capture("budget-shortfall-390");
  checks.push(
    "Insufficient funds show an exact shortfall and zero daily allowance",
  );
  await navigate("/budget-plan");
  await page.getByLabel("Savings reserve (RM)", { exact: true }).fill("100");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  const routes = [
    ["home", "/"],
    ["budget", "/budget"],
    ["budget-plan", "/budget-plan"],
    ["planned-items", "/planned-items"],
    ["new-schedule", "/planned/new"],
    ["edit-schedule", itemRoute],
    ["payment", paymentRoute],
    ["linked-transaction", recordedRoute],
  ];
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const [name, route] of routes) {
      await navigate(route);
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
          .map((element) => element.textContent?.slice(0, 60)),
      );
      assert.deepEqual(overflow, [], `${name} at ${width}`);
      await capture(`${name}-${width}`);
      if (width === 390)
        for (const [position, fraction] of [
          ["middle", 0.5],
          ["bottom", 1],
        ]) {
          await page.evaluate((fraction) => {
            const scroll = [...document.querySelectorAll("div")].find(
              (element) =>
                ["auto", "scroll"].includes(
                  getComputedStyle(element).overflowY,
                ) && element.scrollHeight > element.clientHeight + 1,
            );
            if (scroll)
              scroll.scrollTop =
                (scroll.scrollHeight - scroll.clientHeight) * fraction;
          }, fraction);
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              ),
          );
          await capture(`${name}-390-${position}`);
        }
      checks.push(`${name} fits ${width}px without horizontal overflow`);
    }
  }
  await page.setViewportSize({ width: 568, height: 320 });
  await navigate("/budget-plan");
  await capture("budget-plan-landscape");
  checks.push("Landscape plan form remains scrollable");
  await navigate(recordedRoute);
  await button("Delete transaction").click();
  await button("Confirm deletion").click();
  await saved(/^\/transaction\//);
  await navigate(paymentRoute);
  await button("Record payment now").waitFor();
  await allowance("RM42.85");
  checks.push(
    "Deleting linked expense restores pending bill and recalculates without double effects",
  );
  await navigate(itemRoute);
  await button("Delete scheduled item").click();
  await button("Keep it").click();
  await button("Delete scheduled item").click();
  await button("Confirm deletion").click();
  await saved(/^\/planned\//);
  await navigate("/planned-items");
  assert.equal(await button("Edit Room rent updated").count(), 0);
  checks.push(
    "Schedule deletion requires confirmation and removes its occurrences",
  );
  await navigate("/budget-plan");
  await radio("Income cycle: Irregular income").click();
  await page.getByLabel("Review date", { exact: true }).fill("2026-11-05");
  await button("Save budget plan").click();
  await saved(/^\/budget-plan$/);
  await navigate("/budget-plan");
  await radio("Income cycle: Irregular income")
    .getAttribute("aria-checked")
    .then((value) => assert.equal(value, "true"));
  checks.push("Irregular income uses a persisted explicit review date");
  await button("Remove budget plan").click();
  await button("Confirm deletion").click();
  await saved(/^\/budget-plan$/);
  await navigate("/budget");
  await button("Set up your budget").waitFor();
  await navigate("/planned-items");
  await button("Edit Freelance payment").waitFor();
  checks.push("Removing a plan keeps schedules and ledger records");
  assert.deepEqual([...new Set(errors)], [], "No browser errors");
  await writeFile(
    path.join(output, "results.json"),
    JSON.stringify({ checks, errors }, null, 2),
  );
  process.stdout.write(`${checks.length} Phase 3 browser checks passed.\n`);
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
    throw new Error("Unsafe test profile cleanup");
  await rm(profile, { recursive: true, force: true });
}
