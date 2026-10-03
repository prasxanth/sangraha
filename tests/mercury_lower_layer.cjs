const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {chromium}=require('playwright');const {pathToFileURL}=require('node:url');const path=require('node:path');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function evaluateModel(html){
 const context={NATIVE:JSON.parse(html.match(/id="baziNativeData">(.*?)<\/script>/s)[1]),SD_DATA:JSON.parse(html.match(/id="sookshmaData">(.*?)<\/script>/s)[1])};
 vm.createContext(context);vm.runInContext(html.slice(html.indexOf('const nativeDayIndex=new Map();'),html.indexOf('function renderLowerLayer(')),context);
 return {context,results:JSON.parse(vm.runInContext(`JSON.stringify({windows:SD_DATA.map(r=>({start:r.startExact,days:daysBetweenExact(r.startExact,r.endExact)})),months:Array.from({length:18},(_,i)=>Array.from({length:12},(_,m)=>sookshmasOverlappingMonth(2021+i,m).map(r=>r.startExact)))})`,context))};
}
(async()=>{
 const html=fs.readFileSync('mercury_atlas.html','utf8'),actual=evaluateModel(html),fixture='tests/fixtures/mercury_lower_reference.json';
 if(process.argv[2]){
  const source=evaluateModel(fs.readFileSync(process.argv[2],'utf8'));
  assert.deepEqual(actual.results,source.results,'All 729 daily windows and 216 month overlaps match the supplied v3 logic');
  if(process.env.UPDATE_LOWER_REFERENCE==='1')fs.writeFileSync(fixture,JSON.stringify({source:'mercury_atlas_native_systems_v3_lower_layer.html',resultsSha256:hash(source.results)},null,2)+'\n');
 }
 assert.equal(hash(actual.results),JSON.parse(fs.readFileSync(fixture)).resultsSha256);
 // Half-open interval excludes the end date if it ends exactly at midnight.
 assert.equal(vm.runInContext("daysBetweenExact('2026-10-01T00:00:00Z','2026-10-02T00:00:00Z').length",actual.context),1);
 assert.equal(vm.runInContext("daysBetweenExact('2026-10-01T23:59:59Z','2026-10-02T00:00:01Z').length",actual.context),2);
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date('2026-10-03T11:00:00Z')});await p.clock.pauseAt(new Date('2026-10-03T12:00:00Z'));
 await p.goto(pathToFileURL(path.resolve('mercury_atlas.html')).href);await p.locator('[data-page="compare"]').click();await p.locator('[data-cmonth="9"]').click();
 const validate=async()=>{
  const start=await p.locator('#lowerSD').inputValue(),r=actual.context.SD_DATA.find(r=>r.startExact===start),expected=actual.results.windows.find(w=>w.start===start).days;
  assert.deepEqual(await p.locator('[data-lower-day]').evaluateAll(es=>es.map(e=>e.dataset.lowerDay)),expected.map(d=>d.day.date));
  const dim=await p.locator('#compareDimension').inputValue();
  const counts=[1,2,3,4,5].map(h=>expected.filter(d=>d.day.dims[dim].heat===h).length);
  assert.deepEqual(await p.locator('[data-count]').evaluateAll(es=>es.map(e=>+e.dataset.count)),counts);
  assert.equal(await p.locator('#compareLowerLayer time').first().getAttribute('datetime'),r.startExact);
  assert.equal(await p.locator('#compareLowerLayer time').nth(1).getAttribute('datetime'),r.endExact);
 };
 await validate();
 const options=await p.locator('#lowerSD option').evaluateAll(es=>es.map(e=>e.value));
 for(const option of options){await p.locator('#lowerSD').selectOption(option);await validate()}
 for(const dim of ['wealth','mind','spiritual']){await p.locator('#compareDimension').selectOption(dim);await validate()}
 await p.locator('[data-lower-day]').first().click();assert((await p.locator('#lowerDayDetail').textContent()).includes('Solar month'));
 // Current markers refresh without changing the selected interval or date details.
 const selected=await p.locator('#lowerSD').inputValue();await p.clock.setSystemTime(new Date('2026-10-04T00:00:00Z'));await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
 assert.equal(await p.locator('#lowerSD').inputValue(),selected);
 await p.locator('#compareYear').selectOption('2021');await p.locator('[data-cmonth="0"]').click();assert.equal(await p.locator('#lowerSD').count(),0);
 await p.locator('[data-cmonth="1"]').click();await validate();
 await p.locator('#compareYear').selectOption('2026');await p.locator('[data-cmonth="9"]').click();
 for(const width of [320,390,768,1440]){
  await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert(await p.locator('#compareLowerLayer').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  if(width===390)await p.locator('#compareLowerLayer').screenshot({path:'/tmp/mercury-lower-layer.png'});
 }
 await p.locator('#compareBack').click();assert(await p.locator('#compareNativeDetail').isHidden());
 assert.deepEqual(errors,[]);console.log('PASS: lower-layer source parity, exact date intersections, support distributions, selection, current markers, out-of-range handling and responsive layout');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
