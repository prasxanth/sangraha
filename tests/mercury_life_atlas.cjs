const assert = require('node:assert/strict');
const crypto=require('node:crypto'),golden=require('./fixtures/mercury_v6_reference.json');
const {chromium} = require('playwright');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Optional external reference is read only: compare every source record and result.
  let reference;
  if(process.argv[2]) {
   await page.goto(pathToFileURL(path.resolve(process.argv[2])).href);
   reference=await page.evaluate(()=>({records:DATA,results:DATA.map(r=>life(r))}));
  }
  await page.goto(pathToFileURL(path.resolve('mercury_atlas.html')).href);
  const actual=await page.evaluate(()=>({records:SD_DATA,results:SD_DATA.map(r=>life(r))}));
  assert.equal(actual.records.length,729);
  const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
  assert.equal(hash(actual.records),golden.recordsSha256);
  assert.equal(hash(actual.results),golden.resultsSha256,'All 7,290 results match the independently captured v6 source');
  for(const sample of golden.samples)assert.deepEqual(actual.results[sample.index][sample.dimension],sample.result,sample.label);
  if(reference) assert.deepEqual(actual,reference,'Source data and all 7,290 dimension results must match');
  assert(await page.evaluate(()=>SD_DATA.every(r=>DIM_ORDER.every(k=>{const d=dimResult(r,k);return d.heat>=1&&d.heat<=5&&Math.abs(d.heat-d.parent)<=2}))), 'SD cap');
  assert(await page.evaluate(()=>DATA.every(pd=>DIM_ORDER.every(k=>sdByParent.get(pd.ad+'/'+pd.pd).every(sd=>(pdResult(pd,k).heat===dimResult(sd,k).parent&&pdResult(pd,k).score===dimResult(sd,k).parentScore))))), 'Every parent view matches v6 parent heat');
  assert(await page.evaluate(()=>DATA.every(r=>pdResult(r,'career').heat===r.heat&&pdResult(r,'career').rationale===r.assessment)), 'All 81 Career anchors and assessments match v6, including its Rahu/Rahu correction');
  assert(await page.evaluate(()=>SD_DATA.every(r=>DIM_ORDER.every(k=>{const d=dimResult(r,k),base=pdResult(r,k).raw,sd=.16*profile(k,r.sd)+.20*pairAdj(k,r.pd,r.sd)+.05*pairAdj(k,r.ad,r.sd),trans=.70*d.transit+d.contact+.45*d.fast,strong=Math.abs(sd+trans)>=.70&&(Math.sign(sd)===Math.sign(trans)||Math.abs(d.contact)>=.20),cap=Math.abs(trans)>.55&&Math.abs(sd)<.10?1:strong?2:1;return Math.abs(d.heat-d.parent)<=cap}))), 'V5 convergence and transit-only guard');
  assert(await page.evaluate(()=>DIM_ORDER.every(k=>order.every(p=>profile(k,p)===DIMS[k].profiles[p]))),'Profiles must remain absolute');
  const hierarchyExample=await page.evaluate(()=>{const r=SD_DATA.find(r=>r.ad==='Venus'&&r.pd==='Mercury'&&r.sd==='Mercury');const d=dimResult(r,'career');return {parent:d.parent,parentScore:d.parentScore,heat:d.heat,score:d.score,intensity:d.intensity}});
  assert.deepEqual(hierarchyExample,{parent:2,parentScore:48,heat:2,score:65,intensity:'LOW'});
  await page.evaluate(()=>{setFocusDimension('career');showPeriod(DATA.findIndex(r=>r.ad==='Venus'&&r.pd==='Mercury'))});
  assert.equal(await page.locator('#pdPanel [data-parent-score]').textContent(),'+48');
  await page.locator('#sdTab').click();await page.selectOption('#sdSelect','0');
  assert.equal(await page.locator('#sdPanel [data-parent-score]').textContent(),'+48');
  assert((await page.locator('#sdSelection .support-intensity').textContent()).includes('+65'));
  await page.locator('#closeModal').click();
  const rahu=await page.evaluate(()=>{const p=DATA.find(r=>r.ad==='Rahu'&&r.pd==='Rahu');const r=sdByParent.get('Rahu/Rahu').find(r=>r.sd==='Rahu');return {baseline:pdResult(p,'career').heat,intensity:dimResult(r,'career').intensity,support:dimResult(r,'career').heat}});
  assert.deepEqual(rahu,{baseline:3,intensity:'VERY HIGH',support:3});
  for(const intensity of ['LOW','MEDIUM','HIGH','VERY HIGH']){
   await page.evaluate(intensity=>{$('intensityFilter').value=intensity;renderFilters(false)},intensity);
   assert(await page.evaluate(intensity=>DATA.every((r,i)=>matches.has(i)===sdByParent.get(r.ad+'/'+r.pd).some(sd=>dimResult(sd,focusDimension).intensity===intensity)),intensity));
  }
  await page.evaluate(()=>{$('toneFilter').value='SUPPORTIVE';$('intensityFilter').value='VERY HIGH';setFocusDimension('mind')});
  assert(await page.evaluate(()=>DATA.every((r,i)=>matches.has(i)===sdByParent.get(r.ad+'/'+r.pd).some(sd=>sd.transitTone==='SUPPORTIVE'&&dimResult(sd,'mind').intensity==='VERY HIGH'))));
  await page.evaluate(()=>clearFilters());assert.equal(await page.locator('#intensityFilter').inputValue(),'');
  assert.equal(await page.locator('.cell:not(.dim)').count(),81);
  // Use a known date so current-period interactions are reproducible.
  await page.clock.install({time:new Date('2026-09-23T19:00:00Z')});
  await page.evaluate(()=>renderCurrentPeriod());
  assert.equal(await page.locator('[data-current-dimension]').count(),10);
  assert.equal(await page.locator('#currentPeriod .intensity-bars').count(),10);
  await page.locator('[data-current-dimension="spiritual"]').click();
  assert(await page.locator('#sdPanel').isVisible());
  assert.equal(await page.locator('#detailDimension').inputValue(),'spiritual');
  assert(await page.locator('#sdPanel .intensity-badge').isVisible());
  assert.equal(await page.locator('#sdRibbon .intensity-bars').count(),9);
  assert(await page.evaluate(()=>[...$('sdRibbon').children].every((b,i)=>b.querySelectorAll('.filled').length===intensityLevel(dimResult(sdByParent.get(sdParent.ad+'/'+sdParent.pd)[i],focusDimension).intensity))));
  assert(await page.evaluate(()=>{const d=dimResult(sdByParent.get(sdParent.ad+'/'+sdParent.pd)[sdIndex],focusDimension);return $('sdSelection').textContent.includes(d.pdRule)&&$('sdSelection').textContent.includes(d.sdRule)}));
  await page.locator('#sdPanel .evidence-card summary').click();
  assert.equal(await page.locator('#sdPanel .planet').count(),9);
  assert((await page.locator('#sdPanel .planet').first().textContent()).includes('from Libra Moon'));
  await page.setViewportSize({width:320,height:844});
  assert(await page.evaluate(()=>modal.scrollWidth<=modal.clientWidth+1),'Expanded v6 transit evidence fits a narrow phone');
  await page.screenshot({path:'/tmp/mercury-v6-evidence.png'});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>$('sdSelection').textContent.includes(String(dimResult(sdByParent.get(sdParent.ad+'/'+sdParent.pd)[sdIndex],focusDimension).score))));
  await page.locator('#closeModal').click();
  assert(await page.locator('[data-current-dimension="spiritual"]').evaluate(e=>e===document.activeElement));
  await page.locator('[data-page="life"]').click();
  assert.equal(await page.locator('.life-map-cell').count(),90);
  await page.locator('#lifeToday').click();
  assert.equal(await page.locator('#lifeLevel').inputValue(),'sd');
  assert.equal(await page.locator('.life-map-cell .intensity-bars').count(),90);
  assert(await page.evaluate(()=>[...$('lifeMatrix').querySelectorAll('.life-map-cell')].every(b=>{const r=sdByParent.get(DATA[+$('lifePD').value].ad+'/'+DATA[+$('lifePD').value].pd)[+b.dataset.col],d=dimResult(r,b.dataset.key);return b.classList.contains('h'+d.heat)&&b.getAttribute('aria-label').includes(d.intensity)&&b.querySelectorAll('.filled').length===['LOW','MEDIUM','HIGH','VERY HIGH'].indexOf(d.intensity)+1})));
  assert.equal(await page.locator('.life-map-heading.is-current').count(),1);
  // Walk across an AD boundary, then reverse it.
  await page.selectOption('#lifeAD','0');
  await page.selectOption('#lifePD',await page.locator('#lifePD option').last().getAttribute('value'));
  const last=await page.locator('#lifePD').inputValue();
  await page.locator('#lifeNext').click();assert.equal(await page.locator('#lifeAD').inputValue(),'1');
  await page.locator('#lifePrevious').click();assert.equal(await page.locator('#lifePD').inputValue(),last);
  await page.locator('.life-map-cell[data-key="mind"]').first().click();
  assert.equal(await page.locator('#detailDimension').inputValue(),'mind');assert(await page.locator('#sdPanel').isVisible());
  await page.selectOption('#detailDimension','wealth');
  assert(await page.evaluate(()=>[...$('sdRibbon').children].every((b,i)=>b.classList.contains('h'+dimResult(sdByParent.get(sdParent.ad+'/'+sdParent.pd)[i],'wealth').heat))));
  await page.locator('#closeModal').click();
  await page.locator('.life-map-cell').first().focus();await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.key),'wealth');
  for(const width of [320,390,768,1440]) {
   await page.setViewportSize({width,height:900});
   for(const view of ['timeline','life','practice','guide']) {
    await page.locator(`[data-page="${view}"]`).click();
    assert.equal(await page.locator('.app-page:visible').count(),1);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${view} fits ${width}`);
   }
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-page="life"]').click();
  await page.screenshot({path:'/tmp/mercury-life-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.locator('[data-page="timeline"]').click();
  await page.screenshot({path:'/tmp/mercury-life-mobile.png',fullPage:true});
  await page.locator('[data-page="life"]').click();await page.screenshot({path:'/tmp/mercury-life-map.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: 729 records; 7,290 dimension results'+(reference?' match supplied source':'')+'; SD caps; current overview; matrix drilldown, navigation, keyboard and 320–1440px layouts.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
