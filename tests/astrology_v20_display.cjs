const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',r=>r.abort());await page.addInitScript(()=>{const t=setTimeout;window.setTimeout=(f,d,...a)=>String(f).includes('loadSwiss().then')?0:t(f,d,...a)});
 await page.goto('file://'+process.cwd()+'/astrology_engine.html');await page.waitForFunction(()=>document.querySelector('#validationTable').dataset.autorun==='done');
 const result=await page.evaluate(()=>{
  const favorable=new Set(['BUILD','ADVANCE','EXPAND']);let checked=0;
  for(const s of [-1.5,-.75,-.35,0,.2,.349])for(const a of [0,.75,1.15,1.5,2])for(const x of [0,.75,1.15,1.5,2])for(const p of [0,20,50,70,90,100]){if(favorable.has(directionFromScores(s,a,x,p).action))throw Error('Relative rank overrode absolute gate');checked++}
  if(directionFromScores(.45,1.12,.94,92).action!=='ADVANCE'||directionFromScores(.36,.97,.82,72).action!=='ADVANCE')throw Error('Missing v20.1 refinement');
  const md=dashaRoot.find(p=>p.lord==='Mercury'&&p.a>chart.birthMs);if(Math.abs(scorePeriod(md,0)-.2590781152813205)>1e-12)throw Error('Raw Mercury score changed');
  const ad=childPeriods(md).find(p=>p.lord==='Rahu');if(Math.abs(lifetimePercentile(scorePeriod(ad,0),0)-16.65471620488453)>1e-9)throw Error('Lifetime reference changed');
  prefix=['Mercury','Venus','Mars'];switchTab('cycles');render();selectCycleMetric('direction');
  const period=findPeriodByPath(prefix);if(AstroHeatmap.getDirectionContext(period,'Career').scored!==false)throw Error('Context must remain unscored');
  const before=DOMAINS.map((_,di)=>[scorePeriod(period,di),activationPeriod(period,di),scalePeriod(period,di)]),direction=DOMAINS.map((_,di)=>directionAssessment(period,di));
  if(JSON.stringify(before)!==JSON.stringify(DOMAINS.map((_,di)=>[scorePeriod(period,di),activationPeriod(period,di),scalePeriod(period,di)])))throw Error('Direction altered raw scores');
  return{checked,labels:[5,20,50,75,95].map(p=>lifetimeBand(p).label),policy:DIRECTION_CONTEXT_POLICY.enabled,actions:direction.map(d=>d.action)};
 });
 assert.equal(result.policy,false);assert.deepEqual(result.labels,['Relative low','Softer than usual','Typical range','Stronger than usual','Relative crest']);
 await page.locator('#directionHeat .direction-cell').first().waitFor();assert.equal(await page.locator('#directionHeat .dir-action').count(),108);assert.equal(await page.locator('#directionHeat .dir-relative').count(),108);
 assert(await page.evaluate(()=>[...document.querySelectorAll('#directionHeat .dir-action,#directionHeat .dir-relative')].every(n=>{const r=document.createRange();r.selectNodeContents(n);const a=r.getBoundingClientRect(),b=n.closest('.direction-cell').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom})), 'Action and relative labels fit mobile cells');
 await page.locator('#directionHeat .touch-heat-grid').screenshot({path:'/tmp/kala-v20-mobile-map.png'});
 const cell=page.locator('#directionHeat .direction-cell').first();await cell.scrollIntoViewIfNeeded();await page.waitForTimeout(250);await cell.tap();assert((await page.locator('.heat-magnifier').innerText()).includes('Raw support'));await page.keyboard.press('Escape');
 await page.locator('#directionHeat button[data-view="details"]').click();await page.locator('#directionHeat .explorer-item > summary').first().click();assert((await page.locator('#directionHeat').innerText()).includes('Scale'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/kala-v20-mobile.png'});
 await page.evaluate(()=>{selectedSystemIds.delete('Vedic');renderDirectionExplorer()});await page.locator('#directionHeat .explorer-item').first().waitFor();assert((await page.locator('#directionHeat').innerText()).includes('Not supplied'));
 assert.deepEqual(errors,[]);console.log(JSON.stringify(result));console.log('PASS: support gate, percentile refinement, unchanged raw scores/reference, mobile action/context labels, preview/details and missing-scale handling.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
