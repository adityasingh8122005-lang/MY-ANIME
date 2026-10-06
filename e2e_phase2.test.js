import puppeteer from 'puppeteer';

const PASSES = 3;

async function runPass(browser, passNumber) {
  console.log(`\n--- Starting Phase 2 Validation Pass ${passNumber} ---`);
  const page = await browser.newPage();
  const errors = [];
  
  page.on('pageerror', err => { errors.push(`Page Error: ${err.toString()}`); });
  
  try {
    console.log("1. App Startup...");
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForSelector('header');

    console.log("2. Testing Cinematic Hero...");
    await page.waitForSelector('.group.overflow-hidden', {timeout: 5000}); // Hero div
    
    // Find View Details button
    const buttons = await page.$$('button');
    let hasDetailsButton = false;
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes("View Details")) hasDetailsButton = true;
    }
    if (hasDetailsButton) console.log("Hero CTA exists.");
    else errors.push("Hero CTA View Details not found");

    console.log("3. Testing Premium Navbar Scroll State...");
    await page.evaluate(() => window.scrollBy(0, 100));
    await new Promise(r => setTimeout(r, 500));
    const isScrolled = await page.evaluate(() => {
      const header = document.querySelector('header.hidden.sm\\:block');
      return header && header.className.includes('backdrop-blur-xl');
    });
    if (!isScrolled) errors.push("Navbar did not transition on scroll.");
    else console.log("Navbar transitioned correctly.");

    console.log("4. Testing 3D Cards...");
    await page.hover('a[href^="/anime/"]');
    await new Promise(r => setTimeout(r, 500));
    
    console.log("5. Full Regression Flow...");
    await page.goto('http://localhost:3000/auth');
    await page.waitForSelector('input[type="email"]');
    
    await page.goto('http://localhost:3000/search');
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.type('input[placeholder*="Search"]', 'Bleach');
    await page.keyboard.press('Enter');
    await page.waitForSelector('a[href^="/anime/"]', {timeout: 8000});

    const animeLinks = await page.$$('a[href^="/anime/"]');
    await animeLinks[0].click();
    await page.waitForSelector('h1', {timeout: 8000});

    await page.goto('http://localhost:3000/my-anime');
    
    console.log("6. Pass completed successfully.");
  } catch (err) {
    console.error(`Pass ${passNumber} Failed:`, err.message);
    errors.push(err.message);
  } finally {
    await page.close();
  }
  return errors;
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  let totalErrors = [];
  for (let i = 1; i <= PASSES; i++) {
    const errors = await runPass(browser, i);
    if (errors.length > 0) totalErrors.push(...errors);
  }
  await browser.close();
  if (totalErrors.length > 0) process.exit(1);
  else process.exit(0);
})();
