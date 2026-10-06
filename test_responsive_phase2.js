import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let criticalErrors = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Warning:')) {
        console.error(`[CONSOLE ERROR] ${text}`);
        criticalErrors++;
      }
    }
  });

  const viewports = [
    { name: 'Large Desktop', width: 1920, height: 1080 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Tablet', width: 800, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Narrow Mobile', width: 320, height: 568 }
  ];

  for (const vp of viewports) {
    console.log(`\nTesting ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport(vp);
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Check horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    if (hasHorizontalScroll) {
      console.error(`❌ [FAIL] ${vp.name} has horizontal scrolling!`);
      criticalErrors++;
    } else {
      console.log(`✅ [PASS] ${vp.name} no horizontal scrolling.`);
    }

    // Verify appropriate navigation is visible
    if (vp.width >= 768) {
      const desktopNavVisible = await page.evaluate(() => {
        const desktopNav = document.querySelector('header.hidden.sm\\:block');
        return desktopNav && window.getComputedStyle(desktopNav).display !== 'none';
      });
      if (!desktopNavVisible) {
        console.error(`❌ [FAIL] Desktop nav not visible on ${vp.name}`);
        criticalErrors++;
      }
    } else {
      const mobileNavVisible = await page.evaluate(() => {
        const bottomNav = document.querySelector('nav.sm\\:hidden');
        return bottomNav && window.getComputedStyle(bottomNav).display !== 'none';
      });
      if (!mobileNavVisible) {
        console.error(`❌ [FAIL] Mobile bottom nav not visible on ${vp.name}`);
        criticalErrors++;
      }
    }
  }

  await browser.close();
  if (criticalErrors > 0) process.exit(1);
  else process.exit(0);
})();
