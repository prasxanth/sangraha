const assert=require('node:assert/strict');
const fs=require('node:fs');const crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const timing=JSON.parse(fs.readFileSync('docs/kena-audio-timing.json'));
 assert.equal(timing.clips.length,36);
 const review=require('../scripts/kena_audio_pipeline/checkpoints/reviewed_recitation.json');
 const reviewByNumber=Object.fromEntries(review.clips.map(c=>[c.number,c]));
 const comparable=t=>t.replace(/[\s।॥|]/gu,'');
 const expected=['shanti',...require('./fixtures/kena_individual_mantras.json').map(v=>v.number),'closing-shanti'];
 assert.deepEqual(timing.clips.map(c=>c.number),expected);
 assert.equal(timing.alignmentStatus,'aligned');
 assert.equal(timing.clips[0].start,0);
 assert.equal(timing.clips.at(-1).end,timing.recording.duration);
 for(const [i,c] of timing.clips.entries()){
  assert(c.start>=0&&c.end>c.start&&c.end<=725.268,c.number+' valid bounds');
  if(i)assert(c.start>=timing.clips[i-1].end-.001,c.number+' nonoverlap');
  assert(c.phrases.length>0);
  assert.deepEqual(c.phrases,reviewByNumber[c.number].phrases,c.number+' keeps reviewed recitation breaks and wording');
  c.phrases.forEach((p,j)=>{
   const last=j===c.phrases.length-1;
   assert(p.sanskrit.endsWith(last?' ॥':' ।'),c.number+' Sanskrit marker follows the recording pause');
   assert(!/[।॥]/u.test(p.sanskrit.slice(0,-1)),c.number+' has no inherited punctuation inside a spoken phrase');
   const marker=last?'||':'|';assert(p.iast.endsWith(' '+marker));
   assert(!p.iast.slice(0,-marker.length).includes('|'),c.number+' IAST marker matches Sanskrit');
  });
  for(const p of c.phrases)assert(p.start>=c.start&&p.end<=c.end&&p.end>p.start&&p.sanskrit&&p.iast,c.number+' phrase');
 }
 const source=fs.readFileSync('kena_upanishad.html');
 const sourceVerses={},sourceIast={};
 for(const match of source.toString().matchAll(/<div class="class-item" data-mantra="([^"]+)">[\s\S]*?<div class="(?:v|m)-sanskrit"[^>]*>([\s\S]*?)<\/div>/g))sourceVerses[match[1]]=match[2].replace(/<[^>]*>/g,'').replace(/&nbsp;|&#160;/g,' ');
 for(const match of source.toString().matchAll(/<div class="class-item" data-mantra="([^"]+)">[\s\S]*?<div class="(?:v|m)-translit"[^>]*>([\s\S]*?)<\/div>/g))sourceIast[match[1]]=match[2].replace(/<[^>]*>/g,'').replace(/&nbsp;|&#160;/g,' ');
 assert.equal(Object.keys(sourceVerses).length,34);
 assert.equal(Object.keys(sourceIast).length,34);
 function expectedRecitation(number,field){
  const sourceText=field==='sanskrit'?sourceVerses[number]:sourceIast[number];
  let text=comparable(number==='1.1'?sourceText.replace(/^ॐ\s*|^oṃ\s*/u,''):sourceText);
  for(const change of reviewByNumber[number].sourceReplacements){
   const before=comparable(change[field].before),after=comparable(change[field].after);
   assert.equal(text.split(before).length-1,1,number+' declares each spoken-form change exactly once');
   text=text.replace(before,after);
  }
  return text;
 }
 const v13=timing.clips.find(c=>c.number==='1.3');
 assert.deepEqual(v13.phrases.map(p=>p.sanskrit),[
  'न तत्र चक्षुर्गच्छति न वाग्गच्छति ।','नो मनो न विद्मः ।','न विजानीमो यथैतदनुशिष्यात् ।',
  'अन्यदेव तद्विदितादथो अविदितादधि ।','इति शुश्रुम पूर्वेषां ये नस्तद्व्याचचक्षिरे ॥'
 ]);
 assert.equal(v13.phrases[1].iast,'no mano na vidmaḥ |');
 assert.equal(timing.clips.find(c=>c.number==='1.2').phrases[2].start,84.58,'1.2 includes the whole cakṣuṣaḥ phrase');
 const measuredPauses=require('../scripts/kena_audio_pipeline/checkpoints/pauses.json');
 for(const c of timing.clips)for(const p of c.phrases.slice(0,-1)){
  assert(measuredPauses.some(gap=>gap.start<=p.end&&p.end<=gap.end),c.number+' internal marker is placed within a measured audio pause');
 }
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),timing.sourceHtmlSha256,'Original HTML unchanged');
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage();const errors=[], requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://**',r=>{requests.push(r.request().url());r.abort()});
  await page.route('https://**',r=>{requests.push(r.request().url());r.abort()});
  await page.goto('file://'+process.cwd()+'/kena_upanishad_audio.html',{waitUntil:'load'});
  await page.locator('#home-read').click();
  await page.evaluate(()=>document.fonts.ready);
  assert.deepEqual(await page.evaluate(()=>KENA_AUDIO),timing,'UI-only changes preserve all embedded recitation data');
  assert(await page.evaluate(()=>Array.from(document.fonts).some(font=>font.family.includes('Tiro Devanagari Sanskrit')&&font.status==='loaded')),'Original Sanskrit font loads offline');
  assert((await page.locator('#reading-copy .v-sanskrit').evaluate(e=>getComputedStyle(e).fontFamily)).includes('Tiro Devanagari Sanskrit'));
  const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const documentRoot=(await cdp.send('DOM.getDocument')).root.nodeId;
  const fontNode=(await cdp.send('DOM.querySelector',{nodeId:documentRoot,selector:'#reading-copy .v-sanskrit .recitation-line:nth-child(2)'})).nodeId;
  const actualFonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId:fontNode})).fonts;
  assert(actualFonts.some(f=>/Tiro.*Devanagari.*Sanskrit/i.test(f.familyName)&&f.isCustomFont&&f.glyphCount>0),'Sanskrit glyphs actually render in embedded Tiro, rather than a fallback');
  await cdp.detach();
  // Wait for asynchronous seek/play setup before testing another playback action.
  async function waitForPlayback(){
   await page.waitForFunction(()=>{
    const a=document.getElementById('recitation-audio'),clip=KENA_AUDIO.clips.find(c=>c.number===audioEdition.state.number);
    return clip&&!a.paused&&!a.seeking&&a.readyState>=2&&document.getElementById('audio-status').textContent==='Playing '+clip.label;
   });
  }
  async function openOptions(scope='#screen-read'){
   const toggle=page.locator(scope+' .recitation-toggle');
   if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
   assert(await page.locator(scope+' .recitation-settings').isVisible());
  }
  assert(!(await page.locator('#screen-read .recitation-settings').isVisible()),'Advanced controls are collapsed initially');
  assert.equal(await page.locator('#screen-read .recitation-main button:visible').count(),3,'Play, restart and expansion affordance only');
  assert.equal(await page.locator('.reading-text .recitation-panel').count(),0,'Audio toolbar takes no text-column space');
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
  const editionHtml=fs.readFileSync('kena_upanishad_audio.html','utf8');
  const embeddedFontHashes=new Set(Array.from(editionHtml.matchAll(/url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/g),m=>crypto.createHash('sha256').update(Buffer.from(m[1],'base64')).digest('hex')));
  for(const asset of Object.values(require('../assets/kena_audio/fonts/manifest.json').assets))assert(embeddedFontHashes.has(asset.sha256),'Original font asset is embedded byte-for-byte');
  const embedded=editionHtml.match(/id="recitation-audio"[^>]*src="data:audio\/ogg;codecs=opus;base64,([^"]+)"/)[1];
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
   assert.equal(await page.locator('#screen-read .recitation-toggle').getAttribute('aria-expanded'),'false','Changing cards restores compact controls');
   if(clip.number.includes('.')){
    const actual=await page.locator('#reading-copy .v-sanskrit,#reading-copy .m-sanskrit').textContent();
    assert.equal(comparable(actual),expectedRecitation(clip.number,'sanskrit'),clip.number+' changes only declared spoken forms');
    const iast=await page.locator('#reading-copy .v-translit,#reading-copy .m-translit').textContent();
    assert.equal(comparable(iast),expectedRecitation(clip.number,'iast'),clip.number+' IAST matches the same declared forms');
    await page.locator('#reading-study').click();
    const padaFixture=require('./fixtures/kena_pada_sequences.json').find(v=>v.number===clip.number).sanskrit;
    const expectedPadas=clip.number==='1.1'?padaFixture.slice(1):padaFixture;
    assert.deepEqual(await page.locator('#study-passage .pada-sanskrit .pada-word').allTextContents(),expectedPadas,clip.number+' preserves grammatical word division and every occurrence');
    await page.locator('#study-back').click();
   }
  }
  await page.selectOption('#reading-picker','3');
  for(const [width,height] of [[390,844],[320,568],[844,390],[1440,900]]){
   await page.setViewportSize({width,height});
   const geometry=await page.evaluate(()=>{
    const panel=document.querySelector('#screen-read .recitation-panel'),card=panel.closest('.reading-card'),art=card.querySelector('.reading-art'),text=card.querySelector('.reading-text'),copy=card.querySelector('.reading-copy');
    const p=panel.getBoundingClientRect(),c=card.getBoundingClientRect(),a=art.getBoundingClientRect();
    return {absolute:getComputedStyle(panel).position==='absolute',right:c.right-p.right,top:p.top-c.top,insideArtwork:p.bottom<=a.bottom,copyHeight:copy.clientHeight,copyInset:copy.getBoundingClientRect().top-text.getBoundingClientRect().top};
   });
   assert(geometry.absolute&&geometry.right>=0&&geometry.right<=15&&geometry.top>=0&&geometry.top<=15,'Toolbar sits at card top right');
   assert(geometry.insideArtwork&&geometry.copyInset<=26&&geometry.copyHeight>=70,'Controls leave the reading text area available');
   await openOptions();
   const popup=await page.locator('#screen-read .recitation-settings').evaluate(el=>{
    const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,onTop:!!document.elementFromPoint(r.x+20,r.y+20)?.closest('.recitation-settings')};
   });
   assert(popup.x>=10&&popup.y>=10&&popup.right<=width-10&&popup.bottom<=height-10&&popup.onTop,'Expanded controls fit on screen and escape card clipping');
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#screen-read .recitation-toggle').getAttribute('aria-expanded'),'false');
   assert(await page.locator('#screen-read .recitation-toggle').evaluate(el=>el===document.activeElement),'Escape restores keyboard focus');
   await openOptions();await page.locator('#hdr-time').click();
   assert(!(await page.locator('#screen-read .recitation-settings').isVisible()),'Outside tap closes options');
  }
  await page.setViewportSize({width:320,height:568});
  await page.selectOption('#reading-picker',String(timing.clips.length-1));
  assert(await page.evaluate(()=>{
   const toolbar=document.querySelector('#screen-read .recitation-main').getBoundingClientRect(),label=document.getElementById('reading-number').getBoundingClientRect();
   return label.right+4<=toolbar.left;
  }),'Closing invocation label does not overlap the compact controls on a narrow phone');
  await page.setViewportSize({width:1440,height:900});
  await page.selectOption('#reading-picker','1');
  await openOptions();
  const slider=page.locator('#screen-read .recitation-speed');
  for(const value of ['0.25','1','0.75']){
   await slider.fill(value);await slider.dispatchEvent('input');
   assert.equal(await page.evaluate(()=>document.getElementById('recitation-audio').playbackRate),Number(value));
  }
  await page.locator('#screen-read .recitation-play').click();
  await waitForPlayback();
  assert(await page.evaluate(()=>Math.abs(document.getElementById('recitation-audio').currentTime-KENA_AUDIO.clips[1].start)<2));
  // Seek to the boundary directly: headless audio output can have a stalled hardware clock.
  await page.evaluate(()=>document.getElementById('recitation-audio').currentTime=KENA_AUDIO.clips[1].end);
  await page.waitForFunction(()=>document.getElementById('recitation-audio').paused);
  assert(await page.evaluate(()=>Math.abs(document.getElementById('recitation-audio').currentTime-KENA_AUDIO.clips[1].end)<.001),'Verse stop clamps playback to its boundary');
  await page.locator('#screen-read .recitation-repeat').check();
  await page.locator('#screen-read .recitation-restart').click();
  await waitForPlayback();
  await page.evaluate(()=>document.getElementById('recitation-audio').currentTime=KENA_AUDIO.clips[1].end-.02);
  await page.waitForFunction(()=>document.getElementById('recitation-audio').currentTime<KENA_AUDIO.clips[1].start+1);
  await waitForPlayback();
  await page.locator('#screen-read .recitation-repeat').uncheck();
  await page.locator('#screen-read .recitation-continuous').check();
  await page.evaluate(()=>document.getElementById('recitation-audio').currentTime=KENA_AUDIO.clips[1].end-.02);
  await page.waitForFunction(()=>document.getElementById('reading-number').textContent==='1.2');
  await waitForPlayback();
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
  await openOptions();
  await page.locator('#screen-read .recitation-repeat').check();
  await page.locator('#screen-read .recitation-play').click();
  await waitForPlayback();
  await page.evaluate(()=>document.getElementById('recitation-audio').currentTime=KENA_AUDIO.clips.at(-1).end-.02);
  await page.waitForFunction(()=>document.getElementById('recitation-audio').currentTime<KENA_AUDIO.clips.at(-1).start+1);
  await waitForPlayback();
  await page.evaluate(()=>navigate('home'));
  assert(await page.evaluate(()=>document.getElementById('recitation-audio').paused),'Leaving the reader pauses playback');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[],'Fully offline, no external resources requested');
  console.log('PASS: 36 recitations, embedded audio, speeds, boundaries, repeat, continuation, study view, compact responsive controls, original offline fonts, offline operation');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
