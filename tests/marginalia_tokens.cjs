const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
  const page=await browser.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  let source=fs.readFileSync('books/marginalia.html','utf8'),expectedToken='device-only-test-value',writes=0;
  await page.route('https://openlibrary.org/**',r=>r.fulfill({json:{docs:[]}}));
  await page.route('https://covers.openlibrary.org/**',r=>r.abort());
  await page.route('https://raw.githubusercontent.com/**',r=>r.fulfill({body:source}));
  await page.route('https://api.github.com/**',r=>{
   assert.equal(r.request().headers().authorization,'Bearer '+expectedToken);
   if(new URL(r.request().url()).pathname==='/user')return r.fulfill({json:{login:'test-account'}});
   if(r.request().method()==='PUT'){
    writes++;source=Buffer.from(r.request().postDataJSON().content,'base64').toString('utf8');
    assert(!source.includes(expectedToken));return r.fulfill({json:{commit:{sha:'a'.repeat(40)}}});
   }
   return r.fulfill({json:{sha:'test-sha',encoding:'base64',content:Buffer.from(source).toString('base64')}});
  });
  await page.goto(pathToFileURL(path.resolve('books/marginalia.html')).href);
  const open=async()=>{await page.getByRole('button',{name:'GitHub settings',exact:true}).click();await page.waitForFunction(()=>document.getElementById('token-status').textContent.length>0)};
  await open();await page.locator('#github-token').fill(expectedToken);await page.locator('#token-remember').click();await page.waitForFunction(()=>savedTokenAvailable && !metadataBusy);
  assert.equal(await page.locator('#github-token').inputValue(),'');
  const stored=await page.evaluate(async()=>{const r=await tokenVault('get');return {keys:Object.keys(r),extractable:r.key.extractable,algorithm:r.key.algorithm.name,cipher:Array.from(new Uint8Array(r.ciphertext)),iv:Array.from(r.iv)}});
  assert.deepEqual(stored.keys.sort(),['ciphertext','iv','key']);assert.equal(stored.extractable,false);assert.equal(stored.algorithm,'AES-GCM');assert.equal(stored.iv.length,12);
  assert(!Buffer.from(stored.cipher).toString().includes(expectedToken));assert(!(await page.evaluate(()=>JSON.stringify(localStorage))).includes(expectedToken));
  await page.reload();await open();await page.waitForFunction(()=>savedTokenAvailable);
  assert.equal(await page.locator('#github-token').inputValue(),'');
  await page.locator('#github-check').click();await page.waitForFunction(()=>!metadataBusy && document.getElementById('github-status').textContent.includes('Authenticated'));
  assert.equal(writes,0);
  // Saved credential commits without entering it again and never enters exports.
  await page.evaluate(()=>{BOOKS[0].optional.Notes='Device token test change';document.getElementById('github-submit').disabled=false});
  await page.locator('#github-submit').click();await page.waitForFunction(()=>!metadataBusy && document.getElementById('github-status').textContent.includes('Committed'));
  assert.equal(writes,1);assert(!(await page.evaluate(()=>metadataFileHTML())).includes(expectedToken));
  assert(await page.locator('#github-commit').isHidden());await open();await page.waitForFunction(()=>savedTokenAvailable);
  await page.locator('#token-change').click();expectedToken='replacement-device-test';await page.locator('#github-token').fill(expectedToken);await page.locator('#token-remember').click();await page.waitForFunction(()=>!metadataBusy);
  await page.reload();await open();await page.waitForFunction(()=>savedTokenAvailable);await page.locator('#github-check').click();await page.waitForFunction(()=>!metadataBusy && document.getElementById('github-status').textContent.includes('Authenticated'));
  // A failed replacement retains the existing encrypted record.
  await page.evaluate(()=>{window.originalVault=tokenVault;tokenVault=async(action,value)=>{if(action==='put')throw new Error('Storage blocked');return originalVault(action,value)}});
  await page.locator('#token-change').click();await page.locator('#github-token').fill('failed-replacement');await page.locator('#token-remember').click();await page.waitForFunction(()=>!metadataBusy);
  assert((await page.locator('#token-status').textContent()).includes('Storage blocked'));
  await page.evaluate(()=>{tokenVault=originalVault;replacingSavedToken=false});assert.equal(await page.evaluate(()=>activeGitHubToken()),expectedToken);
  await page.locator('#token-forget').click();await page.waitForFunction(()=>!metadataBusy && !savedTokenAvailable);
  assert.equal(await page.evaluate(()=>tokenVault('get')),undefined);
  await page.reload();await open();assert.equal(await page.evaluate(()=>savedTokenAvailable),false);
  assert.deepEqual(errors,[]);console.log('Encrypted device token remember/reload/use/change/forget, export exclusion and failed-replacement preservation passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
