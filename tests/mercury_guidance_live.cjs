const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const html=fs.readFileSync('mercury_atlas.html','utf8');
const data=id=>JSON.parse(html.match(new RegExp('<script[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)</script>'))[1]);
const sd=data('sookshmaData'),bazi=data('baziNativeData');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const p=await browser.newPage({viewport:{width:390,height:844},timezoneId:'America/Los_Angeles'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date('2026-10-11T10:00:00Z')});await p.clock.pauseAt(new Date('2026-10-11T10:00:00Z'));
 await p.goto('file://'+process.cwd()+'/mercury_atlas.html');await p.locator('[data-page="practice"]').click();
 async function matchesNow(){const now=await p.evaluate(()=>Date.now()),expected=sd.find(r=>Date.parse(r.startExact)<=now&&now<Date.parse(r.endExact));assert.equal(await p.locator('#guidanceOverview').getAttribute('data-sd-start'),expected.startExact);assert.equal(await p.locator('#guidanceOverview').getAttribute('data-bazi-day'),new Date(now).toISOString().slice(0,10));assert((await p.locator('#guidanceTiming').textContent()).includes(`${expected.ad} → ${expected.pd} → ${expected.sd}`));assert((await p.locator('#currentPeriod').textContent()).includes(`${expected.ad} → ${expected.pd} → ${expected.sd}`));}
 const reported=sd.find(r=>r.startExact.startsWith('2026-10-11'));
 assert(reported,'Regression includes the reported October 11 transition');
 const pd=sd.find((r,i)=>i&&r.startExact>'2026-10-11'&&r.pd!==sd[i-1].pd);
 const boundaries=[Date.parse(reported.startExact),Date.parse(pd.startExact),Date.parse(bazi.years['2026'].months[8].start),Date.parse(bazi.years['2030'].luckStart),Date.parse('2026-10-12T00:00:00Z')];
 for(const t of boundaries){await p.clock.setSystemTime(t-1);await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await matchesNow();await p.locator('.horizon-launch').nth(2).click();await p.clock.runFor(1);await matchesNow();const expected=sd.find(r=>Date.parse(r.startExact)<=t&&t<Date.parse(r.endExact));assert((await p.locator('#insightBody').textContent()).includes(expected.sd+' Sūkṣma'));await p.locator('#insightClose').click();const year=Object.values(bazi.years).find(y=>Date.parse(y.start)<=t&&t<Date.parse(y.end)),month=year.months.find(m=>Date.parse(m.start)<=t&&t<Date.parse(m.end));assert.equal(await p.locator('#guidanceOverview').getAttribute('data-bazi-month'),month.start);}
 // Historical selection uses noon UTC and must not be dragged forward by timers/resume.
 await p.locator('#guidanceDate').fill('2026-10-11');await p.locator('#guidanceDate').dispatchEvent('change');const historical=await p.locator('#guidanceOverview').getAttribute('data-sd-start');assert.equal(historical,sd.find(r=>Date.parse(r.startExact)<=Date.parse('2026-10-11T12:00:00Z')&&Date.parse('2026-10-11T12:00:00Z')<Date.parse(r.endExact)).startExact);
 await p.clock.setSystemTime(new Date('2026-10-13T01:00:00Z'));await p.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(await p.locator('#guidanceOverview').getAttribute('data-sd-start'),historical);
 await p.locator('#guidanceToday').click();await matchesNow();assert.equal(await p.locator('#guidanceDate').inputValue(),'2026-10-12','Local display date may differ from UTC BaZi day');
 assert.deepEqual(errors,[]);console.log('PASS: live Guidance matches Jyotish/BaZi at SD, PD, solar-month, luck and UTC-day boundaries; open horizon refresh; historical noon sampling; resume and local/UTC date differences.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
