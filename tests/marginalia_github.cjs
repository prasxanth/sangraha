const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
  const page=await browser.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  const original=fs.readFileSync('books/marginalia.html','utf8');let remote=original, mode='ok', puts=[];
  await page.route('https://openlibrary.org/**',r=>r.fulfill({json:{docs:[]}}));
  await page.route('https://covers.openlibrary.org/**',r=>r.abort());
  await page.route('https://raw.githubusercontent.com/**',r=>r.fulfill({contentType:'text/plain',body:remote}));
  await page.route('https://api.github.com/**',async r=>{
   if(mode==='offline')return r.abort();
   if(r.request().method()==='PUT' || r.request().headers().authorization) assert(r.request().headers().authorization==='Bearer test-only-token');
   if(mode==='unauthorized')return r.fulfill({status:401,json:{message:'Bad credentials'}});
   if(r.request().method()==='GET')return r.fulfill({json:{sha:'original-sha',encoding:'base64',content:Buffer.from(remote).toString('base64')}});
   const body=r.request().postDataJSON(); puts.push(body);
   if(mode==='race')return r.fulfill({status:409,json:{message:'SHA mismatch'}});
   remote=Buffer.from(body.content,'base64').toString('utf8');
   return r.fulfill({json:{commit:{sha:'a'.repeat(40)}}});
  });
  await page.goto(pathToFileURL(path.resolve('books/marginalia.html')).href);
  await page.evaluate(()=>{BOOKS[0].optional.Notes='Updated reflection — λ <script>never()</script>';metadataDirty=true;showSaveStatus('Pending changes')});
  const open=async()=>{await page.getByRole('button',{name:'Commit to GitHub',exact:true}).click();await page.locator('#github-token').fill('test-only-token')};
  const submit=async()=>{await page.getByRole('button',{name:'Commit to main',exact:true}).click();await page.waitForFunction(()=>!metadataBusy);assert.equal(await page.locator('#github-token').inputValue(),'')};
  await open();assert((await page.locator('#github-changes').textContent()).includes('Notes'));
  mode='unauthorized';await submit();assert((await page.locator('#github-status').textContent()).includes('denied access'));assert.equal(puts.length,0);
  mode='offline';await page.locator('#github-token').fill('test-only-token');await submit();assert((await page.locator('#github-status').textContent()).includes('Cannot reach'));assert.equal(puts.length,0);
  mode='ok';remote=original.replace('Order vs chaos','Someone else edited this');await page.locator('#github-token').fill('test-only-token');await submit();assert((await page.locator('#github-status').textContent()).includes('different metadata'));assert.equal(puts.length,0);
  remote=original;mode='race';await page.locator('#github-token').fill('test-only-token');await submit();assert((await page.locator('#github-status').textContent()).includes('rejected'));assert(await page.evaluate(()=>metadataDirty));
  mode='ok';await page.locator('#github-token').fill('test-only-token');await submit();
  assert((await page.locator('#github-status').textContent()).includes('Committed to GitHub'));
  assert.equal(puts.length,2);assert.equal(puts[1].sha,'original-sha');assert.equal(puts[1].branch,'main');
  const published=Buffer.from(puts[1].content,'base64').toString('utf8');
  assert(published.includes('Updated reflection — λ'));assert(!published.includes('test-only-token'));assert(published.includes('\\u003cscript\\u003e'));
  assert.equal(await page.evaluate(()=>metadataDirty),false);
  await page.route('https://raw.githubusercontent.com/**',r=>r.fulfill({contentType:'text/plain',body:original}));
  await page.evaluate(()=>checkGitHub()); // Bypass a stale raw CDN after committing.
assert(await page.locator('#github-submit').isDisabled());
  assert(!(await page.evaluate(()=>JSON.stringify(localStorage))).includes('test-only-token'));
  await page.getByRole('button',{name:'Close GitHub commit',exact:true}).click();
  // Changes already applied remotely should not produce duplicate commits.
  await page.evaluate(source=>{githubBaseline=sourceBooks(source);BOOKS[0].optional.Notes='Updated reflection — λ <script>never()</script>'},original);
  await open();await submit();assert((await page.locator('#github-status').textContent()).includes('already on GitHub'));assert.equal(puts.length,2);
  await page.getByRole('button',{name:'Close GitHub commit',exact:true}).click();
  for(const [width,height] of [[1440,1000],[390,844],[320,568],[844,390]]){
   await page.setViewportSize({width,height});
   assert.equal(await page.evaluate(()=>Math.round(document.getElementById('app').getBoundingClientRect().height)),height);
   await page.evaluate(()=>openBook(0));await page.getByRole('button',{name:'Edit metadata',exact:true}).click();await page.waitForFunction(()=>!metadataBusy);
   const dims=await page.evaluate(()=>{const d=document.getElementById('metadata-editor').getBoundingClientRect(),a=document.querySelector('#metadata-editor .editor-actions').getBoundingClientRect();return{height:d.height,top:d.top,bottom:a.bottom}});
   assert.equal(Math.round(dims.height),height);assert.equal(dims.top,0);assert(dims.bottom<=height);
   await page.screenshot({path:`/tmp/marginalia-fullheight-${width}.png`});
   await page.getByRole('button',{name:'Close editor',exact:true}).click();
  }
  assert.deepEqual(errors,[]);
  console.log('GitHub success, credentials, conflicts, races, offline, duplicate prevention, Unicode and full-height editor checks passed.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
