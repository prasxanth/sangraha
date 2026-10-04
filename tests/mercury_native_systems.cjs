const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const golden=require('./fixtures/mercury_native_reference.json');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'America/Los_Angeles'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-09-26T11:00:00Z')});await page.clock.pauseAt(new Date('2026-09-26T12:00:00Z'));
  const url=pathToFileURL(path.resolve('mercury_atlas.html')).href;
  await page.goto(url);
  const raw=await page.locator('#baziNativeData').textContent(),data=JSON.parse(raw);
  assert.equal(hash(raw),golden.dataSha256,'Every native record matches the attached source');
  if(process.argv[2])assert.equal(raw,fs.readFileSync(process.argv[2],'utf8').match(/id="baziNativeData">(.*?)<\/script>/s)[1]);
  const years=Object.values(data.years),months=years.flatMap(y=>y.months),days=months.flatMap(m=>m.days);
  assert.equal(years.length,golden.years);assert.equal(months.length,golden.months);assert.equal(days.length,golden.days);
  for(const record of [...years,...months,...days,...Object.values(data.compare).flat()]){
   assert.equal(Object.keys(record.dims).length,10);
   for(const d of Object.values(record.dims)){assert(d.heat>=1&&d.heat<=5);assert(['LOW','MEDIUM','HIGH','VERY HIGH'].includes(d.intensity))}
  }
  await page.locator('[data-page="bazi"]').click();
  assert.equal(await page.locator('#baziNativeYear').inputValue(),'2026');
  const monthIndex=data.years['2026'].months.findIndex(m=>Date.parse(m.start)<=Date.parse('2026-09-26T12:00:00Z')&&Date.parse(m.end)>Date.parse('2026-09-26T12:00:00Z'));
  assert.equal(await page.locator('#baziNativeMonth').inputValue(),String(monthIndex));
  assert.equal(await page.locator('#baziMonths button').count(),12);
  assert.equal(await page.locator('#baziYears button[aria-current="date"]').count(),1);
  assert.equal(await page.locator('#baziDaYun .pill').count(),0,'Do not mislabel annual results as decade results');
  await page.locator('#baziNativeDimension').selectOption('mind');
  assert((await page.locator('#baziMonthDetail').textContent()).includes('Mind'));
  await page.locator('#bazi-tab-days').click();await page.locator('#baziDays button').nth(1).click();await page.locator('#insightClose').click();await page.locator('#baziDays button').nth(2).click();await page.locator('#insightClose').click();
  assert.equal(await page.locator('#baziDayDetail h3').count(),1,'Selecting days replaces, not appends, details');
  await page.locator('#baziNativeMonth').selectOption('0');assert(await page.locator('#baziDayDetail').isHidden());
  await page.locator('[data-page="compare"]').click();
  assert.equal(await page.locator('.compare-month').count(),12);
  await page.locator('[data-cmonth="8"]').first().click();
  assert.equal(await page.locator('#compareNativeDetail .agreement-cell').count(),10);
  await page.locator('#compareBack').click();await page.locator('#compareDimension').selectOption('wealth');await page.locator('[data-cmonth="8"]').click();assert((await page.locator('#compareNativeDetail').textContent()).includes('Wealth'));
  await page.locator('#compareBack').click();await page.locator('#compareYear').selectOption('2021');
  await page.locator('[data-cmonth="0"]').first().click();assert((await page.locator('#compareNativeDetail').textContent()).includes('No Jyotish reading'));
  await page.locator('#compareBack').click();await page.locator('#compareYear').selectOption('2038');
  await page.locator('[data-cmonth="11"]').first().click();assert((await page.locator('#compareNativeDetail').textContent()).includes('No Jyotish reading'));
  // Independent year, solar month, luck and UTC-day transitions, without changing browsing selections.
  for(const boundary of [data.years['2027'].start,data.years['2026'].months[7].start,data.years['2030'].luckStart,'2026-09-27T00:00:00Z']){
   const t=Date.parse(boundary);await page.clock.setSystemTime(t-1);await page.goto(url);
   await page.locator('[data-page="bazi"]').click();
   await page.locator('#bazi-tab-months').click();await page.locator('#baziNativeYear').selectOption('2024');
   const before=await page.locator('#baziCurrent').textContent();await page.clock.runFor(1);
   assert.notEqual(await page.locator('#baziCurrent').textContent(),before,`Native context updates at ${boundary}`);
   assert.equal(await page.locator('#baziNativeYear').inputValue(),'2024');
   assert.equal(await page.locator('#baziNativeMonth').inputValue(),'0');
   const date=new Date(t).toISOString().slice(0,10);
   assert((await page.locator('#baziCurrentGuidance').textContent()).includes(date));
   await page.locator('#bazi-tab-now').click();await page.locator('#baziToday').click();
   const y=Object.entries(data.years).find(([,y])=>Date.parse(y.start)<=t&&t<Date.parse(y.end));
   assert.equal(await page.locator('#baziNativeYear').inputValue(),y[0]);
  }
  for(const event of ['focus','pageshow','visibilitychange']){
   await page.clock.setSystemTime(new Date('2031-04-12T12:00:00Z'));
   await page.evaluate(e=>(e==='visibilitychange'?document:window).dispatchEvent(new Event(e)),event);
   assert((await page.locator('#baziCurrent').textContent()).includes('2031-04-12'));
   await page.clock.setSystemTime(new Date('2026-09-26T12:00:00Z'));await page.clock.runFor(60001);
   assert((await page.locator('#baziCurrent').textContent()).includes('2026-09-26'));
  }
  for(const t of [Date.parse(years[0].start)-1,Date.parse(years.at(-1).end)]){
   await page.clock.setSystemTime(t);await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
   assert((await page.locator('#baziCurrent').textContent()).includes('outside'));
  }
  await page.clock.setSystemTime(new Date('2026-09-26T12:00:00Z'));await page.goto(url);
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:900});
   for(const view of ['timeline','bazi','compare','practice','guide']){
    await page.locator(`[data-page="${view}"]`).click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view} fits ${width}px`);
    assert.equal(await page.locator('.app-nav [aria-current="page"]').count(),1);
   }
  }
  await page.setViewportSize({width:390,height:844});await page.locator('[data-page="bazi"]').click();
  await page.screenshot({path:'/tmp/mercury-native-bazi.png',fullPage:true});
  await page.locator('[data-page="compare"]').click();await page.locator('[data-cmonth="8"]').first().click();
  await page.screenshot({path:'/tmp/mercury-native-compare.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: exact native source dataset; years/months/days; comparison coverage; independent live boundaries and resume; preserved selections; responsive pages.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
