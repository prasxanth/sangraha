const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 for(const engine of ['chromium','webkit']){
  const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{
   const page=await browser.newPage({viewport:{width:402,height:874},isMobile:true,hasTouch:true}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve('mercury_atlas.html')).href);
   for(const width of [320,375,402,430,844]){
    await page.setViewportSize({width,height:874});
    await page.locator('[data-page="timeline"]').click();
    const boxes=await page.locator('.jy-view-nav button').evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom})));
    assert(boxes.every(b=>Math.abs(b.top-boxes[0].top)<1&&Math.abs(b.bottom-boxes[0].bottom)<1),'Jyotish buttons align');
    assert.equal(await page.locator('#jy-tab-now').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('#jy-tab-timeline').getAttribute('aria-pressed'),null);
    await page.locator('[data-page="practice"]').click();
    for(const section of ['plan','journal']){
     await page.locator('#guidance-tab-'+section).click();
     const id=section==='plan'?'guidanceDate':'journalDate';
     assert(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1&&e.scrollWidth<=e.clientWidth+1}),engine+' date field fits '+width);
     await page.locator('#'+id).fill('2026-10-05');assert.equal(await page.locator('#'+id).inputValue(),'2026-10-05');
    }
   }
   await page.setViewportSize({width:402,height:874});
   for(const area of ['guide','practices']){
    await page.locator('[data-page="'+(area==='guide'?'guide':'practice')+'"]').click();if(area==='practices')await page.locator('#guidance-tab-practices').click();
    const root=area==='guide'?'#guidePage':'#guidance-view-practices';
    for(const topic of await page.locator(root+' .topic-section').all()){
     await topic.locator(':scope > summary').click();
     const reader=topic.locator('.topic-reader');if(await reader.count()){
      const selector=reader.locator('.reader-controls select');const total=await selector.locator('option').count();
      for(let i=0;i<total;i++){
       await selector.selectOption(String(i));assert.equal(await reader.locator('.reader-page:visible').count(),1);
       assert(await reader.evaluate(e=>e.scrollWidth<=e.clientWidth+1),engine+' reader stays within panel: '+await topic.locator(':scope > summary').textContent()+' / '+i);
       assert(!/\bv[3-6]\b/i.test(await reader.innerText()),'No visible source-version labels');
      }
      await selector.selectOption('0');await reader.locator('button[aria-label="Next topic"]').click();assert.equal(await selector.inputValue(),'1');
     }
     await topic.locator(':scope > summary').click();
    }
   }
   await page.locator('[data-page="practice"]').click();await page.locator('#guidance-tab-plan').click();await page.screenshot({path:'/tmp/atlas-'+engine+'-plan.png'});
   await page.locator('#guidance-tab-practices').click();const topic=page.locator('#guidance-view-practices .topic-section').nth(2);await topic.locator('summary').first().click();await page.screenshot({path:'/tmp/atlas-'+engine+'-reader.png'});
   assert.deepEqual(errors,[]);console.log('PASS '+engine+': aligned navigation, native date bounds/input, topic reader navigation and generic labels.');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
