const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const readings=require('../docs/kena-individual-mantras.json');
const sources=require('../docs/kena-commentary-sources.json');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('kena_upanishad.html')).href,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#screen-appendix').count(),1);
  assert.equal(await page.locator('#screen-appendix .appendix-verse').count(),34);
  assert.equal(await page.locator('#screen-appendix [id^="bibliography-"]').count(),Object.keys(sources).length);
  for(const d of readings){
   await page.evaluate(n=>openMantra(n,true),d.number);
   const cards=page.locator('#study-passage .commentary-note');
   assert.equal(await cards.count(),d.commentaries.length);
   assert.equal(await cards.first().getAttribute('data-source'),'shankara');
   assert.equal(await cards.first().locator('h4').textContent(),'Śaṅkara');
   for(let i=0;i<d.commentaries.length;i++){
    const c=d.commentaries[i];assert(sources[c.sourceId]);
    assert.equal(await cards.nth(i).locator('p').last().textContent(),c.text);
    assert.equal(await cards.nth(i).locator('.commentary-kind').first().textContent(),c.kind);
    if(c.quote)assert.equal(await cards.nth(i).locator('blockquote').textContent(),c.quote);
   }
   assert.equal(await page.locator('#study-passage .source-note').count(),0,'No repeated source prose in studies');
   assert.equal(await page.locator('#study-passage a[href^="http"]').count(),0,'External references consolidated');
   const button=page.locator('#study-passage .study-sources-link button');
   await button.click();assert(await page.locator('#screen-appendix').isVisible());
   const backBox=await page.locator('#appendix-back').boundingBox();
   assert(backBox.y>=0 && backBox.y+backBox.height<page.viewportSize().height,'Back stays visible when opening a deep appendix reference');
   const id='source-'+d.number.replace('.','-');
   assert.equal(await page.evaluate(()=>document.activeElement.id),id);
   const links=await page.locator('#'+id+' a').evaluateAll(xs=>xs.map(x=>x.href));
   assert(links.includes(d.wisdomlib));
   for(const c of d.commentaries)assert(links.includes(c.sourceUrl),d.number+' source '+c.author);
   assert(links.includes(d.sarvanandaPdf+'#page='+d.pdfPages.split('–')[0]));
   await page.locator('#appendix-back').click();assert(await page.locator('#screen-study').isVisible());
   assert.equal(await page.locator('#study-khanda').textContent(),'Khaṇḍa '+['I','II','III','IV'][d.kh-1]+' · '+d.number);
   assert(await button.evaluate(e=>e===document.activeElement));
  }
  for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>openMantra('2.4',true));
   assert(await page.locator('#study-passage').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   const button=page.locator('#study-passage .study-sources-link button');await button.scrollIntoViewIfNeeded();
   const scroll=await page.locator('#content').evaluate(e=>e.scrollTop);await button.click();
   assert(await page.locator('#screen-appendix').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   await page.screenshot({path:'/private/tmp/kena-appendix-'+width+'.png'});
   await page.locator('#appendix-back').click();
   assert(Math.abs(await page.locator('#content').evaluate(e=>e.scrollTop)-scroll)<2,'Return restores study scroll');
   await page.locator('#study-passage .verse-commentaries').scrollIntoViewIfNeeded();
   await page.screenshot({path:'/private/tmp/kena-commentary-'+width+'.png'});
   await page.evaluate(()=>navigate('overview'));await page.locator('#overview-appendix').click();await page.locator('#appendix-back').click();assert(await page.locator('#screen-overview').isVisible());
   await page.evaluate(()=>navigate('reference'));await page.locator('#index-appendix').click();await page.locator('#appendix-back').click();assert(await page.locator('#screen-reference').isVisible());
  }
  await page.evaluate(()=>openSourceAppendix('4.9'));
  await page.locator('#source-4-9 button').click();assert(await page.locator('#screen-study').isVisible());
  assert((await page.locator('#study-passage .verse-commentaries').textContent()).includes('gradual liberation'));
  assert.deepEqual(errors,[]);
  console.log('PASS: 63 sourced commentary notes, correct author labels and quotations, 34 appendix routes and PDF page links, return focus/scroll, overview/index access and four responsive layouts.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
