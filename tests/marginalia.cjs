const assert = require('node:assert/strict');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const {chromium} = require('playwright');
(async()=>{
 const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
 const page = await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://openlibrary.org/search.json?*',r=>r.fulfill({json:{docs:[]}}));
 await page.goto(pathToFileURL(path.resolve('books/marginalia.html')).href);
 assert(await page.locator('#screen-home').isVisible());
 const original=JSON.parse(fs.readFileSync('archive/marginalia.pre-dashboard-2026-10-03.html','utf8').match(/<script id="embeddedData" type="application\/json">(.*?)<\/script>/s)[1]);
 assert.deepEqual(await page.evaluate(()=>BOOKS),original);
 console.log('Books preserved:',original.length);
 assert.deepEqual(await page.evaluate(()=>['Graduate School','2011 - 2017','2024-2025','2026-03','2020/03/20','August, 2019'].map(date=>completionYear({optional:{'Completion Date':date}}))),[null,null,null,'2026','2020','2019']);
 assert.deepEqual(await page.evaluate(()=>{const b={title:'Dune',author:'Frank Herbert'};return [matchedCover(b,[{title:'Dune',author_name:['Frank Herbert'],cover_i:123}]),matchedCover(b,[{title:'Dune',author_name:['Wrong Author'],cover_i:123}]),matchedCover(b,[{title:'Dune Messiah',author_name:['Frank Herbert'],cover_i:123}])]}),[123,null,null]);
 await page.locator('.shelf-book').first().click(); assert(await page.locator('.book-detail.open').isVisible());
 await page.locator('#nav-library').click(); await page.locator('#active-filter-banner-clear').click();
 await page.locator('#search-input').fill('no such book qzx'); assert(await page.locator('.empty-state').isVisible());
 await page.locator('#nav-home').click(); await page.locator('.section-action').first().click();
 assert.equal(await page.locator('.book-card').count(),await page.evaluate(()=>BOOKS.filter(shelves[0].test).length));
 assert.equal(await page.locator('#search-input').inputValue(),'');
 await page.locator('#nav-stats').click(); await page.locator('.stat-card').nth(1).click();
 assert.equal(await page.locator('.book-card').count(),await page.evaluate(()=>BOOKS.filter(b=>Number(b.optional['Impact (1–5)'])>=5).length));
 await page.locator('#active-filter-banner-clear').click();
 await page.locator('#hamburger-btn').click(); await page.locator('[data-group="theme"]').click(); await page.locator('#panel-overlay').click();
 await page.locator('.group-header').first().click(); assert(await page.locator('.group-books.open').count());
 for (const [width,height] of [[1440,900],[390,844],[320,568]]) {
  await page.setViewportSize({width,height});
  for (const screen of ['home','library','stats']) {
   await page.locator('#nav-'+screen).click();
   assert(await page.locator('#screen-'+screen).isVisible());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert(await page.evaluate(()=>{const n=document.querySelector('.bottom-nav').getBoundingClientRect();return n.bottom<=innerHeight+1;}));
  }
 }
 await page.setViewportSize({width:1440,height:1000}); await page.locator('#nav-home').click(); await page.screenshot({path:'/tmp/marginalia-desktop.png'});
 await page.setViewportSize({width:390,height:844}); await page.screenshot({path:'/tmp/marginalia-mobile.png'});
 await page.locator('.shelf-book').first().scrollIntoViewIfNeeded();
 await page.route('https://covers.openlibrary.org/**', r => r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150"><rect width="100" height="150" fill="tan"/></svg>'}));
 await page.evaluate(()=>paintCover(Number(document.querySelector('#screen-home [data-cover]').dataset.cover),123));
 await page.waitForFunction(()=>[...document.querySelectorAll('.cover img')].some(i=>i.naturalWidth===100));
 await page.route('https://covers.openlibrary.org/**', r=>r.abort());
 await page.evaluate(()=>{document.querySelectorAll('.cover img').forEach(i=>i.remove());paintCover(Number(document.querySelector('#screen-home [data-cover]').dataset.cover),456);document.querySelectorAll(".cover img").forEach(i=>i.loading="eager")});
 await page.waitForFunction(()=>document.querySelectorAll('.cover img').length===0);
 assert(await page.locator('.cover-type').count()>0);
 assert.deepEqual(errors,[]); console.log('Dashboard, filters, grouping, matching, dates, data preservation and responsive checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
