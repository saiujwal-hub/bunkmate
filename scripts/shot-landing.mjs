import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/private/var/folders/m6/fj3k9ymx2976cq1tmkx0d4q00000gn/T/opencode/bunkmate-qa";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-first-run", "--window-size=1280,1000"] });
const page = await browser.newPage();

for (const [name, w, h] of [["desktop", 1280, 1000], ["mobile", 390, 850]]) {
  await page.setViewport({ width: w, height: h });
  await page.goto("http://localhost:5199/", { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(3200); /* full hero write-in */
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(name, "scrollWidth:", sw);
  await page.screenshot({ path: `${OUT}/landing-${name}.png` });
  /* full page for the mobile check */
  if (name === "mobile") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${OUT}/landing-mobile-full.png`, fullPage: true });
  }
}
await browser.close();
console.log("done");
