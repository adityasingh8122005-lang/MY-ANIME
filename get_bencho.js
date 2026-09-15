import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://bencho.dev/?c=stepper&theme=dark', { waitUntil: 'networkidle2' });
  
  // Get the HTML of the main component
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log(html);
  
  await browser.close();
})();
