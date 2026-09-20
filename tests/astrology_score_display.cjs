const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];
  page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',r=>r.abort());
  await page.addInitScript(()=>{const timeout=setTimeout;window.setTimeout=(f,d,...a)=>String(f).includes('loadSwiss().then')?0:timeout(f,d,...a)});
  await page.goto('file://'+process.cwd()+'/astrology_engine.html');
  await page.waitForFunction(()=>document.querySelector('#validationTable').dataset.autorun==='done');
  const audit=await page.evaluate(()=>{
   const single=t=>/^[+-]?\d+\.\d{2}$/.test(t.trim());
   const check=selector=>{const nodes=[...document.querySelectorAll(selector)];if(!nodes.length)throw Error('Missing score nodes '+selector);return nodes.every(n=>single(n.textContent))};
   const results=[];
   switchTab('cycles');
   const path=['Mercury','Venus','Mars','Jupiter'];
   for(let depth=0;depth<=4;depth++){prefix=path.slice(0,depth);render();results.push(check('.laneContinue'));if(depth===4)results.push(check('#pranaNavigator .ps'))}
   prefix=[];render();results.push(check('.dbar-score'),check('.phase .grade'));
   const before=scoreSelected(currentDisplayPeriod()),relative=[...document.querySelectorAll('.dbar-seg')].map(n=>n.style.background);
   const legend=$('supportMapLegend').textContent;
   $('contrastMode').value='absolute';render();const after=scoreSelected(currentDisplayPeriod());
   const absolute=[...document.querySelectorAll('.dbar-seg')].map(n=>n.style.background);
   const absoluteLegend=$('supportMapLegend').textContent;
   $('contrastMode').value='relative';render();
   switchTab('heatmap');results.push(check('.pchip-score'));
   renderHeat(visibleGroups());results.push(check('#heat .score'));
   const noCategory=!document.querySelector('.pchip-grade,#heat .grade,#heat .agree,.dbar-grade');
   switchTab('playbook');results.push([...$('playbookTable').querySelectorAll('tr')].slice(1).every(r=>single(r.cells[1].textContent)));
   return{results,noCategory,before,after,legend,absoluteLegend,colors:new Set(relative).size,colorChange:JSON.stringify(relative)!==JSON.stringify(absolute),negativeZero:signed(-.0001)};
  });
  assert(audit.results.every(Boolean));assert(audit.noCategory);assert.equal(audit.before,audit.after);
  assert(audit.colors>5&&audit.colorChange);assert(audit.legend.includes('Relative colors')&&audit.absoluteLegend.includes('fixed color scale'));
  assert.equal(audit.negativeZero,'+0.00');
  await page.evaluate(()=>{switchTab('cycles');prefix=[];render()});
  await page.locator('#hierarchyLanes').screenshot({path:'/tmp/kala-score-navigation.png'});
  await page.locator('#domainBarsContainer').screenshot({path:'/tmp/kala-score-grid.png'});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{prefix=['Mercury'];render()});
  const mobile=await page.locator('.mobile-cycle-card').allTextContents();
  assert(mobile.length>0);assert(mobile.every(t=>!/(?:^|\s)0\s+[+-]?\d+\.\d/.test(t)));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('PASS: MD/AD/PD/SD navigation, Prana, timeline, chips, both grids, playbook, mobile layout; one support number; relative/fixed color modes leave scores unchanged.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
