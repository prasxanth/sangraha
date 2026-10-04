const assert=require('node:assert/strict'),{chromium}=require('playwright');const {pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve('mercury_atlas.html')).href);
 const heights={};
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:844});
  for(const view of ['timeline','bazi','compare','practice','guide']){await page.locator(`[data-page="${view}"]`).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view} fits ${width}`)}
  await page.locator('[data-page="bazi"]').click();
  for(const view of ['now','cycles','months','days']){
   await page.locator('#bazi-tab-'+view).click();assert.equal(await page.locator('[data-bazi-panel]:visible').count(),1);
   const height=await page.locator('main').evaluate(e=>e.scrollHeight);if(width===390)heights[view]=height;
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(width===390){assert(height<=1100,`${view} content is bounded, got ${height}px`);await page.screenshot({path:`/tmp/atlas-final-bazi-${view}.png`})}
  }
  await page.locator('#bazi-tab-months').click();await page.locator('[data-bmonth="4"]').click();assert(await page.locator('#insightDialog').isVisible());assert(await page.locator('#insightDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.locator('#insightBody [data-native-dim="mind"]').click();assert.equal(await page.locator('#baziNativeDimension').inputValue(),'mind');
  await page.locator('#insightBody > button').first().click();assert(await page.locator('#bazi-view-days').isVisible());await page.locator('#baziDays button').first().click();assert((await page.locator('#insightBody').textContent()).includes('daily modifier'));await page.locator('#insightClose').click();
  await page.locator('[data-page="compare"]').click();if(await page.locator('#compareBack').isVisible())await page.locator('#compareBack').click();await page.locator('[data-cmonth="9"]').click();assert(await page.locator('#compareCalendar').isHidden());assert(await page.locator('#comparison-view-month').isVisible());assert(await page.locator('#compareLowerLayer').isHidden());await page.locator('#comparison-tab-shorter').click();assert(await page.locator('#comparison-view-month').isHidden());assert(await page.locator('#compareLowerLayer').isVisible());await page.locator('#compareBack').click();assert(await page.locator('#compareCalendar').isVisible());
  await page.locator('[data-page="timeline"]').click();await page.locator('#jy-tab-now').click();assert(await page.locator('#currentPeriod').isVisible());assert(await page.locator('#grid').isHidden());await page.locator('#jy-tab-timeline').click();assert(await page.locator('#grid').isVisible());assert(await page.locator('#currentPeriod').isHidden());
 }
 assert.deepEqual(errors,[]);console.log('PASS: app-wide task views, BaZi month/day popup drill-down, independent Compare views, Jyotish Now/Timeline, responsive layouts. BaZi 390px content heights:',JSON.stringify(heights));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
