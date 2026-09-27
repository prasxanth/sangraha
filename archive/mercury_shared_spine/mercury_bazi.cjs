const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-09-26T12:00:00Z')});
  await page.goto(pathToFileURL(path.resolve('mercury_atlas.html')).href);
  // Capture the supplied BaZi model independently of the integrated rendering layer.
  const source=fs.readFileSync(process.argv[2]||'mercury_atlas.html','utf8');
  await page.addScriptTag({content:'(()=>{'+source.slice(source.indexOf('const STEMS='),source.indexOf('function pill('))+'window.baziReference={sd:SD_DATA.map(r=>DIM_ORDER.map(k=>baziSD(r,k))),pd:DATA.map(r=>DIM_ORDER.map(k=>baziPD(r,k)))};})();'});
  const reference=await page.evaluate(()=>window.baziReference);
  const fixture=path.resolve('tests/fixtures/mercury_bazi_reference.json');
  if(process.env.UPDATE_BAZI_REFERENCE==='1')fs.writeFileSync(fixture,JSON.stringify({source:'mercury_atlas_jyotish_bazi_guidance.html',sdSha256:hash(reference.sd),pdSha256:hash(reference.pd)},null,2)+'\n');
  const golden=JSON.parse(fs.readFileSync(fixture));
  await page.locator('button[data-system-mode="bazi"]').click();
  const actual=await page.evaluate(()=>({sd:SD_DATA.map(r=>DIM_ORDER.map(k=>dimResult(r,k))),pd:DATA.map(r=>DIM_ORDER.map(k=>pdResult(r,k)))}));
  assert.equal(hash(actual.sd),golden.sdSha256,'All 7,290 BaZi SD results match the reference');
  assert.equal(hash(actual.pd),golden.pdSha256,'All 810 duration-weighted BaZi PD results match');
  assert.deepEqual(actual,reference);
  assert(await page.locator('#toneFilter').isDisabled());
  await page.locator('[data-current-dimension="career"]').click();
  assert.equal(await page.locator('#sdSelection time[datetime]').count(),2);
  assert.equal(await page.locator('#sdSelection .bazi-factor').count(),3);
  await page.locator('#closeModal').click();
  assert(await page.locator('[data-current-dimension="career"]').evaluate(e=>e===document.activeElement));
  await page.locator('button[data-system-mode="compare"]').click();
  assert.equal(await page.locator('.cell.compare-system').count(),81);
  await page.locator('[data-page="life"]').click();
  await page.locator('#lifeToday').click();
  assert.equal(await page.locator('.compare-life-cell').count(),90);
  assert.equal(await page.locator('.life-map-heading[data-start]').count(),9);
  const cell=page.locator('.life-map-cell').first();await cell.focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.col),'1');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#sdSelection time[datetime]').count(),2);
  assert.equal(await page.locator('#sdSelection .system-card').count(),2);
  await page.locator('#closeModal').click();
  await page.waitForFunction(()=>document.activeElement.dataset.col==='1');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.col),'1');
  await page.locator('[data-page="practice"]').click();
  assert(await page.locator('.metal-hero').isVisible());
  const before=await page.locator('#baziCurrentGuidance').textContent();
  const next=await page.evaluate(()=>currentSD().endExact);
  await page.clock.setSystemTime(new Date(next));
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  assert.notEqual(await page.locator('#baziCurrentGuidance').textContent(),before,'Guidance follows the exact current SD boundary');
  for(const width of [320,390,1024]){
   await page.setViewportSize({width,height:844});
   for(const name of ['timeline','life','practice','guide']){
    await page.locator(`[data-page="${name}"]`).click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} fits ${width}px`);
   }
  }
  await page.setViewportSize({width:390,height:844});await page.locator('[data-page="life"]').click();
  await page.screenshot({path:'/tmp/mercury-bazi-life.png',fullPage:true});
  await page.locator('button[data-system-mode="jyotish"]').click();
  assert.equal(await page.locator('.compare-life-cell').count(),0);
  assert.equal(await page.locator('body').getAttribute('aria-pressed'),null);
  assert.deepEqual(errors,[]);console.log('BaZi source parity, comparison, accessibility, live guidance and responsive checks passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
