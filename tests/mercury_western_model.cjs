const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const html=fs.readFileSync('mercury_atlas.html','utf8');
const raw=html.match(/<script type="application\/json" id="westernNativeData">(.*?)<\/script>/s)[1],data=JSON.parse(raw);
// Corrected user-supplied Western structural dataset; no regenerated observations.
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'14e3883ad5b540328c8c447695ed9ada7120c69223c6036a264a653e6daa1c12');
assert.deepEqual(['days','months','years'].map(k=>Object.keys(data[k]).length),[6535,215,18]);
for(const layer of ['days','months','years'])for(const record of Object.values(data[layer])){
 assert.equal(Object.keys(record.d).length,10);
 for(const axes of Object.values(record.d)){assert.equal(axes.length,6);assert(axes.every(Number.isFinite));assert(axes[0]>=1&&axes[0]<=5);assert(axes[1]>=-100&&axes[1]<=100);assert(axes.slice(2).every(x=>x>=0&&x<=100));}
}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const p=await browser.newPage();await p.clock.install({time:new Date('2026-10-28T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-28T12:00:00Z'));await p.goto('file://'+process.cwd()+'/mercury_atlas.html');
 await p.locator('[data-page="western"]').click();await p.locator('#westernYear').selectOption('2026');await p.locator('#westernMonth').selectOption('10');
 assert.equal(await p.locator('[data-wyear="2026"] .western-rating').getAttribute('data-heat'),String(data.years['2026'].d.career[0]));
 assert.equal(await p.locator('[data-wmonth="10"] .western-rating').getAttribute('data-heat'),String(data.months['2026-10'].d.career[0]));
 for(const [selector,expected] of [['#westernCurrent',data.days['2026-10-28'].d.career],['#westernDetail',data.months['2026-10'].d.career]]){
  for(const [axis,index] of [['activation',2],['intensity',3],['agency',4],['volatility',5]])assert.equal(await p.locator(selector+' .axis-card.'+axis+' b').innerText(),String(expected[index]));
 }
 assert(html.includes("const FORECAST_MODEL_VERSION='vNext-1.1-western-structural'"));
 console.log('PASS: corrected Western source integrity, all axis ranges, distinct annual/month/day readings, and new forecast model identity.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
