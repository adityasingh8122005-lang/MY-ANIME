const puppeteer = require('puppeteer');

async function runTest(pass) {
  console.log(`\n--- STARTING PHASE 3 E2E TEST: PASS ${pass} ---`);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log("Navigating to Home...");
    await page.goto('http://localhost:3001');
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Test Search Overlay Activation (Ctrl+K)
    console.log("Testing Global Ctrl+K Search Trigger...");
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    await new Promise(r => setTimeout(r, 1000));
    const searchUrl = page.url();
    if (!searchUrl.includes('/search')) throw new Error('Ctrl+K did not open search overlay');
    
    // Test Search Results and Escape
    console.log("Testing Search Keyboard Navigation...");
    await page.type('input[type="text"]', 'Naruto');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2000));
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));
    if (page.url().includes('/search')) throw new Error('Escape did not close search overlay');

    // Go back to search to click a result
    console.log("Testing Search Results Navigation...");
    await page.goto('http://localhost:3001/search');
    await page.type('input[type="text"]', 'One Piece');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2000));
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    if (!page.url().includes('/anime/')) throw new Error('Failed to navigate to Anime Details from search');

    // Test Anime Details UI
    console.log("Testing Cinematic Anime Details Page...");
    await page.waitForSelector('h1', { timeout: 10000 });
    const hasReadMore = await page.evaluate(() => {
       const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Read more'));
       if (btn) btn.click();
       return !!btn;
    });
    console.log(hasReadMore ? "Read more interaction successful" : "Description was too short for Read more (this is fine)");

    console.log("Testing Collection UI...");
    await page.goto('http://localhost:3001/my-anime');
    await page.waitForSelector('h1', { timeout: 10000 });
    const isCollection = await page.evaluate(() => {
       return document.body.innerText.includes('YOUR COLLECTION');
    });
    if (!isCollection) throw new Error("Cinematic Collection header not found");

    console.log(`PASS ${pass} SUCCESSFUL.`);
  } catch (err) {
    console.error(`PASS ${pass} FAILED:`, err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

async function runAll() {
  for (let i = 1; i <= 3; i++) {
    await runTest(i);
  }
  console.log("\nALL PHASE 3 E2E TESTS PASSED SUCCESSFULLY.");
}
runAll();
