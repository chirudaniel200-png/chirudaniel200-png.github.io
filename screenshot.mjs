import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

let n = 1;
while (fs.existsSync(path.join(screenshotDir, `screenshot-${n}${label ? '-' + label : ''}.png`))) n++;
const filename = `screenshot-${n}${label ? '-' + label : ''}.png`;
const filepath = path.join(screenshotDir, filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll slowly through the page to trigger all IntersectionObserver animations
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
const step = 300;
for (let y = 0; y <= pageHeight; y += step) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await new Promise(r => setTimeout(r, 120));
}
// Scroll back to top and wait for all transitions to finish
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1000));

await page.screenshot({ path: filepath, fullPage: true });
await browser.close();

console.log(`Saved: temporary screenshots/${filename}`);
