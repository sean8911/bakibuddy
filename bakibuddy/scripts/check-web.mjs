import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
const base = process.env.BAKIBUDDY_URL ?? "http://localhost:8081";
const output = path.resolve("test-results/phase2");
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(output, "profile-"));
const errors = [],
  checks = [];
const options = {
  headless: true,
  channel: process.env.BAKIBUDDY_BROWSER ?? "chrome",
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
};
if (options.channel === "chromium") delete options.channel;
let context;
async function launch() {
  context = await chromium.launchPersistentContext(profile, options);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(120000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return page;
}
let page = await launch();
let expenseDate;
const visible = (locator) => locator.filter({ visible: true });
const button = (name) =>
  visible(page.getByRole("button", { name, exact: true }));
async function navigate(route = "/") {
  await page
    .evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    )
    .catch(() => {});
  await page.waitForLoadState("networkidle");
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.getByTestId("screen-title").waitFor({ timeout: 120000 });
}
async function balance(amount) {
  await visible(page.getByTestId("balance-amount"))
    .filter({ hasText: amount })
    .waitFor();
}
async function screenshot(name) {
  await page.screenshot({
    path: path.join(output, name + ".png"),
    fullPage: true,
  });
}
async function newAccount(name, amount) {
  await navigate("/account/new");
  await page.getByLabel("Account name", { exact: true }).fill(name);
  await page.getByLabel("Opening balance (RM)", { exact: true }).fill(amount);
  await button("Save account").click();
  await finishedForm();
}
async function finishedForm() {
  await page.waitForURL(
    (url) => !/^\/(account|transaction)\//.test(url.pathname),
    { waitUntil: "networkidle" },
  );
  await visible(page.getByTestId("screen-title")).waitFor();
}
async function addTransaction(kind, title, amount) {
  await navigate("/transaction/new");
  await page
    .getByRole("radio", { name: "Transaction type: " + kind, exact: true })
    .click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Amount (RM)", { exact: true }).fill(amount);
  if (kind === "Transfer")
    await page
      .getByRole("radio", { name: "To account: Test Wallet", exact: true })
      .click();
  await button("Save transaction").click();
  await finishedForm();
}
try {
  await navigate();
  await balance("RM0.00");
  await button("Add your first account").waitFor();
  await screenshot("home-empty-390");
  checks.push("Fresh SQLite ledger starts empty without demo amounts");
  await newAccount("Test Bank", "1000.00");
  await newAccount("Test Wallet", "0.00");
  await addTransaction("Income", "Allowance", "500.00");
  await addTransaction("Expense", "Lunch", "12.50");
  await addTransaction("Refund", "Lunch refund", "2.50");
  await addTransaction("Transfer", "Wallet transfer", "50.00");
  await navigate();
  await balance("RM1,490.00");
  checks.push("Accounts, income, expense, refund and transfer reconcile");
  await navigate("/transactions");
  await page.getByLabel("Search transactions", { exact: true }).fill("Lunch");
  await visible(page.getByRole("button", { name: /^Lunch, expense/ })).click();
  await page.getByLabel("Amount (RM)", { exact: true }).fill("15.00");
  const originalDate = await page.getByLabel('Transaction date', { exact: true }).inputValue();
  expenseDate = new Date(new Date(`${originalDate}T12:00:00+08:00`).getTime() - 86400000).toISOString().slice(0,10);
  await page.getByLabel('Transaction date', { exact: true }).fill(expenseDate);
  await button("Save transaction").click();
  await finishedForm();
  await navigate();
  await balance("RM1,487.50");
  checks.push("Editing an expense amount and date updates stored history and balance");
  await navigate("/transaction/new");
  await page.getByLabel("Amount (RM)", { exact: true }).fill("1.001");
  await button("Save transaction").click();
  await page
    .getByText(/at most two decimal places/)
    .first()
    .waitFor();
  assert.equal(
    await page.getByLabel("Amount (RM)", { exact: true }).inputValue(),
    "1.001",
  );
  await page.getByLabel("Amount (RM)", { exact: true }).fill("1.00");
  await button("Save transaction").click();
  await page
    .getByText("Enter a title between 1 and 80 characters.", { exact: true })
    .waitFor();
  checks.push(
    "Invalid amounts and empty titles are rejected without losing input",
  );
  await navigate("/transaction/new");
  await page.getByLabel("Title", { exact: true }).fill("Lunch");
  await page.getByLabel("Amount (RM)", { exact: true }).fill("15.00");
  await page.getByLabel('Transaction date', { exact: true }).fill(expenseDate);
  await button("Save transaction").click();
  await button("Save as a separate transaction").waitFor();
  await button("Save as a separate transaction").click();
  await finishedForm();
  await navigate();
  await balance("RM1,472.50");
  await navigate("/transactions");
  await page.getByLabel("Search transactions", { exact: true }).fill("Lunch");
  await visible(page.getByRole("button", { name: /^Lunch, expense/ }))
    .first()
    .click();
  await button("Delete transaction").click();
  await button("Keep it").click();
  await button("Delete transaction").click();
  await button("Confirm deletion").click();
  await finishedForm();
  await navigate();
  await balance("RM1,487.50");
  checks.push(
    "Duplicate warning, explicit separate save, deletion cancellation and deletion work",
  );
  await navigate("/transactions");
  await page
    .getByLabel("Search transactions", { exact: true })
    .fill("unmatched query");
  await page.getByText("No matching transactions.", { exact: true }).waitFor();
  await button("Clear search and filters").click();
  await button("Filter transactions").click();
  await page
    .getByRole("radio", { name: "Type filter: Transfer", exact: true })
    .click();
  await page
    .getByRole("radio", { name: "Account filter: Test Wallet", exact: true })
    .click();
  await page
    .getByText("1 of 4 records · Tap a record to edit", { exact: true })
    .waitFor();
  checks.push(
    "Search, empty results, reset and receiving-account transfer filter work",
  );
  await page.getByRole('radio', {name:'Category filter: Food & drinks',exact:true}).click();
  await page.getByText('No matching transactions.',{exact:true}).waitFor();
  await page.getByRole('radio', {name:'Category filter: All categories',exact:true}).click();
  await page.getByText('1 of 4 records · Tap a record to edit',{exact:true}).waitFor();
  checks.push('Category filtering combines correctly with type and account filters');
  await navigate("/accounts");
  await visible(
    page.getByRole("button", { name: /^Edit account Test Bank,/ }),
  ).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Test Bank Updated");
  await page
    .getByLabel("Opening balance (RM)", { exact: true })
    .fill("1100.00");
  await button("Save account").click();
  await finishedForm();
  await navigate();
  await balance("RM1,587.50");
  checks.push(
    "Renaming and changing opening balance reconcile existing records",
  );
  await navigate("/accounts");
  await visible(
    page.getByRole("button", { name: /^Edit account Test Bank Updated,/ }),
  ).click();
  await button("Delete account").click();
  await button("Confirm deletion").click();
  await page
    .getByText(
      "This account has transactions. Move or delete those transactions before removing the account.",
      { exact: true },
    )
    .waitFor();
  checks.push("Referenced account deletion is blocked safely");
  await newAccount("Empty Cash", "0.00");
  await navigate("/accounts");
  await visible(
    page.getByRole("button", { name: /^Edit account Empty Cash,/ }),
  ).click();
  await button("Delete account").click();
  await button("Confirm deletion").click();
  await finishedForm();
  checks.push("An empty account can be removed after confirmation");
  await navigate();
  await context.close();
  page = await launch();
  await navigate();
  await balance("RM1,587.50");
  await navigate("/transactions");
  await page
    .getByText("4 of 4 records · Tap a record to edit", { exact: true })
    .waitFor();
  checks.push("SQLite records survive a complete browser close and reopen");
  await context.setOffline(true);
  await page.getByRole("tab", { name: "Home", exact: true }).click();
  await balance("RM1,587.50");
  await button("Add expense").click();
  await page.getByLabel("Title", { exact: true }).fill("Offline sen");
  await page.getByLabel("Amount (RM)", { exact: true }).fill("0.01");
  await button("Save transaction").click();
  await finishedForm();
  await balance("RM1,587.49");
  await context.setOffline(false);
  checks.push("Already-loaded app records a one-sen expense offline");
  await navigate("/transactions");
  await page
    .getByLabel("Search transactions", { exact: true })
    .fill("Offline sen");
  await visible(
    page.getByRole("button", { name: /^Offline sen, expense/ }),
  ).click();
  await button("Delete transaction").click();
  await button("Confirm deletion").click();
  await finishedForm();
  const routes = [
    ["home", "/"],
    ["transactions", "/transactions"],
    ["budget", "/budget"],
    ["insights", "/insights"],
    ["settings", "/settings"],
    ["accounts", "/accounts"],
    ["new-transaction", "/transaction/new"],
    ["new-account", "/account/new"],
  ];
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const [name, route] of routes) {
      await navigate(route);
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll("*")]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return (
              r.width > 0 &&
              r.height > 0 &&
              getComputedStyle(e).visibility !== "hidden" &&
              (r.left < -1 || r.right > innerWidth + 1)
            );
          })
          .map((e) => e.textContent?.slice(0, 60)),
      );
      assert.deepEqual(overflow, [], name + " at " + width);
      await screenshot(name + "-" + width);
      if(width===390){
        for(const [position,fraction] of [['middle',0.5],['bottom',1]]){
          await page.evaluate(fraction=>{const scroller=[...document.querySelectorAll('div')].find(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1);if(scroller)scroller.scrollTop=(scroller.scrollHeight-scroller.clientHeight)*fraction;},fraction);
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          await screenshot(name+'-390-'+position);
        }
      }
      checks.push(name + " renders without overflow at " + width + "px");
    }
  }
  await page.setViewportSize({width:568,height:320});await navigate('/transaction/new');await screenshot('new-transaction-landscape');checks.push('Landscape transaction form renders');
  assert.deepEqual(
    [...new Set(errors)],
    [],
    "No uncaught browser or console errors",
  );
  await writeFile(
    path.join(output, "results.json"),
    JSON.stringify({ checks, errors }, null, 2),
  );
  process.stdout.write(
    checks.length + " Phase 2 web integration checks passed.\n",
  );
} catch (error) {
  await screenshot("failure").catch(() => {});
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
