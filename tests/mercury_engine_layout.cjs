const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
(async()=>{
 for(const name of ['chromium','webkit']){
  const browser=await (name==='chromium'?chromium:webkit).launch(name==='chromium'?{executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{
   const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.install({time:new Date('2026-10-28T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-28T12:00:00Z'));await p.goto('file://'+process.cwd()+'/mercury_atlas.html');
   await p.locator('[data-page="western"]').click();
   assert.equal(await p.locator('#westernYear').count(),0);
   assert.equal(await p.locator('[data-wyear="2026"]').getAttribute('aria-pressed'),'true');
   assert.equal(await p.locator('#westernMonth').inputValue(),'10');
   assert.equal(await p.locator('#westernSelection').evaluate(e=>e.open),true);
   async function audit(label){
    const issues=await p.evaluate(()=>{
     const root=document.querySelector('dialog[open]')||document.querySelector('.app-page:not([hidden])'),out=[];
     for(const e of root.querySelectorAll('*')){
      if(!e.checkVisibility()||!e.clientWidth||e.matches('select,input,textarea')||e.closest('.viewport,.life-map-scroll')||['hidden','auto','scroll'].includes(getComputedStyle(e).overflowX))continue;
      if(e.scrollWidth>e.clientWidth+2)out.push([e.className||e.tagName,e.scrollWidth,e.clientWidth]);
     }
     for(const e of root.querySelectorAll('.engine-panel .axis-card')){if(!e.checkVisibility())continue;const a=e.querySelector('small').getBoundingClientRect(),b=e.querySelector('b').getBoundingClientRect();if(a.right>b.left+1)out.push(['metric label overlaps value']);}
     const controls=[...root.querySelectorAll('button,input,select,textarea')].filter(e=>e.checkVisibility());
     for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j];if(a.contains(b)||b.contains(a))continue;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>2&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>2)out.push(['controls overlap',a.id,b.id]);}
     return out;
    });assert.deepEqual(issues,[],name+' '+label);
   }
   for(const width of [320,390,768,1024,1440]){
    await p.setViewportSize({width,height:900});
    for(const view of ['timeline','bazi','western','practice','compare','guide']){
     await p.locator('[data-page="'+view+'"]').click();await audit(width+' '+view);
     if(view==='western'){
      for(const key of ['now','years','months','chart']){await p.locator('#western-tab-'+key).click();await audit(width+' Western '+key);assert.equal(await p.locator('#westernPage [role=tabpanel]:visible').count(),1);}
      await p.locator('#western-tab-years').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#western-tab-months').getAttribute('aria-selected'),'true');
      await p.locator('#western-tab-now').click();await p.locator('#westernToday').click();assert.equal(await p.locator('#westernMonth').inputValue(),'10');assert.equal(await p.locator('#western-tab-months').getAttribute('aria-selected'),'true');
      await p.locator('#western-tab-now').click();
      assert.equal(await p.locator('.western-card').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(16, 27, 21)');
      await p.locator('[data-western-dimension="reinvention"]').click();await audit(width+' Western long labels');
      assert.deepEqual(await p.locator('.western-rating').evaluateAll(es=>[...new Set(es.map(e=>getComputedStyle(e).backgroundColor))]),['rgba(0, 0, 0, 0)']);
      assert.equal(await p.evaluate(()=>[...document.querySelectorAll('.western-period,#westernCurrent .now-dimensions button')].every(chip=>{const heat=chip.className.match(/\bh([1-5])\b/)[1],reference=document.createElement('b');reference.className='h'+heat;document.body.append(reference);const a=getComputedStyle(chip),b=getComputedStyle(reference),same=a.backgroundColor===b.backgroundColor&&a.color===b.color;reference.remove();return same})),true,'Western chips share Jyotish fills and text contrast');
      assert.equal(await p.locator('#westernCurrent .now-dimensions button').count(),10);
      await p.locator('[data-western-dimension="wealth"]').click();assert.equal(await p.locator('#westernDimension').inputValue(),'wealth');
      const current=await p.locator('#westernCurrent').textContent();
      await p.locator('#western-tab-years').click();await p.locator('[data-wyear="2026"]').click();await p.locator('#westernMonth').selectOption('3');
      assert.match(await p.locator('#westernDetail').innerText(),/2026-03/);
      assert.equal(await p.locator('[data-wmonth="3"]').getAttribute('aria-pressed'),'true');
      assert.equal(await p.locator('#westernCurrent').textContent(),current);
      await p.locator('[data-wmonth="6"]').click();assert.equal(await p.locator('#westernMonth').inputValue(),'6');
      await p.locator('#westernSelection').evaluate(e=>e.open=false);
      await p.locator('#western-tab-years').click();await p.locator('[data-wyear="2030"]').click();assert.equal(await p.locator('#westernMonth').inputValue(),'10');
      assert.equal(await p.locator('#westernSelection').evaluate(e=>e.open),true);
      assert.match(await p.locator('#westernDetail').innerText(),/2030-10/);
      assert.equal(await p.locator('#westernMonthHeading').evaluate(e=>document.activeElement===e),true);
      await p.locator('#western-tab-years').click();await p.locator('[data-wyear="2026"]').click();await p.locator('[data-wmonth="6"]').click();
      assert.match(await p.locator('#westernDetail').innerText(),/2026-06/);await audit(width+' selected month');
     }
     if(view==='practice'){
      await p.locator('#guidance-tab-plan').click();await audit(width+' Plan');
      for(const card of await p.locator('.horizon-launch').all()){await card.click();await audit(width+' horizon popup');await p.locator('#insightClose').click()}
      await p.locator('#guidance-tab-forecast').click();await p.locator('#forecastPrefill').click();
      if(!await p.locator('.forecast-entry').count())await p.locator('#forecastFreeze').click();
      await p.locator('#forecastPanel details').evaluateAll(es=>es.forEach(e=>e.open=true));await audit(width+' Forecasts including provenance and resolution controls');
      await p.locator('#guidance-tab-journal').click();await audit(width+' Journal');await p.locator('#guidance-tab-plan').click();
     }
     if(view==='compare'){await p.locator('[data-cmonth="9"]').click();await audit(width+' Compare details');await p.locator('#compareNativeDetail details').evaluateAll(es=>es.forEach(e=>e.open=true));await audit(width+' expanded Compare');await p.locator('#compareBack').click();}
    }
   }
   await p.setViewportSize({width:390,height:844});await p.locator('[data-page="western"]').click();await p.locator('#western-tab-now').click();await p.screenshot({path:'/tmp/atlas-'+name+'-western-theme.png'});
   await p.setViewportSize({width:1440,height:1000});await p.locator('[data-page="practice"]').click();await p.locator('#guidanceOverview .engine-triad').screenshot({path:'/tmp/atlas-'+name+'-metrics-theme.png'});
   assert.deepEqual(errors,[]);console.log('PASS '+name+': six views, all horizon popups, Western theme, metric text bounds, control overlap, forecast entries and comparison details at 320–1440px.');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
