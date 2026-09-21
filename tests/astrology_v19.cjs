// Offline arithmetic regression: this verifies model consistency, not predictive validity.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',r=>r.abort());
  await page.addInitScript(()=>{const t=setTimeout;window.setTimeout=(f,d,...a)=>String(f).includes('loadSwiss().then')?0:t(f,d,...a)});
  const start=Date.now();await page.goto('file://'+process.cwd()+'/astrology_engine.html');
  await page.waitForFunction(()=>document.querySelector('#validationTable').dataset.autorun==='done');
  const readySeconds=(Date.now()-start)/1000;
  const result=await page.evaluate(()=>{
   let maxError=0,checks=0;const close=(a,b)=>{if(!Number.isFinite(a)||!Number.isFinite(b))throw Error('Nonfinite comparison');maxError=Math.max(maxError,Math.abs(a-b));checks++;if(Math.abs(a-b)>1e-10)throw Error(`Mismatch ${a} vs ${b}`)};
   // Isolate level influence from chart condition: the same unit signal at each
   // level must have the declared weight, in support AND activation.
   const expected=[.50,.30,.12,.06,.02],originalLord=bphsLordDomainAssessment,originalPair=bphsPairAssessment,originalAssociation=planetAssociation;
   if(!parentDominantDashaWeightInvariant().ok||DIRECTION_CONTEXT_POLICY.enabled)throw Error('Hierarchy/context policy');
   const policy=AstroHeatmap.getVimshottariLevelWeights();policy.weights[0]=0;if(VEDIC_LEVEL_WEIGHTS[0]!==.5)throw Error('Mutable public policy');
   try{
    bphsLordDomainAssessment=(lord)=>({support:lord==='Sun'?1:0,activation:lord==='Sun'?1:0});
    bphsPairAssessment=()=>({pairSignal:0});planetAssociation=()=>({present:false});
    for(let level=0;level<5;level++)for(let di=0;di<12;di++){const path=Array(5).fill('Mercury');path[level]='Sun';close(bphsPathSupport(path,di),expected[level]);close(bphsPathActivation(path,di),expected[level])}
    for(let depth=1;depth<=5;depth++){const path=Array(depth).fill('Sun');close(bphsPathSupport(path,0),1);close(bphsPathActivation(path,0),1)}
   }finally{bphsLordDomainAssessment=originalLord;bphsPairAssessment=originalPair;planetAssociation=originalAssociation}
   const md=dashaRoot.find(p=>p.lord==='Mercury'&&p.a>chart.birthMs),duration=p=>p.b-p.a;
   const transit=calcVedicTransitSet(midpoint(md.a,md.b)).Sun;
   for(let level=0;level<5;level++){const path=Array(5).fill('Mercury');path[level]='Sun';const row=vedicBodyGocharaContribution('Sun',transit,0,path);close(row.dashaMult,[1.30,1.18,1.072,1.036,1.012][level])}
   const leaves=p=>{const c=durationSummaryChildren(p);return c.length?c.flatMap(leaves):[p]},all=leaves(md);
   const ids=selectedSystems().map(s=>s.id);
   const walk=p=>{const children=durationSummaryChildren(p);if(!children.length)return;
    close(children.reduce((s,c)=>s+duration(c),0)/duration(p),1);
    children.forEach(c=>close(duration(c)/duration(p),DASHA[c.lord]/120));
    for(const get of [durationCombinedMetrics,...ids.map(id=>p=>durationSystemMetrics(p,id))]){
     const parent=get(p),rows=children.map(get);
     for(const metric of ['support','activation'])for(let di=0;di<12;di++){
      const known=children.map((c,i)=>({d:rows[i].coverage?.[metric]?.[di]??duration(c),v:rows[i][metric][di]})).filter(x=>Number.isFinite(x.v));
      const den=known.reduce((s,x)=>s+x.d,0);if(den)close(parent[metric][di],known.reduce((s,x)=>s+x.d*x.v,0)/den);else if(parent[metric][di]!==null)throw Error('Missing coverage lost');
     }
    }children.forEach(walk);
   };walk(md);
   for(let di=0;di<12;di++)close(scorePeriod(md,di),all.reduce((s,p)=>s+duration(p)*scorePeriod(p,di),0)/duration(md));
   // Independently reconstruct representative leaf formulas from their inputs.
   for(const p of all.filter((_,i)=>i%701===0))for(let di=0;di<12;di++){
    const ms=midpoint(p.a,p.b),g=vedicGocharaScore(ms,di,p.path);
    close(scoreVedicPeriod(p,di),clamp(.76*vedicStructuralPathSupport(p.path,di)+.24*g.score,-2,2));
    close(activationVedicPeriod(p,di),clamp(.45*vedicStructuralPathActivation(p.path,di)+.55*vedicGocharaActivation(ms,di,p.path),0,2));
   }
   const originalSelection=selectedSystemIds;selectedSystemIds=new Set(['Vedic']);
   for(let di=0;di<12;di++)close(scorePeriod(md,di),scoreVedicPeriod(md,di));selectedSystemIds=originalSelection;
   const clipped={...md,a:md.a+duration(md)*.137,b:md.a+duration(md)*.739},parts=leaves(clipped);
   close(parts.reduce((s,p)=>s+duration(p),0)/duration(clipped),1);
   for(let di=0;di<12;di++)close(scorePeriod(clipped,di),parts.reduce((s,p)=>s+duration(p)*scorePeriod(p,di),0)/duration(clipped));
   for(const p of [parts[0],parts.at(-1)]){
    const canonical=findPeriodByPath(p.path);close(pranaMidpoint(p),midpoint(canonical.a,canonical.b));
    for(let di=0;di<12;di++)close(scorePeriod(p,di),scorePeriod(canonical,di));
   }
   const pd=childPeriods(childPeriods(md)[2])[4];
   for(let di=0;di<12;di++){
    const before=scorePeriod(pd,di),rows=domainExpressionAssessment(pd,di),children=durationSummaryChildren(pd),sub=children.map(c=>domainExpressionAssessment(c,di));
    rows.forEach((r,i)=>{close(r.score,children.reduce((s,c,j)=>s+duration(c)*sub[j][i].score,0)/duration(pd));close(r.score,Object.values(r.contributions).reduce((a,b)=>a+b,0));if(r.score<0||r.score>2)throw Error('Expression bounds')});close(before,scorePeriod(pd,di));
   }
   // Two nearby instants must not depend on which one filled a rounded cache bucket first.
   const t=midpoint(md.a,md.b),times=[t,t+1234567];
   const at=ms=>[scoreWesternAt(ms),activationWesternAt(ms),scoreSajuAt(ms),activationSajuAt(ms),vedicGocharaScore(ms,0,['Mercury','Venus']).score];
   const forward=times.map(at);scoreCache.clear();const reverse=times.slice().reverse().map(at).reverse();
   if(JSON.stringify(forward)!==JSON.stringify(reverse))throw Error('Instant cache depends on query order');
   const synthetic=weightedMetricArrays({a:0,b:10},[{a:0,b:5},{a:5,b:10}],[{support:Array(12).fill(1),activation:Array(12).fill(null),coverage:{support:Array(12).fill(2),activation:Array(12).fill(0)}},{support:Array(12).fill(2),activation:Array(12).fill(1),coverage:{support:Array(12).fill(5),activation:Array(12).fill(5)}}]);close(synthetic.support[0],12/7);close(synthetic.activation[0],1);
   return{checks,maxError,leafCount:all.length,clippedLeaves:parts.length,domains:DOMAINS.map((domain,di)=>({domain,support:scorePeriod(md,di),vedic:scoreVedicPeriod(md,di)})),careerADs:childPeriods(md).map(p=>({lord:p.lord,weight:duration(p)/duration(md),support:scorePeriod(p,0)})),validation:document.querySelector('#validationTable').innerText};
  });
  assert.equal(result.leafCount,6561);assert(result.checks>50000);assert(result.maxError<1e-10);assert.deepEqual(errors,[]);
  assert(await page.evaluate(()=>!hierarchyPending&&document.documentElement.scrollWidth<=innerWidth));
  if(process.env.KALA_AUDIT_OUT)fs.writeFileSync(process.env.KALA_AUDIT_OUT,JSON.stringify({readySeconds,...result},null,2));
  console.log(JSON.stringify({readySeconds,checks:result.checks,maxError:result.maxError,leaves:result.leafCount,career:result.domains[0],careerADs:result.careerADs},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
