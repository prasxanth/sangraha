const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium,webkit}=require('playwright');
(async()=>{const browser=await (process.env.WEBKIT?webkit.launch({headless:true}):chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}));try{
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://**/*',r=>{const u=r.request().url();if(u.includes('covers.openlibrary.org')||u.includes('mzstatic.com'))return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150"><rect width="100" height="150" fill="purple"/></svg>'});return r.fulfill({json:{docs:[],results:[],items:[]}})});
await page.goto(pathToFileURL(path.resolve('books/marginalia.html')).href);await page.evaluate(()=>switchScreen('library'));
assert.equal(await page.locator('#view-list').getAttribute('aria-pressed'),'true');await page.click('#view-covers');
assert.equal(await page.locator('.flow-item').count(),118);assert.equal(await page.locator('#flow-position').innerText(),'1 of 118');
await page.click('#flow-next');await page.waitForFunction(()=>document.querySelector('#flow-position').textContent==='2 of 118');
await page.locator('.flow-track').focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('#flow-position').textContent==='3 of 118');
await page.locator('.flow-item.selected button').click();assert(await page.locator('#flow-detail .book-detail').isVisible());assert(await page.locator('#flow-detail button').filter({hasText:'Edit metadata'}).isVisible());
assert(await page.evaluate(()=>{const t=document.querySelector('.flow-track'),c=t.querySelector('.selected');return Math.abs(c.getBoundingClientRect().left+c.offsetWidth/2-(t.getBoundingClientRect().left+t.clientWidth/2))<2}));
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.reload();await page.evaluate(()=>switchScreen('library'));assert.equal(await page.locator('#view-covers').getAttribute('aria-pressed'),'true');
await page.evaluate(()=>{const t=document.querySelector('.flow-track'),c=t.children[8];t.scrollLeft=c.offsetLeft-(t.clientWidth-c.offsetWidth)/2});
await page.waitForFunction(()=>document.querySelector('#flow-position').textContent==='9 of 118');
await page.evaluate(()=>{switchScreen('home');switchScreen('library')});assert.equal(await page.locator('#flow-position').innerText(),'9 of 118');
await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>renderList());
assert(await page.evaluate(()=>{const t=document.querySelector('.flow-track'),c=t.querySelector('.selected');return Math.abs(c.getBoundingClientRect().left+c.offsetWidth/2-(t.getBoundingClientRect().left+t.clientWidth/2))<2}));
assert.equal(await page.locator('.flow-book').first().evaluate(el=>getComputedStyle(el).transform),'none');

await page.evaluate(()=>{searchQuery='Dune Messiah';renderList()});assert.equal(await page.locator('.flow-item').count(),1);assert(await page.locator('#flow-next').isDisabled());
await page.evaluate(()=>{searchQuery='not-a-book-zzzz';renderList()});assert(await page.locator('.empty-state').isVisible());
await page.click('#view-list');await page.evaluate(()=>{searchQuery='';renderList()});assert.equal(await page.locator('.book-card').count(),118);
assert.deepEqual(errors,[]);console.log('Cover flow: selection, keyboard, details, centered mobile layout, preference, filters and empty state passed.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
