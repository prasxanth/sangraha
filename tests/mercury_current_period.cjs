const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  for(const timezoneId of ['America/Los_Angeles','Asia/Kolkata']){
   const page=await browser.newPage({timezoneId,viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const url=pathToFileURL(path.resolve('mercury_atlas.html')).href;
   await page.goto(url);
   const rows=await page.evaluate(()=>SD_DATA.slice().sort((a,b)=>Date.parse(a.startExact)-Date.parse(b.startExact)));
   await page.clock.install({time:new Date(rows[0].startExact)});
   const transitions=[1,9,81]; // SD, PD and AD changes.
   for(const index of transitions){
    const before=rows[index-1],after=rows[index],boundary=Date.parse(after.startExact);
    await page.clock.setSystemTime(boundary-1000);await page.goto(url);
    assert.equal(await page.evaluate(()=>currentSD().startExact),before.startExact);
    await page.evaluate(()=>{$('lifeToday').click();switchPage('life');showPeriod(DATA.findIndex(r=>isCurrent(r)));setDetailLevel('sd')});
    const selectedBefore=await page.evaluate(()=>({selected,sdIndex,ad:$('lifeAD').value,pd:$('lifePD').value}));
    await page.clock.runFor(1001);
    const state=await page.evaluate(()=>({current:currentSD().startExact,heading:$('currentPeriod').querySelector('h2').textContent,pd:[...document.querySelectorAll('.cell.current')].map(b=>DATA[+b.dataset.index].ad+'/'+DATA[+b.dataset.index].pd),sd:[...document.querySelectorAll('.sd-segment.current')].map(b=>sdByParent.get(sdParent.ad+'/'+sdParent.pd)[+b.dataset.sd].startExact),matrix:[...document.querySelectorAll('.life-map-heading.is-current')].map(e=>+e.dataset.start),selection:{selected,sdIndex,ad:$('lifeAD').value,pd:$('lifePD').value}}));
    assert.equal(state.current,after.startExact);assert.equal(state.heading,`${after.ad} → ${after.pd} → ${after.sd}`);
    assert.deepEqual(state.pd,[after.ad+'/'+after.pd]);
    assert.deepEqual(state.sd,index===1?[after.startExact]:[]);
    assert.deepEqual(state.matrix,index===1?[boundary]:[]);
    assert.deepEqual(state.selection,selectedBefore,'Clock updates must not interrupt manual exploration');
    await page.evaluate(()=>modal.close());
    await page.evaluate(()=>$('today').click());assert(await page.evaluate(()=>isCurrent(DATA[selected])));
    await page.evaluate(()=>{futureOnly=true;renderFilters(false)});
    assert(await page.evaluate(()=>[...matches].every(i=>periodBounds(DATA[i]).end>Date.now())));
   }
   // Suspended browser / clock jumps: each resume hook catches up immediately.
   for(const event of ['focus','pageshow','visibilitychange']){
    await page.clock.setSystemTime(new Date(rows[150].startExact));
    await page.evaluate(event=>(event==='visibilitychange'?document:window).dispatchEvent(new Event(event)),event);
    assert((await page.locator('#currentPeriod h2').textContent()).includes(rows[150].sd));
    assert.equal(await page.evaluate(()=>lastCurrentKey),rows[150].startExact);
    await page.clock.setSystemTime(new Date(rows[20].startExact));await page.clock.runFor(60001);
    assert.equal(await page.evaluate(()=>lastCurrentKey),rows[20].startExact);
   }
   // Half-open intervals include the first instant and exclude the final instant.
   for(const edge of [Date.parse(rows[0].startExact),Date.parse(rows.at(-1).endExact)]){
    await page.clock.setSystemTime(edge-1);await page.goto(url);await page.clock.runFor(1);
    const inside=edge===Date.parse(rows[0].startExact);
    assert.equal(await page.locator('.cell.current').count(),inside?1:0);
    assert.equal(await page.locator('[data-current-dimension]').count(),inside?10:0);
   }
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS: exact SD/PD/AD transitions, MD entry/exit, live markers and overview, Today and future filters, resume and clock jumps, preserved browsing, two time zones.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
