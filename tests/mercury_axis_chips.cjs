const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
(async()=>{for(const name of ['chromium','webkit']){const b=await(name==='chromium'?chromium:webkit).launch(name==='chromium'?{executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});try{const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+process.cwd()+'/mercury_atlas.html');
 const test=await p.evaluate(()=>{
  const host=document.createElement('div');document.body.append(host);const palette=[];
  for(const value of [10,45,70,90]){host.innerHTML=window.AtlasNativeAxes.render({activation:value,score:value-50,heat:3,intensityScore:value,agencyScore:value,volatilityScore:value,mark:'0',post:'Mixed'});palette.push([...host.querySelectorAll('.axis-meter i')].map(e=>getComputedStyle(e).backgroundColor));}
  host.innerHTML=window.AtlasNativeAxes.render({activation:40,score:-60,heat:4,intensityScore:65,agencyScore:75,volatilityScore:80,mark:'−',post:'Caution'});
  const support=host.querySelector('.support .axis-meter'),fill=support.firstElementChild,negative={min:support.getAttribute('aria-valuemin'),value:support.getAttribute('aria-valuenow'),left:fill.style.left,width:fill.style.width};
  host.innerHTML=window.AtlasNativeAxes.chips({score:0,heat:3,post:'Mixed',intensityScore:40});const absent=[...host.querySelectorAll('.chip-axis[data-value=""]')].map(e=>e.dataset.axis);host.remove();return {palette,negative,absent};
 });
 for(const index of [0,2,3,4])assert(new Set(test.palette.map(row=>row[index])).size>=3,'Axis colors distinguish levels');
 assert.deepEqual(test.negative,{min:'-100',value:'-60',left:'20%',width:'30%'});assert.deepEqual(test.absent,['activation','agency','volatility']);
 await p.locator('[data-page="bazi"]').click();
 for(const selector of ['#currentPeriod .now-dimensions button','#westernCurrent .now-dimensions button','#westernYears button','#westernMonths button','#baziYears button','#baziMonths button','#baziDays button']){
  const counts=await p.locator(selector).evaluateAll(es=>es.map(e=>e.querySelectorAll('.chip-axis').length));assert(counts.length,selector);assert(counts.every(n=>n===5),selector);
 }
 const jy=await p.evaluate(()=>{const r=currentSD();return [...document.querySelectorAll('#currentPeriod .now-dimensions button')].every(b=>{const expected=window.AtlasNativeAxes.jy(r,b.dataset.currentDimension,'sd');return [...b.querySelectorAll('.chip-axis')].map(e=>+e.dataset.value).every((v,i)=>v===[expected.activation,expected.score,expected.intensityScore,expected.agencyScore,expected.volatilityScore][i])})});assert(jy,'Chip values match the native model, not visual rescaling');
 await p.locator('[data-page="western"]').click();await p.locator('#western-tab-now').click();await p.screenshot({path:'/tmp/atlas-five-axis-'+name+'.png'});assert.deepEqual(errors,[]);console.log('PASS '+name+': five indicators on native chips, native-value parity, level colors, signed support and explicit unavailable axes.');
 }finally{await b.close()}}})().catch(e=>{console.error(e);process.exitCode=1});
