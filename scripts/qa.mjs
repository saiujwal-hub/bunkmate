/* End-to-end QA of BunkMate against the credits × 3 brief. */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/private/var/folders/m6/fj3k9ymx2976cq1tmkx0d4q00000gn/T/opencode/bunkmate-qa";
mkdirSync(OUT, { recursive: true });

let failures = 0;
const assert = (cond, label) => {
  console.log(cond ? `ok: ${label}` : `FAIL: ${label}`);
  if (!cond) failures++;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-first-run", "--window-size=1280,1000"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 1000 });

async function setValue(selector, value) {
  await page.$eval(selector, (el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
async function clickLabel(label) {
  await page.$eval(`button[aria-label="${label}"]`, (el) => el.click());
}
async function clickText(text) {
  return page.evaluate((t) => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim().includes(t));
    if (btn) { btn.click(); return true; }
    return false;
  }, text);
}
async function inputValue(label) {
  return page.$eval(`input[aria-label="${label}"]`, (el) => el.value);
}
async function bodyText() {
  return page.evaluate(() => document.body.textContent);
}
async function rowText(ariaLabel) {
  return page.$eval(`button[aria-label="${ariaLabel}"]`, (el) => el.closest("li").textContent);
}
async function clearStorage() {
  await page.evaluate(() => localStorage.removeItem("bunkmate:v1"));
}

/* 0 — landing: the site opens on the hero board */
await page.goto("http://localhost:5199/", { waitUntil: "networkidle0" });
await sleep(1200); /* let the hero chalk finish writing */
const landing = await bodyText();
assert(landing.includes("Every bunk deserves a tally."), "landing hero written in chalk");
assert(landing.includes("credits × 3"), "landing explains the only maths");
assert(landing.includes("Manipal students only"), "landing carries the Manipal note");
assert(landing.includes("Badcows"), "landing credits Badcows");
assert(!(await page.$('input[aria-label="How many subjects do you have?"]')), "app starts on the landing, not the form");
await clickText("Open the board");
await sleep(500);

/* 1 — migration: an old board saved with classesPerWeek must open correctly */
await page.goto("http://localhost:5199/", { waitUntil: "networkidle0" });
await clearStorage();
await page.reload({ waitUntil: "networkidle0" });
await sleep(400);
assert((await bodyText()).includes("Every bunk deserves a tally."), "fresh visit opens on the landing");
await clickText("Open the board");
await sleep(400);
await page.evaluate(() => {
  localStorage.setItem(
    "bunkmate:v1",
    JSON.stringify({
      setupDone: true,
      subjects: [
        { id: "old-1", name: "Old Subject", classesPerWeek: 4, credits: 2, bunksUsed: 6 },
        { id: "old-2", name: "Tallied Course", classesPerWeek: 3, credits: 1, bunksUsed: 5 },
      ],
    }),
  );
});
await page.reload({ waitUntil: "networkidle0" });
await sleep(400);
await clickText("Open the board"); /* reloads always land on the hero */
await sleep(400);
let text = await bodyText();
assert(text.includes("BunkMate"), "old board loads into the calculator");
assert(text.includes("Old Subject") && text.includes("Tallied Course"), "saved subjects survive the format change");
const oldRow = await rowText("Record one bunked class for Old Subject");
assert(oldRow.includes("max 6") && oldRow.includes("6 left") === false && oldRow.includes("none left, attend!"), "old max recomputed as credits × 3 (2 → 6)");
const talliedRow = await rowText("Record one bunked class for Tallied Course");
assert(talliedRow.includes("max 3"), "another old max recomputed (1 credit → 3)");
const tallyVal = Number(await inputValue("Bunks used for Tallied Course"));
assert(tallyVal === 3, `oversized old tally clamped to the new max (got ${tallyVal})`);
const oldVal = await inputValue("Bunks used for Old Subject");
assert(oldVal === "6", "saved bunk count preserved when it fits the new max");
await clearStorage();
await page.reload({ waitUntil: "networkidle0" });
await sleep(300);
await clickText("Open the board");
await sleep(400);

/* 1 — setup form: no per-week field anywhere */
await setValue('input[aria-label="How many subjects do you have?"]', "7");
await clickText("List them for me");
await page.waitForSelector('input[aria-label="Subject 7 name"]');
assert((await page.$$('input[aria-label*="name"]')).length === 7, "7 subject rows generated dynamically");
assert((await page.$$('input[aria-label*="classes per week"]')).length === 0, "classes-per-week input is gone");

const rows = [
  ["Digital Systems and Computer Organization", "4"],
  ["Data Structures", "3"],
  ["Data Communication and Computer Networks", "3"],
  ["Data Analytics", "3"],
  ["Discrete Mathematical Structures", "3"],
  ["Data Structures Lab", "1"],
  ["Digital Systems Lab", "1"],
];
for (let i = 0; i < 7; i++) {
  await setValue(`input[aria-label="Subject ${i + 1} name"]`, rows[i][0]);
  await setValue(`input[aria-label="Subject ${i + 1} credits"]`, rows[i][1]);
}

/* counts field: needs a positive whole number → 0 is refused */
await setValue('input[aria-label="How many subjects do you have?"]', "0");
await clickText("List them for me");
await sleep(200);
assert((await bodyText()).includes("whole number of subjects"), "subject count refuses 0");
await setValue('input[aria-label="How many subjects do you have?"]', "7");
await clickText("List them for me");
await sleep(250);

/* duplicate check */
await setValue('input[aria-label="Subject 7 name"]', "Data Structures");
await clickText("Generate My Bunk Calculator");
await sleep(300);
assert((await bodyText()).includes("appears twice"), "duplicate subject names rejected");
await setValue('input[aria-label="Subject 7 name"]', "Digital Systems Lab");
await clickText("Generate My Bunk Calculator");
await sleep(400);
assert((await bodyText()).includes("BunkMate"), "calculator view opens");

/* 2 — credits × 3 everywhere: DS&CO 4 credits → max 12, 5 used → 7 left */
const DSCO = "Record one bunked class for Digital Systems and Computer Organization";
const dscoRow0 = await rowText(DSCO);
assert(dscoRow0.includes("4 credits — max 12"), "DS&CO max shown as credits × 3 (12)");
for (let i = 0; i < 5; i++) { await clickLabel(DSCO); await sleep(50); }
await sleep(300);
const dscoText = await rowText(DSCO);
assert(dscoText.includes("7 left"), "DS&CO shows 7 remaining");
assert((await inputValue("Bunks used for Digital Systems and Computer Organization")) === "5", "DS&CO used input shows 5");

const totals = await page.evaluate(() =>
  [...document.querySelectorAll(".chalk-board > *")].map((e) => e.textContent).join(" "),
);
assert(totals.includes("54") && totals.includes("bunks allowed"), "total max = 54");
assert(totals.includes("49") && totals.includes("bunks remaining"), "total remaining = 49");
assert(totals.includes("semester attendance") && totals.includes("90.7%"), "dial shows semester attendance %");

/* 3 — cap guard on DMS (3 credits → max 9) */
const DMS = "Record one bunked class for Discrete Mathematical Structures";
for (let i = 0; i < 10; i++) { await clickLabel(DMS); await sleep(40); }
await sleep(300);
assert((await rowText(DMS)).includes("none left, attend!"), "maxed row shows warning");
assert((await inputValue("Bunks used for Discrete Mathematical Structures")) === "9", "DMS capped at 9");
assert((await bodyText()).includes("9 bunks is the whole allowance"), "attempt past the cap is refused with an explanation");

/* 4 — used input rejects junk and out-of-range values */
const USED = 'input[aria-label="Bunks used for Discrete Mathematical Structures"]';
await page.$eval(USED, (el) => el.focus());
await setValue(USED, "15");
await page.keyboard.press("Enter");
await sleep(300);
assert((await inputValue("Bunks used for Discrete Mathematical Structures")) === "9", "used input refuses 15 > 9");
await page.$eval(USED, (el) => el.focus());
await setValue(USED, "4");
await page.keyboard.press("Enter");
await sleep(300);
assert((await inputValue("Bunks used for Discrete Mathematical Structures")) === "4", "used input accepts 4");

/* 5 — editing credits recalculates immediately: DS&CO 4 → 5 credits, max 15 */
await clickLabel("Edit Digital Systems and Computer Organization");
await sleep(250);
const dscoCredSel = 'input[aria-label="Edit credits for Digital Systems and Computer Organization"]';
await page.$eval(dscoCredSel, (el) => el.focus());
await setValue(dscoCredSel, "5");
await clickText("save");
await sleep(300);
const dscoEditRow = await rowText(DSCO);
assert(dscoEditRow.includes("5 credits — max 15") && dscoEditRow.includes("10 left"), "editing credits recalcs max and remaining at once");

/* 6 — edit conflict: DMS used 4, credits down to 1 → max 3 < 4 → blocked */
await clickLabel("Edit Discrete Mathematical Structures");
await sleep(250);
const dmsCredSel = 'input[aria-label="Edit credits for Discrete Mathematical Structures"]';
await page.$eval(dmsCredSel, (el) => el.focus());
await setValue(dmsCredSel, "1");
await clickText("save");
await sleep(300);
assert((await bodyText()).includes("beats the new allowance"), "edit cutting max below used is blocked and explained");
await page.$eval(dmsCredSel, (el) => el.focus());
await setValue(dmsCredSel, "2");
await clickText("save");
await sleep(300);
const dmsAfterEdit = await rowText(DMS);
assert(dmsAfterEdit.includes("2 credits — max 6") && dmsAfterEdit.includes("2 left"), "valid edit saves with recomputed values");

/* 7 — reset with confirmation */
await clickText("Wipe all tallies");
await sleep(200);
assert((await bodyText()).includes("sure? tap again"), "reset requires tapping twice");
await clickText("sure? tap again");
await sleep(300);
const dmsAfter = await inputValue("Bunks used for Discrete Mathematical Structures");
assert(dmsAfter === "0", `all tallies reset to zero (DMS = ${dmsAfter})`);
const dscoAfter = await inputValue("Bunks used for Digital Systems and Computer Organization");
assert(dscoAfter === "0", "DS&CO reset too");

/* 8 — localStorage persistence */
await clickLabel("Record one bunked class for Data Structures");
await sleep(250);
await page.reload({ waitUntil: "networkidle0" });
await sleep(400);
await clickText("Open the board");
await sleep(400);
const dsPersist = await inputValue("Bunks used for Data Structures");
assert(dsPersist === "1", `bunk counts survive a reload (got ${dsPersist})`);
const dsMax = await rowText("Record one bunked class for Data Structures");
assert(dsMax.includes("3 credits — max 9"), "new shape persists (no stale classes used anywhere)");
await page.screenshot({ path: `${OUT}/calculator.png` });

/* 9 — deleting every subject returns to setup (two taps each) */
for (let round = 0; round < 20; round++) {
  const deleteLabels = await page.$$eval("button[aria-label^='Delete ']", (els) =>
    els.map((el) => el.getAttribute("aria-label")),
  );
  if (deleteLabels.length === 0) break;
  const label = deleteLabels[0];
  await clickLabel(label);
  await sleep(180);
  await clickLabel(label);
  await sleep(250);
}
assert((await bodyText()).includes("Set up your board"), "deleting all subjects returns to setup");

/* 10 — credits example table straight from the brief */
const table = [["OneCredit", "1", "3"], ["TwoCredit", "2", "6"], ["FiveCredit", "5", "15"]];
await setValue('input[aria-label="How many subjects do you have?"]', "3");
await clickText("List them for me");
await sleep(200);
for (let i = 0; i < 3; i++) {
  await setValue(`input[aria-label="Subject ${i + 1} name"]`, table[i][0]);
  await setValue(`input[aria-label="Subject ${i + 1} credits"]`, table[i][1]);
}
await clickText("Generate My Bunk Calculator");
await sleep(400);
const c1 = await rowText("Record one bunked class for OneCredit");
const c2 = await rowText("Record one bunked class for TwoCredit");
const c5 = await rowText("Record one bunked class for FiveCredit");
assert(c1.includes("max 3"), "1 credit → 3 allowed bunks");
assert(c2.includes("max 6"), "2 credits → 6 allowed bunks");
assert(c5.includes("max 15"), "5 credits → 15 allowed bunks");

await page.setViewport({ width: 390, height: 844 });
await sleep(500);
await page.screenshot({ path: `${OUT}/mobile.png` });

/* 11 — "New board": start a fresh bunk calculator (two taps) */
await page.setViewport({ width: 1280, height: 1000 });
await sleep(400);
await clickText("New board");
await sleep(200);
assert((await bodyText()).includes("sure? start fresh"), "new board requires tapping twice");
await clickText("sure? start fresh");
await sleep(300);
assert((await bodyText()).includes("Set up your board"), "new board reopens the setup form");
await setValue('input[aria-label="How many subjects do you have?"]', "2");
await clickText("List them for me");
await sleep(200);
await setValue('input[aria-label="Subject 1 name"]', "Second Board A");
await setValue('input[aria-label="Subject 1 credits"]', "2");
await setValue('input[aria-label="Subject 2 name"]', "Second Board B");
await setValue('input[aria-label="Subject 2 credits"]', "5");
await clickText("Generate My Bunk Calculator");
await sleep(400);
const newBoardText = await bodyText();
assert(newBoardText.includes("Second Board A") && newBoardText.includes("Second Board B"), "new calculator generated");
assert(!newBoardText.includes("OneCredit"), "the old calculator was fully replaced");

await browser.close();
console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
