const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const reference=fs.readFileSync('books/marginalia.html','utf8').match(/<meta name="viewport" content="([^"]+)"/)[1];
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await page.goto(pathToFileURL(path.resolve('jyotish_sadhana.html')).href);
   assert.equal(await page.locator('meta[name=viewport]').getAttribute('content'),reference,'Match Marginalia browser-owned viewport');
   // Nonzero legacy safe-area variables must not add a second reserved strip.
   await page.addStyleTag({content:':root { --safe-t:47px; --safe-b:34px; }'});
   for(const [width,height] of [[390,844],[390,664],[390,844],[844,390],[320,568]]){
    await page.setViewportSize({width,height});
    for(const screen of ['home','practice','canon']){
     await page.evaluate(name=>navigate(name),screen);
     const box=await page.evaluate(()=>{
      const app=document.getElementById('app'),nav=document.querySelector('.bottom-nav'),content=document.getElementById('content');
      const a=app.getBoundingClientRect(),n=nav.getBoundingClientRect(),c=content.getBoundingClientRect();
      content.scrollTop=content.scrollHeight;
      return {position:getComputedStyle(app).position,top:a.top,bottom:a.bottom,left:a.left,right:a.right,navBottom:n.bottom,navHeight:n.height,contentBottom:c.bottom,navTop:n.top,padding:getComputedStyle(nav).paddingBottom,status:getComputedStyle(document.querySelector('.status-bar')).display,height:innerHeight,width:innerWidth};
     });
     assert.equal(box.position,'fixed');assert.equal(box.top,0);assert.equal(box.left,0);
     assert(Math.abs(box.bottom-box.height)<1&&Math.abs(box.right-box.width)<1,'Shell touches every edge');
     assert(Math.abs(box.navBottom-box.height)<1,'No gap below navigation');
     assert(Math.abs(box.contentBottom-box.navTop)<1,'No gap above navigation');
     assert.equal(box.padding,'0px');assert.equal(box.status,'none');assert.equal(box.navHeight,72,'No duplicate safe-area reservation');
    }
    await page.locator('#screen-canon .topic-open').first().click();
    const reader=await page.locator('#topic-reader').evaluate(d=>{const r=d.getBoundingClientRect(),f=d.querySelector('.reader-footer').getBoundingClientRect();return {top:r.top,bottom:r.bottom,footer:f.bottom,height:innerHeight,headPadding:getComputedStyle(d.querySelector('.reader-head')).paddingTop,footPadding:getComputedStyle(d.querySelector('.reader-footer')).paddingBottom};});
    assert.equal(reader.top,0);assert(Math.abs(reader.bottom-reader.height)<1&&Math.abs(reader.footer-reader.height)<1);
    assert(Number.parseFloat(reader.headPadding)<=12&&Number.parseFloat(reader.footPadding)<=10,'Reader avoids duplicate safe areas');
    await page.locator('.reader-close').click();
   }
   console.log('PASS '+engine.name()+': Marginalia viewport policy, pinned shell and reader, no duplicate safe-area spacing, resize and rotation.');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
