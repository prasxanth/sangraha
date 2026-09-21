const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',r=>r.abort());await page.addInitScript(()=>{const t=setTimeout;window.setTimeout=(f,d,...a)=>String(f).includes('loadSwiss().then')?0:t(f,d,...a)});
 await page.goto('file://'+process.cwd()+'/astrology_engine.html');await page.waitForFunction(()=>document.querySelector('#validationTable').dataset.autorun==='done');
 const audit=await page.evaluate(()=>{
  const near=(a,b)=>{if(Math.abs(a-b)>1e-9)throw Error(`${a} != ${b}`)};
  const toy=weightedPercentileReference([{value:0,duration:1},{value:1,duration:8},{value:2,duration:1}]);
  [0,1,2].forEach((v,i)=>near(percentileFromReference(v,toy),[5,50,95][i]));near(percentileFromReference(-1,toy),0);near(percentileFromReference(3,toy),100);
  near(percentileFromReference(.2,weightedPercentileReference([{value:.2,duration:5},{value:.2,duration:25}])),50);
  near(percentileFromReference(1,weightedPercentileReference([{value:1,duration:4},{value:1,duration:4},{value:0,duration:1},{value:2,duration:1}])),50);
  if(percentileFromReference(1,weightedPercentileReference([]))!==null)throw Error('Missing distribution');
  const bands=[0,9.999,10,29.999,30,69.999,70,89.999,90,100].map(lifetimeBand).map(x=>x.label);
  const md=dashaRoot.find(p=>p.lord==='Mercury'&&p.a>chart.birthMs),ad=childPeriods(md).find(p=>p.lord==='Rahu'),before=DOMAINS.map((_,di)=>[scorePeriod(md,di),activationPeriod(md,di)]);
  const state=lifetimeDisplayReference(),bounds=lifeBounds(),duration=state.leaves.reduce((s,r)=>s+r.duration,0);near(duration/(bounds.b-bounds.a),1);
  const results=DOMAINS.map((domain,di)=>{
   const value=scorePeriod(ad,di),pct=lifetimePercentile(value,di),rounded=Math.round(value*1e12)/1e12;let lower=0,equal=0;
   for(const row of state.leaves){const score=Math.round(scorePeriod(row.period,di)*1e12)/1e12;if(score<rounded)lower+=row.duration;else if(score===rounded)equal+=row.duration}
   near(pct,100*(lower+equal/2)/duration);return{domain,support:value,percentile:pct,band:lifetimeBand(pct).label};
  });
  const p=lifetimePercentile(scorePeriod(ad,0),0);prefix=ad.path;calendarYear=2027;near(p,lifetimePercentile(scorePeriod(ad,0),0));calendarYear=null;
  $('contrastMode').value='absolute';near(p,lifetimePercentile(scorePeriod(ad,0),0));$('contrastMode').value='lifetime';
  const beforeState=lifetimeDisplayReference(),h=profile.horizon;profile.horizon=h-1;const clipped=lifetimeDisplayReference();if(clipped===beforeState||clipped.bounds.b===beforeState.bounds.b)throw Error('Horizon reference stale');profile.horizon=h;
  const restored=lifetimeDisplayReference(),selection=selectedSystemIds;selectedSystemIds=new Set(['Vedic']);if(lifetimeDisplayReference()===restored)throw Error('System reference stale');selectedSystemIds=selection;
  const priorMode=SYSTEM_ROUTING_MODE;SYSTEM_ROUTING_MODE='custom';const originalWeight=WEIGHTS.Career.Vedic,old=lifetimeDisplayReference();WEIGHTS.Career.Vedic=originalWeight+.01;if(lifetimeDisplayReference()===old)throw Error('Weight reference stale');WEIGHTS.Career.Vedic=originalWeight;SYSTEM_ROUTING_MODE=priorMode;
  const unchanged=JSON.stringify(before)===JSON.stringify(DOMAINS.map((_,di)=>[scorePeriod(md,di),activationPeriod(md,di)]));
  prefix=['Mercury','Venus','Mars'];switchTab('cycles');render();selectCycleMetric('direction');
  return{bands,unchanged,careerMD:before[0][0],results,leafCount:state.leaves.length,defaultMode:$('contrastMode').value};
 });
 assert(audit.unchanged);assert(Math.abs(audit.careerMD-0.3045283084587375)<1e-12);assert.equal(audit.defaultMode,'lifetime');
 assert.deepEqual(audit.bands,['Relative low','Relative low','Softer than usual','Softer than usual','Typical range','Typical range','Stronger than usual','Stronger than usual','Relative crest','Relative crest']);
 await page.locator('#directionHeat .direction-cell').first().waitFor();const cell=page.locator('#directionHeat .direction-cell').first();await cell.scrollIntoViewIfNeeded();await page.waitForTimeout(250);await cell.tap();
 assert((await page.locator('.heat-magnifier').innerText()).includes('percentile'));assert((await page.locator('.heat-magnifier').innerText()).includes('Raw support'));await page.locator('.heat-preview-evidence > summary').click();const details=await page.locator('.heat-magnifier').innerText();assert(details.includes('Raw support')&&details.includes('Activation')&&details.includes('Scale / reach'));await page.locator('.heat-magnifier').screenshot({path:'/tmp/kala-lifetime-preview.png'});await page.keyboard.press('Escape');
 await page.locator('#directionHeat button[data-view="details"]').click();await page.locator('#directionHeat .explorer-item > summary').first().click();assert((await page.locator('#directionHeat').innerText()).includes('fixed distribution'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>{selectedSystemIds.delete('Vedic');renderDirectionExplorer()});await page.locator('#directionHeat .explorer-item').first().waitFor();await page.locator('#directionHeat .explorer-item > summary').first().click();assert((await page.locator('#directionHeat').innerText()).includes('percentile'));
 assert.deepEqual(errors,[]);if(process.env.KALA_AUDIT_OUT)fs.writeFileSync(process.env.KALA_AUDIT_OUT,JSON.stringify(audit,null,2));console.log(JSON.stringify(audit,null,2));console.log('PASS: duration-weighted lifetime percentiles, ties, boundaries, all-domain reference, zoom invariance, configuration invalidation, unchanged scores, mobile details and no-Vedic support.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
