const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',r=>r.abort());await page.addInitScript(()=>{const t=setTimeout;window.setTimeout=(f,d,...a)=>String(f).includes('loadSwiss().then')?0:t(f,d,...a)});
 await page.goto('file://'+process.cwd()+'/astrology_engine.html');await page.waitForFunction(()=>document.querySelector('#validationTable').dataset.autorun==='done');
 await page.evaluate(()=>{prefix=['Mercury','Venus','Mars'];switchTab('cycles');render()});
 assert.equal(await page.locator('#cycleMetric-support').getAttribute('aria-selected'),'true');
 assert(await page.locator('#supportComparison').isVisible());
 await page.locator('#cycleMetric-direction').click();
 await page.locator('#directionMixGrid .direction-mix-row').first().waitFor();
 assert.equal(await page.locator('#directionMixGrid .direction-mix-row').count(),12);
 const audit=await page.evaluate(()=>{
  const p=currentDisplayPeriod(),before=DOMAINS.map((_,i)=>[scorePeriod(p,i),activationPeriod(p,i),scalePeriod(p,i)]),children=durationSummaryChildren(p);
  for(let i=0;i<DOMAINS.length;i++){const mix=directionDurationMix(p,i);if(Math.abs(mix.rows.reduce((n,x)=>n+x.pct,0)-100)>1e-9)throw Error('Not 100%');if(mix.total!==p.b-p.a)throw Error('Incomplete time coverage');for(const row of mix.rows){const expected=children.filter(c=>directionAssessment(c,i).action===row.action);if(expected.length!==row.count||expected.reduce((n,c)=>n+c.b-c.a,0)!==row.duration)throw Error('Incorrect bucket duration')}}
  if(JSON.stringify(before)!==JSON.stringify(DOMAINS.map((_,i)=>[scorePeriod(p,i),activationPeriod(p,i),scalePeriod(p,i)])))throw Error('Scores changed');
  for(let n=3;n<=5;n++){const period=findPeriodByPath(['Mercury','Venus','Mars','Jupiter','Saturn'].slice(0,n)),mix=directionDurationMix(period,0);if(n===5?mix.children.length!==0:mix.children.length!==9)throw Error('Incorrect drill level')}
  const old=directionAssessment;directionAssessment=()=>({action:'Not supplied'});try{const m=directionDurationMix(p,0);if(m.rows.length!==1||m.rows[0].pct!==100)throw Error('Missing values lost')}finally{directionAssessment=old}
  return{children:children.length,unchanged:true};
 });
 const bar=page.locator('.direction-mix-bar').first();await bar.scrollIntoViewIfNeeded();await page.locator('.direction-mix-meta button').first().click();assert((await page.locator('#directionMixDetail').innerText()).includes('raw support'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/kala-direction-mix-mobile.png'});
 assert(await page.evaluate(()=>[...document.querySelectorAll('.direction-mix-seg')].every(n=>Math.abs(n.getBoundingClientRect().width/n.parentElement.clientWidth*100-parseFloat(n.style.width))<.1)), 'Segment widths match duration shares');
 for(const key of ['support','activation','scale','direction']){await page.locator('#cycleMetric-'+key).click();assert(await page.locator('#'+key+'Comparison').isVisible());assert.equal(await page.locator('#cyclesTab [role="tabpanel"]:visible').count(),1)}
 await page.locator('#cycleMetric-direction').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#cycleMetric-support').getAttribute('aria-selected'),'true');
 await page.evaluate(()=>render());assert.equal(await page.locator('#cycleMetric-support').getAttribute('aria-selected'),'true');
 await page.locator('#cycleMetric-direction').click();await page.locator('#directionMixGrid .direction-mix-row').first().waitFor();
 await page.setViewportSize({width:1400,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log(audit);console.log('PASS: duration shares, all domains, terminal and unavailable states, unchanged metrics, mobile chart, four persistent subtabs and keyboard navigation.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
