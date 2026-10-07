const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{
   const page=await browser.newPage({viewport:{width:402,height:874}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve('jyotish_sadhana.html')).href);
   const original=await page.locator('.topic-source .topic-page').allTextContents();
   assert(original.length>=35&&original.length<60,'Thin topics consolidated');
   assert.deepEqual(errors,[],'Every outline covers its collection');
   const sourceHTML=fs.readFileSync('jyotish_sadhana.html','utf8');
   async function verifyContent(){
    const result=await page.evaluate(html=>{
     const source=new DOMParser().parseFromString(html,'text/html'),issues=[];
     for(const node of document.querySelectorAll('[data-topic-origin]')){
      const [key,index]=node.dataset.topicOrigin.split(':');let nodes;
      if(key.endsWith('-intro')){
       const screen=key.replace('-intro','');
       nodes=Array.from(source.querySelector('#screen-'+screen+' .wit-wrap').children).filter(n=>!n.matches('.screen-header,.wit-tabs,.wit-section'));
      }else{
       const root=source.getElementById(key);nodes=Array.from(key.startsWith('screen-')?root.querySelector('.wit-wrap').children:root.children);
      }
      if(node.textContent!==nodes[Number(index)].textContent)issues.push(node.dataset.topicOrigin);
     }
     const roots=Array.from(source.querySelectorAll('.wit-section,.practice-session,#screen-canon .wit-wrap,#screen-deities .wit-wrap'));
     let expected=roots.reduce((sum,root)=>sum+Array.from(root.children).filter(n=>!n.matches('.screen-header')).length,0);
     for(const id of ['witness','sutras'])expected+=Array.from(source.querySelector('#screen-'+id+' .wit-wrap').children).filter(n=>!n.matches('.screen-header,.wit-tabs,.wit-section')).length;
     return {issues,count:document.querySelectorAll('[data-topic-origin]').length,expected};
    },sourceHTML);
    assert.deepEqual(result.issues,[],'All original passages preserved verbatim');assert.equal(result.count,result.expected,'Every original passage covered exactly once');
   }
   await verifyContent();
   await page.evaluate(()=>{navigate('practice');switchPracticeTab('morning');});
   const morning=page.locator('#ps-morning');
   assert(await morning.locator('.time-hdr').isVisible(),'Dawn and duration are directly visible');
   assert(await morning.locator('.step-seq').isVisible(),'Practice sequence is directly visible');
   assert(await morning.locator('.topic-inline .x-body').first().isVisible(),'Short breathing instructions require no tap');
   assert.equal(await morning.locator('.topic-open').count(),2,'Only the two detailed mantras need reader cards');
   assert(!(await morning.locator('.topic-grid').innerText()).includes('Brahma Muhurta'));
   await page.evaluate(()=>{navigate('sutras');switchSutraTab('all');});
   assert.equal(await page.locator('#ss-all .topic-open').count(),0);
   assert(await page.locator('#ss-all table').isVisible(),'Small reference table is directly visible');
   for(const [width,height] of [[320,640],[402,874],[844,390],[1440,1000]]){
    await page.setViewportSize({width,height});
    for(const screen of ['home','witness','practice','sutras','deities','canon','field','more']){
     await page.evaluate(id=>navigate(id),screen);
     const tabs=await page.locator('.screen.active .wit-tab,.screen.active .session-tab').all();
     for(const tab of tabs) {await tab.click();assert(await page.locator('#content').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Inline content fits '+screen+' at '+width);}
     assert(await page.locator('#content').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Screen fits '+screen+' at '+width);
    }
    await page.evaluate(()=>navigate('canon'));
    const library=page.locator('#screen-canon .topic-library');
    assert.equal(await library.locator('.topic-open').count(),6);
    await library.locator('.topic-pager button').last().click();
    const opener=library.locator('.topic-open').first();
    const label=await opener.locator('strong').textContent();await opener.click();
    assert.equal(await page.locator('.reader-title').textContent(),label);
    const count=await page.locator('.reader-jump option').count();
    for(let index=0;index<count;index++){
     await page.locator('.reader-jump select').selectOption(String(index));
     const box=await page.locator('#topic-reader').evaluate(d=>{const r=d.getBoundingClientRect(),s=d.querySelector('.reader-scroll'),f=d.querySelector('.reader-footer').getBoundingClientRect();return {bottom:r.bottom,footer:f.bottom,overflow:s.scrollWidth-s.clientWidth,visible:s.clientHeight};});
     assert(Math.abs(box.bottom-height)<1&&Math.abs(box.footer-height)<2,engine.name()+' reader reaches bottom');
     assert(box.overflow<=1,engine.name()+' no reader overflow at '+width+' topic '+index);
     assert(box.visible>50,'Reading area remains usable in landscape');
    }
    await page.locator('.reader-prev').click();assert.equal(await page.locator('.reader-jump select').inputValue(),String(count-2));
    await page.locator('.reader-next').click();assert(await page.locator('.reader-next').isDisabled());
    await page.locator('.reader-close').click();assert(await opener.evaluate(e=>e===document.activeElement));
    await library.locator('input').fill('not-a-matching-topic');assert(await library.locator('.topic-empty').isVisible());
    await library.locator('input').fill('Yoga');assert((await library.locator('.topic-open').count())>0);
    await library.locator('input').fill('');
   }
   // Walk every collection and every topic, including non-card notes and tables.
   await page.setViewportSize({width:320,height:740});
   const roots=await page.locator('.topic-library').evaluateAll(es=>es.map((e,i)=>{e.dataset.testIndex=i;return {index:i,screen:e.closest('.screen').id,section:e.closest('.wit-section,.practice-session')?.id};}));
   let visited=0;
   for(const root of roots){
    await page.evaluate(r=>{navigate(r.screen.replace('screen-',''));if(r.section){const section=document.getElementById(r.section);section.parentElement.querySelectorAll('.wit-section,.practice-session').forEach(e=>e.classList.remove('active'));section.classList.add('active');}},root);
    const library=page.locator('.topic-library[data-test-index="'+root.index+'"]');
    await library.locator('.topic-open').first().click();
    const count=await page.locator('.reader-jump option').count();
    for(let i=0;i<count;i++){
     await page.locator('.reader-jump select').selectOption(String(i));
     assert.equal(await page.locator('.reader-article > .topic-page').count(),1);
     const topicTitle=await page.locator('.reader-title').textContent();
     assert(topicTitle.length<=32&&!topicTitle.includes('…'),'Curated concise title: '+topicTitle);
     assert((await page.locator('.reader-article').innerText()).trim().length>300,'No empty or thin reader topic: '+topicTitle);
     assert(await page.locator('.reader-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'No overflow in collection '+root.index+' topic '+i);
     visited++;
    }
    await page.keyboard.press('Escape');assert(!(await page.locator('#topic-reader').isVisible()));
   }
   assert.equal(visited,original.length,'Every preserved topic is reachable');
   const after=await page.locator('.topic-source .topic-page').allTextContents();assert.deepEqual(after.sort(),original.sort(),'Reader moves preserve every topic');
   await verifyContent();
   assert.deepEqual(errors,[]);
   await page.evaluate(()=>{navigate('practice');switchPracticeTab('morning');});await page.setViewportSize({width:402,height:874});await page.screenshot({path:'/tmp/sadhana-morning-'+engine.name()+'.png'});
   await page.evaluate(()=>navigate('canon'));await page.setViewportSize({width:402,height:874});await page.screenshot({path:'/tmp/sadhana-topics-'+engine.name()+'.png'});
   await page.locator('#screen-canon .topic-open').first().click();await page.screenshot({path:'/tmp/sadhana-reader-'+engine.name()+'.png'});
   console.log('PASS '+engine.name()+': '+visited+' topics preserved and reachable; search, pagination, jump, previous/next, focus return, Escape and four viewport sizes.');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
