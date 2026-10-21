import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-first-run"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:5199/", { waitUntil: "networkidle0" });
await sleep(1000);
const info = await page.evaluate(() => {
  const out = { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, wide: [] };
  document.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > window.innerWidth + 2 || r.left < -2) {
      out.wide.push({ tag: el.tagName + "." + String(el.className).slice(0, 60), right: Math.round(r.right), left: Math.round(r.left) });
    }
  });
  return out;
});
console.log(JSON.stringify(info.wide.slice(0, 16), null, 1), "scroll:", info.scrollWidth, "vw:", info.innerWidth);
await browser.close();
