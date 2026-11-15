const assert=require('node:assert/strict');
const fs=require('node:fs');const crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const timing=JSON.parse(fs.readFileSync('docs/kena-audio-timing.json'));
 assert.equal(timing.clips.length,36);
 const expected=['shanti',...require('./fixtures/kena_individual_mantras.json').map(v=>v.number),'closing-shanti'];
 assert.deepEqual(timing.clips.map(c=>c.number),expected);
 assert.equal(timing.alignmentStatus,'aligned');
 assert.equal(timing.clips[0].start,0);
 assert.equal(timing.clips.at(-1).end,timing.recording.duration);
 for(const [i,c] of timing.clips.entries()){
  assert(c.start>=0&&c.end>c.start&&c.end<=725.268,c.number+' valid bounds');
  if(i)assert(c.start>=timing.clips[i-1].end-.001,c.number+' nonoverlap');
  assert(c.phrases.length>0);
  for(const p of c.phrases)assert(p.start>=c.start&&p.end<=c.end&&p.end>p.start&&p.sanskrit&&p.iast,c.number+' phrase');
 }
 const source=fs.readFileSync('kena_upanishad.html');
 const sourceVerses={};
 for(const match of source.toString().matchAll(/<div class="class-item" data-mantra="([^"]+)">[\s\S]*?<div class="(?:v|m)-sanskrit"[^>]*>([\s\S]*?)<\/div>/g))sourceVerses[match[1]]=match[2].replace(/<[^>]*>/g,'').replace(/&nbsp;|&#160;/g,' ');
 assert.equal(Object.keys(sourceVerses).length,34);
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),timing.sourceHtmlSha256,'Original HTML unchanged');
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage();const errors=[], requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://**',r=>{requests.push(r.request().url());r.abort()});
  await page.route('https://**',r=>{requests.push(r.request().url());r.abort()});
  await page.goto('file://'+process.cwd()+'/kena_upanishad_audio.html',{waitUntil:'load'});
  await page.locator('#home-read').click();
  assert.equal(await page.locator('#reading-picker option').count(),36);
  assert.equal(await page.locator('#reading-number').textContent(),'Śānti');
  assert.equal(await page.locator('#screen-read .recitation-speed').inputValue(),'0.75');
  await page.locator('#reading-study').click();
  assert(await page.locator('#study-passage .pada-word').count()>40,'Complete invocation pada-viccheda');
  await page.locator('#study-passage .pada-word').first().click();
  assert(await page.locator('#word-dialog').isVisible());
  await page.locator('#word-close').click();
  await page.locator('#study-back').click();
  await page.waitForFunction(()=>document.getElementById('recitation-audio').readyState>=1);
  const audioHash=crypto.createHash('sha256').update(fs.readFileSync('kena_upanishad.opus')).digest('hex');
  assert.equal(audioHash,timing.audioSha256);
  const embedded=fs.readFileSync('kena_upanishad_audio.html','utf8').match(/id="recitation-audio"[^>]*src="data:audio\/ogg;codecs=opus;base64,([^"]+)"/)[1];
  assert.equal(crypto.createHash('sha256').update(Buffer.from(embedded,'base64')).digest('hex'),audioHash,'Embedded audio is byte-for-byte identical to the recording');
  const bytes=await page.evaluate(()=>{
   const src=document.getElementById('recitation-audio').src.split(',')[1];return atob(src).length;
  });assert.equal(bytes,fs.statSync('kena_upanishad.opus').size);
  for(let i=0;i<timing.clips.length;i++){
   await page.selectOption('#reading-picker',String(i));
   const clip=timing.clips[i];
   assert.equal(await page.evaluate(()=>readingDeck[readingIndex].number),clip.number);
   assert.equal(await page.locator('#reading-copy .recitation-line').count(),clip.phrases.length*2);
   assert.equal(await page.locator('#screen-read .recitation-panel').count(),1);
   if(clip.number.includes('.')){
    const sourceVerse=sourceVerses[clip.number];
    const actual=await page.locator('#reading-copy .v-sanskrit,#reading-copy .m-sanskrit').textContent();
    const normalize=t=>t.replace(/[\sॐ।॥]/gu,'');
    assert.equal(normalize(actual),normalize(sourceVerse),clip.number+' preserves every Sanskrit character');
    await page.locator('#reading-study').click();
    const padaFixture=require('./fixtures/kena_pada_sequences.json').find(v=>v.number===clip.number).sanskrit;
    const expectedPadas=clip.number==='1.1'?padaFixture.slice(1):padaFixture;
    assert.deepEqual(await page.locator('#study-passage .pada-sanskrit .pada-word').allTextContents(),expectedPadas,clip.number+' preserves grammatical word division and every occurrence');
    await page.locator('#study-back').click();
   }
  }
  await page.selectOption('#reading-picker','1');
  const slider=page.locator('#screen-read .recitation-speed');
  for(const value of ['0.25','1','0.75']){
   await slider.fill(value);await slider.dispatchEvent('input');
   assert.equal(await page.evaluate(()=>document.getElementById('recitation-audio').playbackRate),Number(value));
  }
  await page.locator('#screen-read .recitation-play').click();
  await page.waitForFunction(()=>!document.getElementById('recitation-audio').paused);
  assert(await page.evaluate(()=>Math.abs(document.getElementById('recitation-audio').currentTime-KENA_AUDIO.clips[1].start)<2));
  await page.evaluate(()=>document.getElementById('recitation-audio').currentTime=KENA_AUDIO.clips[1].end-.08);
  await page.waitForFunction(()=>document.getElementById('recitation-audio').paused);
  await page.locator('#screen-read .recitation-repeat').check();
  await page.locator('#screen-read .recitation-restart').click();
  await page.evaluate(()=>document.getElementById('recitation-audio').currentTime=KENA_AUDIO.clips[1].end-.02);
  await page.waitForFunction(()=>document.getElementById('recitation-audio').currentTime<KENA_AUDIO.clips[1].start+1);
  await page.locator('#screen-read .recitation-repeat').uncheck();
  await page.locator('#screen-read .recitation-continuous').check();
  await page.evaluate(()=>document.getElementById('recitation-audio').currentTime=KENA_AUDIO.clips[1].end-.02);
  await page.waitForFunction(()=>document.getElementById('reading-number').textContent==='1.2');
  await page.locator('#reading-study').click();
  assert.equal(await page.locator('#study-passage .recitation-panel').count(),1);
  await page.locator('#study-passage .recitation-play').click();
  assert(await page.evaluate(()=>document.getElementById('recitation-audio').paused));
  for(const [width,height] of [[390,844],[320,568],[1440,900]]){
   await page.setViewportSize({width,height});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert(await page.locator('#study-passage .recitation-play').isVisible());
  }
  await page.locator('#study-back').click();
  await page.selectOption('#reading-picker',String(timing.clips.length-1));
  await page.locator('#reading-study').click();
  assert(await page.locator('#study-passage .pada-word').count()>44,'Closing invocation word study');
  assert((await page.locator('#study-passage').textContent()).includes('हरिः'));
  await page.locator('#study-back').click();
  await page.locator('#screen-read .recitation-repeat').check();
  await page.locator('#screen-read .recitation-play').click();
  await page.evaluate(()=>document.getElementById('recitation-audio').currentTime=KENA_AUDIO.clips.at(-1).end-.02);
  await page.waitForFunction(()=>document.getElementById('recitation-audio').currentTime<KENA_AUDIO.clips.at(-1).start+1);
  await page.evaluate(()=>navigate('home'));
  assert(await page.evaluate(()=>document.getElementById('recitation-audio').paused),'Leaving the reader pauses playback');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[],'Fully offline, no external resources requested');
  console.log('PASS: 36 recitations, embedded audio, speeds, boundaries, repeat, continuation, study view, mobile layouts, offline operation');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
