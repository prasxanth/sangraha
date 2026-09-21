const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());await page.addInitScript(()=>{const t=setTimeout;window.setTimeout=(f,d,...a)=>String(f).includes('loadSwiss().then')?0:t(f,d,...a)});
 await page.goto('file://'+process.cwd()+'/astrology_engine.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#validationTable').dataset.autorun==='done');
 const result=await page.evaluate(()=>{
  let checks=0;const close=(a,b)=>{checks++;if(a===null||b===null){if(a!==b)throw Error('Missing coverage mismatch');return}if(Math.abs(a-b)>1e-10)throw Error(`Routing mismatch ${a} vs ${b}`)};
  const support=[[.45,.20,.35],[.45,.15,.40],[.40,.40,.20],[.40,.35,.25],[.55,.25,.20],[.35,.25,.40],[.25,.55,.20],[.60,.25,.15],[.20,.45,.35],[.35,.35,.30],[.30,.40,.30],[.40,.35,.25]],activation=[[.50,.30,.20],[.45,.25,.30],[.40,.40,.20],[.40,.40,.20],[.50,.30,.20],[.35,.35,.30],[.25,.60,.15],[.55,.30,.15],[.25,.45,.30],[.35,.40,.25],[.30,.45,.25],[.40,.40,.20]];
  for(let i=0;i<12;i++)for(let j=0;j<3;j++){close(CANONICAL_WEIGHTS[DOMAINS[i]][['Vedic','Western','Saju'][j]],support[i][j]);close(CANONICAL_ACTIVATION_WEIGHTS[DOMAINS[i]][['Vedic','Western','Saju'][j]],activation[i][j])}
  const original={durationSystemMetrics,scoreSystemAt,activationSystemAt,scoreVedicPeriod,activationVedicPeriod,render,selection:selectedSystemIds,weights:structuredClone(WEIGHTS),activation:structuredClone(ACTIVATION_WEIGHTS)};
  const leaf=findPeriodByPath(['Mercury','Venus','Mars','Jupiter','Saturn']),foreign={a:leaf.a,b:leaf.b,cycleFamily:'comparison',path:[]};
  let values;try{
   render=()=>{};
   durationSystemMetrics=(p,id)=>({support:Array(12).fill(values.support[id]),activation:Array(12).fill(values.activation[id]),leafCount:1});scoreSystemAt=(id)=>Array(12).fill(values.support[id]);activationSystemAt=(id)=>Array(12).fill(values.activation[id]);scoreVedicPeriod=()=>values.support.Vedic;activationVedicPeriod=()=>values.activation.Vedic;
   for(const d of DOMAINS){WEIGHTS[d]={Vedic:.7,Western:.2,Saju:.1,BNN:0};ACTIVATION_WEIGHTS[d]={Vedic:.1,Western:.2,Saju:.7,BNN:0}}
   for(const mode of ['specialist','equal','custom'])for(let mask=1;mask<16;mask++)for(const missing of ['none','WesternActivation','BNN','Vedic']){
    SYSTEM_ROUTING_MODE=mode;selectedSystemIds=new Set(['Vedic','Western','Saju','BNN'].filter((_,i)=>mask&(1<<i)));scoreCache.clear();
    values={support:{Vedic:1,Western:-.5,Saju:.4,BNN:-.8},activation:{Vedic:.4,Western:1.2,Saju:1.6,BNN:.8}};
    if(missing==='WesternActivation')values.activation.Western=null;else if(missing!=='none'){values.support[missing]=null;values.activation[missing]=null}
    const combo=durationCombinedMetrics(leaf),instant=combinedAt(midpoint(leaf.a,leaf.b));
    for(let di=0;di<12;di++)for(const metric of ['support','activation']){
     let num=0,den=0;const v=values[metric],base=mode==='custom'?(metric==='support'?[.7,.2,.1]:[.1,.2,.7]):(metric==='support'?support[di]:activation[di]);
     for(const id of ['Vedic','Western','Saju','BNN']){
      if(!selectedSystemIds.has(id)||id==='BNN'&&selectedSystemIds.has('Vedic'))continue;
      let value=v[id];if(id==='Vedic'&&selectedSystemIds.has('BNN'))value=value===null?v.BNN:v.BNN===null?value:.85*value+.15*v.BNN;
      if(value===null)continue;const w=mode==='equal'?1:base[id==='BNN'?0:['Vedic','Western','Saju'].indexOf(id)];num+=value*w;den+=w;
     }
     const expected=den?num/den:metric==='support'?0:null;close(combo[metric][di],expected);close(metric==='support'?scorePeriod(foreign,di):activationPeriod(foreign,di),expected);if(metric==='support')close(instant.combined[di],expected);
    }
    if(selectedSystemIds.has('Vedic')&&selectedSystemIds.has('BNN')){if('BNN' in instant.weightsByDomain[0])throw Error('Fourth vote');if(agreement(leaf,0).totalSystems>selectedSystemIds.size-1)throw Error('Duplicate agreement')}
   }
   selectedSystemIds=new Set(['Vedic','Western','Saju']);values.support.Vedic=1;WEIGHTS.Career={Vedic:1,Western:0,Saju:0,BNN:0};scoreCache.clear();
   if(Object.keys(combinedAt(leaf.a).weightsByDomain[0]).length!==1||agreement(leaf,0).totalSystems!==1)throw Error('Zero-weight channel counted as consensus');
   const saved=JSON.stringify(WEIGHTS);let rejected=false;try{AstroHeatmap.setSystemRoutingWeights('support',{Career:{Vedic:.9,Western:-1}})}catch(e){rejected=true}if(!rejected||saved!==JSON.stringify(WEIGHTS))throw Error('Non-atomic validation');
  }finally{durationSystemMetrics=original.durationSystemMetrics;scoreSystemAt=original.scoreSystemAt;activationSystemAt=original.activationSystemAt;scoreVedicPeriod=original.scoreVedicPeriod;activationVedicPeriod=original.activationVedicPeriod;render=original.render;selectedSystemIds=original.selection;WEIGHTS=original.weights;ACTIVATION_WEIGHTS=original.activation;SYSTEM_ROUTING_MODE='specialist';scoreCache.clear()}
  prefix=['Mercury','Venus','Mars'];switchTab('playbook');render();
  if(!parentDominantDashaWeightInvariant().ok||DIRECTION_CONTEXT_POLICY.enabled)throw Error('Prior policies changed');
  return{checks};
 });
 assert.equal(await page.locator('#systemRoutingMode').inputValue(),'specialist');assert((await page.locator('#weightsTable').textContent()).includes('45% / 50%'));
 await page.selectOption('#systemRoutingMode','equal');assert((await page.locator('#weightsTable').textContent()).includes('33% / 33%'));
 await page.evaluate(()=>AstroHeatmap.setSystemRoutingWeights('support',{Career:{Vedic:.8,Western:.1,Saju:.1}}));assert((await page.locator('#weightsTable').textContent()).includes('80% / 50%'));
 await page.selectOption('#systemRoutingMode','specialist');assert((await page.locator('#weightsTable').textContent()).includes('45% / 50%'));
 await page.selectOption('#systemRoutingMode','custom');assert((await page.locator('#weightsTable').textContent()).includes('80% / 50%'));
 await page.selectOption('#systemRoutingMode','specialist');
 await page.evaluate(()=>{selectedSystemIds.add('BNN');render()});assert.equal(await page.locator('#weightsTable tr').first().locator('th').count(),4);
 await page.locator('#systemRoutingMode').scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('#weightsTable').getBoundingClientRect().width<=document.querySelector('#weightsTable').parentElement.clientWidth));await page.screenshot({path:'/tmp/kala-routing-mobile.png'});
 assert.deepEqual(errors,[]);console.log(result);console.log('PASS: all domain/metric matrices; 15 system combinations, three modes, missing coverage, period/instant routing, BNN internal/substitute, atomic API edits, mode restoration and mobile UI.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
