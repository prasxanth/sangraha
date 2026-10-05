const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const html=fs.readFileSync('mercury_atlas.html','utf8'),key='lifeAtlasOutcomeJournalV4',stateKey='lifeAtlasJournalState';
const putData=(source,entries)=>source.replace(/(<script id="journal(?:Data|Baseline)" type="application\/json">)[\s\S]*?(<\/script>)/g,(_,a,b)=>a+JSON.stringify(entries).replace(/</g,'\\u003c')+b);
const getData=source=>JSON.parse(source.match(/<script id="journalData" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const hash=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));let remote=html,writes=[],reject=false;
  await page.route('https://api.github.com/**',async route=>{
   const req=route.request();if(req.method()==='PUT'){
    const data=req.postDataJSON();writes.push(data);assert.equal(data.sha,hash(remote));assert.equal(data.branch,'main');
    if(reject){await route.fulfill({status:409,body:'{}'});return}
    remote=Buffer.from(data.content,'base64').toString('utf8');await route.fulfill({json:{commit:{sha:'0123456789abcdef'}}});
   }else await route.fulfill({contentType:'text/html',body:remote});
  });
  await page.goto('file://'+process.cwd()+'/mercury_atlas.html');await page.locator('[data-page="practice"]').click();await page.locator('#guidance-tab-journal').click();await page.locator('#journalNote').fill('Local observation');await page.locator('#journalSave').click();
  const local=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),other={...local[0],id:'remote-entry',note:'Remote observation',futureField:{keep:true}};
  remote=putData(html,[other]).replace('</title>',' · latest code</title>');
  async function openReview(){await page.locator('#journalGitHub').click();await page.locator('#journalToken').fill('test-token-only');await page.locator('#journalGitReview').click();await page.waitForFunction(()=>document.getElementById('journalGitStatus').textContent.includes('Ready to publish'))}
  async function commit(){await page.locator('#journalPublishConsent').check();await page.locator('#journalCommit').click()}
  await openReview();await commit();await page.waitForFunction(()=>document.getElementById('journalGitStatus').textContent.includes('Committed and verified'));
  assert.equal(writes.length,1);assert.equal(getData(remote).length,2);assert(remote.includes('latest code</title>'));assert(!remote.includes('test-token-only'));assert.deepEqual(getData(remote).find(e=>e.id==='remote-entry').futureField,{keep:true});
  assert.equal(await page.locator('#journalToken').inputValue(),'');
  await page.locator('#journalGitClose').click();await page.reload();await page.locator('[data-page="practice"]').click();await page.locator('#guidance-tab-journal').click();assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).length,key),2,'Reopening older HTML never treats cloud entries as deletions');
  await page.locator('#journalNote').fill('Second local observation');await page.locator('#journalSave').click();await openReview();remote=remote.replace('latest code','even newer code');await commit();await page.waitForFunction(()=>document.getElementById('journalGitStatus').textContent.includes('Review the refreshed'));assert.equal(writes.length,1,'Freshness change blocks write');
  await page.locator('#journalGitReview').click();await page.waitForFunction(()=>!document.getElementById('journalCommit').disabled);reject=true;await commit();await page.waitForFunction(()=>document.getElementById('journalGitStatus').textContent.includes('No overwrite')||document.getElementById('journalGitStatus').textContent.includes('no overwrite'));assert.equal(writes.length,2);assert.equal(getData(remote).length,2);assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).length,key),3);
  reject=false;
  // Resolve a same-field conflict explicitly through the actual dialog.
  const baseEntry=local[0];remote=putData(html,[{...baseEntry,note:'Remote revision'}]);
  await page.evaluate(({stateKey,key,entry})=>{localStorage.setItem(stateKey,JSON.stringify({baseline:[entry],entries:[{...entry,note:'Local revision'}]}));localStorage.setItem(key,JSON.stringify([{...entry,note:'Local revision'}]));},{stateKey,key,entry:baseEntry});
  await page.reload();await page.locator('[data-page="practice"]').click();await page.locator('#guidance-tab-journal').click();await page.locator('#journalGitHub').click();await page.locator('#journalToken').fill('test-token-only');await page.locator('#journalGitReview').click();await page.locator('.journal-conflict select').waitFor();assert(await page.locator('#journalCommit').isDisabled());
  await page.locator('.journal-conflict select').selectOption('remote');await commit();await page.waitForFunction(()=>document.getElementById('journalGitStatus').textContent.includes('Committed and verified'));assert.equal(getData(remote)[0].note,'Remote revision');
  const priorWrites=writes.length;remote=putData(html,[baseEntry,baseEntry]);await page.locator('#journalGitReview').click();await page.waitForFunction(()=>document.getElementById('journalGitStatus').textContent.includes('Invalid or duplicate'));assert(await page.locator('#journalCommit').isDisabled());assert.equal(writes.length,priorWrites);
  await page.locator('#journalToken').fill('test-token-only');await page.locator('#journalGitClose').click();assert.equal(await page.locator('#journalToken').inputValue(),'');
  assert.deepEqual(errors,[]);
  // Exercise the exact merge implementation independently of network/UI.
  const start=html.indexOf('const journalEqual='),end=html.indexOf('function sourceJournal(',start),validation=html.slice(html.indexOf('function validJournalEntry('),html.indexOf('function journalNotice('));
  const context=vm.createContext({nativeDims:['career','wealth','marriage','family','children','mind','vitality','learning','spiritual','reinvention']});vm.runInContext(html.slice(start,end)+validation,context);
  const merge=(b,l,r,c={})=>JSON.parse(JSON.stringify(context.mergeJournal(b,l,r,c))),base=local[0];
  let result=merge([base],[{...base,note:'local edit'}],[{...base,useful:'yes',unknown:'keep'}]);assert.equal(result.conflicts.length,0);assert.equal(result.entries[0].note,'local edit');assert.equal(result.entries[0].useful,'yes');assert.equal(result.entries[0].unknown,'keep');
  result=merge([base],[{...base,note:'local edit'}],[{...base,note:'remote edit'}]);assert.equal(result.conflicts.length,1);const conflict=result.conflicts[0];result=merge([base],[{...base,note:'local edit'}],[{...base,note:'remote edit'}],{[conflict.key]:'remote'});assert.equal(result.entries[0].note,'remote edit');
  assert.equal(merge([base],[],[base]).entries.length,0);assert.equal(merge([base],[],[{...base,note:'edited'}]).conflicts.length,1);assert.equal(merge([],[],[other]).entries.length,1);assert.throws(()=>merge([],[],[other,other]));
  console.log('PASS: three-way field merge, additions/deletions/conflicts, legacy migration, stale-file reopen, latest-code preservation, SHA guards, verified commits, remote races, unknown fields, credential exclusion.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
