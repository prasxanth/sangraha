const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

(async()=>{
 const original=fs.readFileSync('archive/iching_oracle.pre-copper-2026-09-28.html','utf8');
 const sourceData=JSON.parse(JSON.stringify(vm.runInNewContext(original.match(/var HEXAGRAMS = (\[[\s\S]*?\n\]);/)[1])));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',hasTouch:true});
  page.setDefaultTimeout(15000);
  const errors=[],remote=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url()))remote.push(request.url());});
  await page.goto(pathToFileURL(path.resolve('iching_oracle.html')).href);
  const goHome = async screen => { await page.locator('.brand').click(); await page.locator('#home-'+screen).click(); };
  assert.equal(await page.locator('nav').count(),0,'No persistent navigation row');
  await goHome('reading');assert(await page.locator('.empty-state').isVisible(),'Reading is accessible before casting');await page.locator('.brand').click();
  assert.deepEqual(await page.evaluate(()=>HEXAGRAMS),sourceData,'All 64 original texts and trigram assignments are preserved');
  const artwork=await page.evaluate(async()=>Promise.all(ARTWORK.map(async art=>{const img=new Image();img.src=art.src;await img.decode();return {width:img.naturalWidth,height:img.naturalHeight,alt:art.alt};})));
  assert.equal(artwork.length,64);assert(artwork.every(a=>a.width>=1536&&a.height>=1024&&a.alt));
  assert.equal(await page.evaluate(()=>new Set(ARTWORK.map(a=>a.src)).size),64,'Each hexagram has its own illustration');
  assert.deepEqual(await page.evaluate(()=>Object.entries(TRIG_MAP).map(([key,n])=>{const [upper,lower]=key.split(',').map(Number);const lines=[lower&1,(lower>>1)&1,(lower>>2)&1,upper&1,(upper>>1)&1,(upper>>2)&1];return [hexNumFromLines(lines),n];})),await page.evaluate(()=>Object.values(TRIG_MAP).map(n=>[n,n])),'All 64 bottom-to-top trigram lookups');
  await goHome('ref');
  await page.locator('#next').click();assert.match(await page.locator('#ref-card h1').textContent(),/Receptive/);
  await page.locator('#prev').click();await page.locator('#prev').click();assert.match(await page.locator('#ref-card h1').textContent(),/Before Completion/);
  await page.locator('#choose-hexagram').click();await page.locator('#ref-search').fill('well');assert.equal(await page.locator('.picker-card:visible').count(),1);
  await page.locator('.picker-card:visible').click();assert.equal(await page.locator('#ref-card h1').textContent(),'The Well');assert.equal(await page.locator('dialog[open]').count(),0);
  await page.locator('#choose-hexagram').click();await page.locator('#ref-search').fill('no-such-hexagram');assert(await page.locator('#no-matches').isVisible());
  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement===document.querySelector('#choose-hexagram'));
  await page.locator('#ref-card .card-copy').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#ref-card h1').textContent(),'Revolution');
  await goHome('cast');await page.locator('#question-input').fill('<img src=x onerror=alert(1)> What is changing?');
  await page.evaluate(()=>{Math.random=()=>0;});
  for(let i=0;i<6;i++){await page.locator('#cast-btn').click();await page.waitForFunction(()=>!throwing);}
  assert.equal(await page.evaluate(()=>currentCast.primary.n),1);assert.equal(await page.evaluate(()=>currentCast.relating.n),2);assert.equal(await page.evaluate(()=>currentCast.movingLines.length),6);
  await page.locator('#cast-btn').click();assert(await page.locator('#screen-reading').isVisible());assert.equal(await page.locator('.moving-card').count(),6);
  assert.match(await page.locator('.question-echo').textContent(),/<img src=x onerror=alert\(1\)>/);assert.equal(await page.locator('.question-echo img').count(),0,'Question is escaped');
  await page.locator('.related-card').click();assert.equal(await page.locator('#ref-card h1').textContent(),'The Receptive');
  await goHome('reading');assert.equal(await page.locator('#reading-content h1').textContent(),'The Creative');
  await page.locator('.new-cast').click();assert.equal(await page.locator('#question-input').inputValue(),'');assert.equal(await page.evaluate(()=>castLines.length),0);
  await page.evaluate(()=>{let i=0;Math.random=()=>i++%3===0?0:1;});
  for(let i=0;i<6;i++){await page.locator('#cast-btn').click();await page.waitForFunction(()=>!throwing);}
  assert.equal(await page.evaluate(()=>currentCast.primary.n),1);assert.equal(await page.evaluate(()=>currentCast.relating),null);
  await page.locator('#cast-btn').click();assert.equal(await page.locator('.moving-card').count(),0);assert.equal(await page.locator('.related-card').count(),0);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:width>800?950:844});
   for(const screen of ['home','cast','reading','ref']){
    await page.evaluate(screen=>navigate(screen),screen);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${screen} fits ${width}px`);
    assert(await page.evaluate(()=>$('content').scrollWidth<=$('content').clientWidth+1),`${screen} content fits ${width}px`);
    if(screen==='cast'){const box=await page.locator('#cast-btn').boundingBox();assert(box.y>=0&&box.y+box.height<=(width>800?950:844),`Casting action stays visible at ${width}`);}
   }
   await page.locator('.brand').click();
   for(const id of ['home-cast','home-ref','home-reading']){assert(await page.locator('#'+id).isVisible());}
   await page.locator('#home-ref').click();
   const card=await page.locator('#ref-card').boundingBox();
   assert(Math.abs((width>800?950:844)-(card.y+card.height))<=14,`Card extends to the bottom at ${width}`);
   await page.evaluate(()=>showReference(43));
   await page.locator('#ref-card .card-copy').evaluate(el=>{el.scrollTop=el.scrollHeight;});
   await page.waitForTimeout(50);
   assert(await page.locator('#ref-card .card-foot').isVisible());
   for(const id of ['prev','next','choose-hexagram']){
    const box=await page.locator('#'+id).boundingBox();assert(box&&box.y>=0&&box.y+box.height<= (width>800?950:844)+1,`${id} on screen at ${width}`);assert(box.height>=44,`${id} touch height`);
   }
  }
  assert.equal(await page.locator('#ref-card .card-art').evaluate(el=>getComputedStyle(el).objectFit),'contain','Symbolic scenes are shown without cropping');
  // Real touch events: horizontal swipe navigates; vertical scroll does not.
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>showReference(1));
  const swipe=async(start,end)=>page.evaluate(({start,end})=>{const target=$('ref-card');const first=new Touch({identifier:1,target,clientX:start[0],clientY:start[1]});const last=new Touch({identifier:1,target,clientX:end[0],clientY:end[1]});target.dispatchEvent(new TouchEvent('touchstart',{touches:[first],bubbles:true}));target.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[last],bubbles:true}));},{start,end});
  await swipe([300,230],[70,240]);
  assert.equal(await page.evaluate(()=>referenceNumber),2);
  await swipe([200,350],[180,180]);
  assert.equal(await page.evaluate(()=>referenceNumber),2);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[],'Entire app works without network requests');
  console.log('Passed: preserved texts, 64 unique decodable artworks, all trigram mappings, changing/unchanging casts, escaped questions, search, dialogs, keyboard/swipe navigation, home-based navigation, full-height cards at four viewport sizes, offline operation.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
