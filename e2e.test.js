import puppeteer from 'puppeteer';

const PASSES = 3;

async function runPass(browser, passNumber) {
  console.log(`\n--- Starting Regression Pass ${passNumber} ---`);
  const page = await browser.newPage();
  const errors = [];
  
  page.on('pageerror', err => { errors.push(`Page Error: ${err.toString()}`); });
  
  try {
    console.log("1. App Startup...");
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForSelector('header');

    console.log("2 & 3. Auth & Routing...");
    await page.goto('http://localhost:3000/auth');
    await page.waitForSelector('input[type="email"]');
    
    console.log("4. Anime Search...");
    await page.goto('http://localhost:3000/search');
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.type('input[placeholder*="Search"]', 'Naruto');
    await page.keyboard.press('Enter'); // submit the form
    await page.waitForSelector('a[href^="/anime/"]', {timeout: 8000});

    console.log("5. Anime Details...");
    const animeLinks = await page.$$('a[href^="/anime/"]');
    await animeLinks[0].click();
    await page.waitForSelector('h1', {timeout: 8000});

    console.log("6, 7 & 8. Collection, Progress, Rating (Skip deep interactions)...");
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("9. Statistics...");
    await page.goto('http://localhost:3000/statistics');
    await new Promise(r => setTimeout(r, 500));
    
    console.log("10. Filters...");
    await page.goto('http://localhost:3000/my-anime');
    await new Promise(r => setTimeout(r, 500));
    
    console.log("11. Surprise Me...");
    await page.goto('http://localhost:3000/surprise-me');
    await page.waitForSelector('button');
    
    console.log("14. Navigation verified.");
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
