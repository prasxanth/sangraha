const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const audit=`window.__volatilityAudit=()=>{
 const axes=[];
 for(const sd of SD_DATA)for(const dim of ['career','mind','reinvention'])for(const level of ['ad','pd','sd']){
  const a=jyVNextAxes(sd,dim,level);axes.push([a.heat,a.score,a.activation,a.intensityScore,a.volatilityScore]);
 }
 const bazi=[];
 for(const [year,y] of Object.entries(NATIVE.years))for(const m of y.months){
  const date=m.days[Math.floor(m.days.length/2)].date,ctx=nativeContextForDate(date,'career');
  for(const level of ['luck','year','month','day']){const a=baziVNextAxes(ctx.dayDim,'career',ctx,level);bazi.push([a.heat,a.score,a.activation,a.intensityScore,a.volatilityScore]);}
 }
 return {axes,bazi,clash:bzRelations('Zi','Wu'),combine:bzRelations('Zi','Chou'),repeat:bzRelations('Mao','Mao'),self:bzRelations('Hai','Hai')};
};\n`;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 async function inspect(path){const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const html=fs.readFileSync(path,'utf8').replace('function orientation(x)',audit+'function orientation(x)');await p.route('http://atlas.test/',r=>r.fulfill({contentType:'text/html',body:html}));await p.goto('http://atlas.test/');const out=await p.evaluate(()=>window.__volatilityAudit());assert.deepEqual(errors,[]);await p.close();return out;}
 const result=await inspect('mercury_atlas.html');
 for(const row of [...result.axes,...result.bazi]){assert(row.every(Number.isFinite));assert(row.slice(2).every(x=>x>=0&&x<=100));}
 assert(result.clash.includes('clash'));assert.deepEqual(result.combine,['combine']);assert.deepEqual(result.repeat,[]);assert(result.self.includes('self'));
 assert(result.axes.some(x=>x[3]>=56&&x[4]<30),'High consequence can coexist with low volatility');
 if(process.argv[2])assert.deepEqual(result,await inspect(process.argv[2]),'Native volatility and intensity match the supplied attachment across all SDs and solar months');
 console.log('PASS: Jyotish AD/PD/SD and BaZi luck/year/month/day axes; finite ranges; branch mechanics; intensity/volatility separation; supplied-source parity.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
