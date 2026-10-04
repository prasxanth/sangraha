const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const {chromium}=require('playwright');const {pathToFileURL}=require('node:url');const path=require('node:path');
const key='lifeAtlasOutcomeJournalV4';
function pureRules(html){const c={};vm.createContext(c);for(const name of ['orientHeat','intensityRank','synthesisMechanism','choosePosture']){const start=html.indexOf('function '+name+'('),end=html.indexOf('\nfunction ',start+1);vm.runInContext(html.slice(start,end),c)}return c}
(async()=>{
 const html=fs.readFileSync('mercury_atlas.html','utf8');
 if(process.argv[2]){const actual=pureRules(html),source=pureRules(fs.readFileSync(process.argv[2],'utf8'));
 for(let a=1;a<=5;a++)for(let b=1;b<=5;b++)for(const ai of ['LOW','MEDIUM','HIGH','VERY HIGH'])for(const bi of ['LOW','MEDIUM','HIGH','VERY HIGH'])for(const dim of ['career','wealth','marriage','family','children','mind','vitality','learning','spiritual','reinvention'])for(const mode of ['balanced','risk','opportunity']){
 const j={heat:a,intensity:ai},z={heat:b,intensity:bi};assert.equal(actual.choosePosture(j,z,dim,mode),source.choosePosture(j,z,dim,mode));assert.equal(JSON.stringify(actual.synthesisMechanism(j,z,{pd:'Rahu'},{},dim)),JSON.stringify(source.synthesisMechanism(j,z,{pd:'Rahu'},{},dim)));
 }}
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{const p=await browser.newPage({viewport:{width:390,height:844},timezoneId:'America/Los_Angeles'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date('2026-10-03T11:00:00Z')});await p.clock.pauseAt(new Date('2026-10-03T12:00:00Z'));
 const url=pathToFileURL(path.resolve('mercury_atlas.html')).href;await p.goto(url);await p.locator('[data-page="practice"]').click();
 assert.equal(await p.locator('.horizon-card').count(),4);await p.locator('.horizon-launch').first().click();assert.equal(await p.locator('#insightDialog details').count(),0);await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.querySelector('#insightDialog').contains(document.activeElement)));await p.keyboard.press('Escape');await p.waitForFunction(()=>document.activeElement.classList.contains('horizon-launch'));
 await p.locator('#guidanceDate').fill('2029-08-11');await p.locator('#guidanceDate').dispatchEvent('change');await p.locator('#guidanceOverview .insight-link').click();assert((await p.locator('#insightBody').textContent()).includes('Wu Shen'));await p.locator('#insightClose').click();
 await p.locator('#guidanceDate').fill('2020-01-01');await p.locator('#guidanceDate').dispatchEvent('change');assert.equal(await p.locator('.horizon-card').count(),0);
 await p.locator('#guidanceToday').click();assert.equal(await p.locator('#guidanceDate').inputValue(),'2026-10-03');
 await p.clock.setSystemTime(new Date('2026-10-04T08:00:00Z'));await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));assert.equal(await p.locator('#guidanceDate').inputValue(),'2026-10-04');
 await p.locator('#guidanceDate').fill('2026-09-01');await p.locator('#guidanceDate').dispatchEvent('change');await p.clock.setSystemTime(new Date('2026-10-05T08:00:00Z'));await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));assert.equal(await p.locator('#guidanceDate').inputValue(),'2026-09-01');
 await p.locator('#guidance-tab-journal').click();await p.locator('#journalNote').fill('<img src=x onerror=window.injected=1> literal note');await p.locator('#journalSave').click();assert.equal(await p.locator('.journal-entry').count(),1);assert.equal(await p.locator('.journal-entry img').count(),0);
 const frozen=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert(frozen[0].snapshot.jyPD.label);assert(frozen[0].snapshot.baDay.label);
 await p.reload();await p.locator('[data-page="practice"]').click();assert.equal(await p.locator('.journal-entry').count(),1);assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),frozen);
 await p.locator('#guidance-tab-journal').click();const downloadPromise=p.waitForEvent('download');await p.locator('#journalExport').click();const download=await downloadPromise;const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.deepEqual(exported.entries,frozen);
 const importFile=async(obj)=>p.locator('#journalImportFile').setInputFiles({name:'journal.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(obj))});
 await importFile({entries:[{id:'broken'}]});await p.waitForFunction(()=>document.querySelector('#journalStatus').textContent.includes('Invalid'));assert.equal(await p.locator('.journal-entry').count(),1);
 await importFile(exported);await p.waitForFunction(()=>document.querySelector('#journalStatus').textContent.includes('Imported 0'));
 const extra=JSON.parse(JSON.stringify(frozen[0]));extra.id='another';extra.snapshot.jyPD.label='<img src=x onerror=window.injected=1>';await importFile({entries:[extra]});await p.waitForFunction(()=>document.querySelectorAll('.journal-entry').length===2);assert.equal(await p.locator('.journal-entry img').count(),0);
 await p.locator('#guidance-tab-review').click();await p.locator('[data-jdel]').first().click();assert.equal(await p.locator('.journal-entry').count(),1);
 await p.locator('#guidance-tab-journal').click();p.once('dialog',d=>d.dismiss());await p.locator('#journalClear').click();assert.equal(await p.locator('.journal-entry').count(),1);
 for(const width of [320,390,1440]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await p.setViewportSize({width:390,height:844});await p.locator('#guidance-tab-plan').click();await p.locator('#guidanceEngine').screenshot({path:'/tmp/mercury-guidance.png'});
 await p.locator('[data-page="compare"]').click();await p.locator('[data-cmonth="9"]').click();assert.equal(await p.locator('#compareNativeDetail .synthesis-panel').count(),2);
 assert.deepEqual(errors,[]);
 const denied=await browser.newPage();await denied.addInitScript(()=>Storage.prototype.setItem=function(){throw new Error('storage denied')});await denied.goto(url);await denied.locator('[data-page="practice"]').click();await denied.locator('#guidance-tab-journal').click();await denied.locator('#journalSave').click();await denied.locator('#journalSave').click();assert.equal(await denied.locator('.journal-entry').count(),2);assert((await denied.locator('#journalStatus').textContent()).includes('Session only'));
 console.log('PASS: source guidance rules; four horizons; date following; native luck context; frozen snapshots; journal persistence, export, validated merge, escaping and storage fallback; responsive layout');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
