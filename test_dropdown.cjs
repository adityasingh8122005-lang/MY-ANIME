const puppeteer = require('puppeteer');
(async () => {
  let browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  let page = await browser.newPage();
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  
  // Click the avatar
  const profileBtn = await page.$('.relative > button.rounded-full');
  if (profileBtn) {
    await profileBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const html = await page.content();
    if (html.includes('Admin Panel') || html.includes('Settings')) {
      console.log('SUCCESS_DROPDOWN_IS_IN_DOM');
    } else {
      console.log('FAIL_DROPDOWN_IS_NOT_IN_DOM');
    }
  } else {
    console.log('FAIL_BUTTON_NOT_FOUND');
  }
  await browser.close();
})();
