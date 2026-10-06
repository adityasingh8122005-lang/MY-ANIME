import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let criticalErrors = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore React 18 hydration/key warnings if they aren't critical
      if (!text.includes('Warning:')) {
        console.error(`[CONSOLE ERROR] ${text}`);
        criticalErrors++;
      }
    }
  });

  const viewports = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Tablet', width: 800, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Narrow Mobile', width: 320, height: 568 }
  ];

  for (const vp of viewports) {
    console.log(`Testing ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport(vp);
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    if (hasHorizontalScroll) {
      console.error(`❌ [FAIL] ${vp.name} has horizontal scrolling!`);
      criticalErrors++;
    } else {
      console.log(`✅ [PASS] ${vp.name} no horizontal scrolling.`);
    }
  }

  await browser.close();
  if (criticalErrors > 0) process.exit(1);
  else process.exit(0);
})();
