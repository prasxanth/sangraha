const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let mode='apple',requests=[];
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150"><rect width="100" height="150" fill="purple"/></svg>';
 await page.route('https://openlibrary.org/**',r=>r.fulfill({json:{docs:[]}}));
 await page.route('https://itunes.apple.com/**',r=>{requests.push(r.request().url());return r.fulfill({json:{results:mode==='apple'?[{trackName:'Dune Messiah',artistName:'Frank Herbert',artworkUrl100:'https://is1-ssl.mzstatic.com/test.jpg',trackViewUrl:'https://books.apple.com/us/book/id123'}]:[]}})});
 await page.route('https://www.googleapis.com/**',r=>r.fulfill({json:{items:mode==='google'?[{id:'example',volumeInfo:{title:'Dune Messiah',authors:['Frank Herbert'],imageLinks:{thumbnail:'http://books.google.com/books/content?id=example'}}}]:[]}}));
 await page.route('https://is1-ssl.mzstatic.com/**',r=>r.fulfill({contentType:'image/svg+xml',body:svg}));
 await page.route('https://books.google.com/**',r=>r.fulfill({contentType:'image/svg+xml',body:svg}));
 await page.route('https://covers.openlibrary.org/**',r=>r.abort());
 await page.goto(pathToFileURL(path.resolve('books/marginalia.html')).href);
 const tests=await page.evaluate(()=>{
 const b={title:'Dune Messiah: A Novel',author:'Frank Herbert'};
 return [matchesCoverBook(b,'Dune Messiah',['Frank Herbert']),matchesCoverBook(b,'Dune',['Frank Herbert']),matchesCoverBook(b,'Dune Messiah',['Brian Herbert']),matchesCoverBook({title:'American Gods (10th Anniversary)',author:'Neil Gaiman'},'American Gods',['Neil Gaiman']),matchesCoverBook({title:'Thinking, Fast and Slow',author:'Daniel Kahneman'},'Summary of Thinking, Fast and Slow',['Daniel Kahneman']),validCover({url:'https://evil.example/a.jpg',page:'https://books.apple.com/id1',source:'Apple Books'}),matchedCover(b,[{title:'Dune Messiah',author_name:['Frank Herbert'],cover_i:42},{title:'Dune Messiah',author_name:['Frank Herbert'],cover_i:43}])];
 });assert.deepEqual(tests,[true,false,false,true,false,null,42]);
 assert.equal(await page.evaluate(()=>matchesCoverBook({title:'Dune',author:'Frank Herbert'},'Dune: The Graphic Novel',['Frank Herbert'])),false);
 assert.equal(await page.evaluate(()=>matchesCoverBook({title:'An Introduction to Statistical Learning: with Applications in R',author:'Gareth James'},'An Introduction to Statistical Learning: with Applications in Python',['Gareth James'])),false);
 // Isolate from automatic observer searches for deterministic provider fallback.
 await page.evaluate(()=>{coverObserver.disconnect();coverQueue.length=0;Object.keys(coverCooldown).forEach(k=>delete coverCooldown[k]);});
 const idx=await page.evaluate(()=>BOOKS.findIndex(b=>b.title==='Dune Messiah'));
 await page.evaluate(i=>coverResults.set(coverKey(BOOKS[i]),validCover(42)),idx); // Broken cached cover must fall through.
 let result=await page.evaluate(i=>resolveBookCover(i),idx);assert.equal(result.source,'Apple Books');
 await page.evaluate(({i,c})=>{openBook(i);paintCover(i,c)},{i:idx,c:result});await page.waitForFunction(()=>document.querySelector('#book-list .cover img')?.naturalWidth===100);
 assert(await page.locator('#book-list .cover-credit').getAttribute('href')==='https://books.apple.com/us/book/id123');
 mode='google';result=await page.evaluate(async i=>{coverResults.clear();delete coverCatalog[coverKey(BOOKS[i])];coverProviderTimes.apple=0;return resolveBookCover(i)},idx);assert.equal(result.source,'Google Books');assert(result.url.startsWith('https://'));
 mode='none';result=await page.evaluate(async i=>{coverResults.clear();coverProviderTimes.apple=0;return resolveBookCover(i)},idx);assert.equal(result,null);
 assert(requests.every(url=>!url.includes('Notes')&&!url.includes('2026-')));
 assert.deepEqual(errors,[]);console.log('Cover subtitle/edition matching, wrong-book rejection, Apple/Google fallback, source links and missing-cover checks passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
