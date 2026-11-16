/* The recording's opening Om belongs to the invocation, not a second Om at 1.1. */
const firstMantra=document.querySelector('[data-mantra="1.1"]');
firstMantra.querySelector('.v-sanskrit').textContent=firstMantra.querySelector('.v-sanskrit').textContent.replace(/^ॐ\s*/, '');
firstMantra.querySelector('.v-translit').textContent=firstMantra.querySelector('.v-translit').textContent.replace(/^oṃ\s*/, '');
const firstWord=firstMantra.querySelector('table.wbw tbody tr');
if(firstWord?.cells[0].textContent.trim()==='ॐ')firstWord.remove();
KENA_PHRASE_TRANSLATIONS['1.1']=KENA_PHRASE_TRANSLATIONS['1.1'].slice(1).map(p=>({...p,start:p.start-1,end:p.end-1}));
/* Independently embedded sections avoid long-stream Ogg seek drift. */
const audioEdition = (() => {
 const audio = document.getElementById('recitation-audio');
 let selected = null, repeat = false, continuous = false, frame = 0, pendingSeek = null;
 let rate = .75, panelSerial = 0, sourceNumber = null, playSerial = 0, sourceUrl = null;
 const recordingTime = () => audio.currentTime + (KENA_AUDIO_SOURCES[sourceNumber]?.offset || 0);
 function loadSection(number, restart=false) {
  if(sourceNumber===number&&!restart)return;
  audio.pause();sourceNumber=number;pendingSeek=null;
  const bytes=Uint8Array.from(atob(KENA_AUDIO_SOURCES[number].src.split(',')[1]),c=>c.charCodeAt(0));
  const previous=sourceUrl;
  sourceUrl=URL.createObjectURL(new Blob([bytes],{type:'audio/webm;codecs=opus'}));
  audio.src=sourceUrl;audio.load();
  if(previous)URL.revokeObjectURL(previous);
 }
 const format = seconds => `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
 const clipFor = number => KENA_AUDIO.clips.find(c => c.number === number);
 function status(text,error=false) { const output=document.getElementById('audio-status');output.textContent=text;output.classList.toggle('audio-error',error); }
 function refresh(visibleOnly=false) {
  const clip=selected, elapsed=clip ? Math.max(0,Math.min(recordingTime()-clip.start,clip.end-clip.start)) : 0;
  document.querySelectorAll('.recitation-panel').forEach(panel => {
   if(visibleOnly&&!panel.closest('.screen.active'))return;
   const number=panel.dataset.number, item=clipFor(number), active=clip && clip.number===number;
   panel.querySelector('.recitation-play').textContent=active&&!audio.paused?'Pause':'Play';
   panel.querySelector('.recitation-play').setAttribute('aria-label',(active&&!audio.paused?'Pause ':'Play ')+item.label);
   panel.querySelector('.recitation-play').setAttribute('aria-pressed',String(active&&!audio.paused));
   const seek=panel.querySelector('.recitation-seek');seek.max=item.end-item.start;
   seek.value=active?elapsed:0;
   seek.setAttribute('aria-valuetext',format(active?elapsed:0)+' of '+format(item.end-item.start));
   panel.querySelector('.recitation-time').textContent=format(active?elapsed:0)+' / '+format(item.end-item.start);
   panel.querySelector('.recitation-speed').value=rate;
   panel.querySelector('.recitation-rate').textContent=rate.toFixed(2).replace(/0$/,'')+'×';
   panel.querySelector('.recitation-repeat').checked=repeat;
   panel.querySelector('.recitation-continuous').checked=continuous;
  });
  document.querySelectorAll('[data-audio-phrase]').forEach(line=>{
   const phrase=clipFor(line.dataset.audioNumber)?.phrases[Number(line.dataset.audioPhrase)];
   line.classList.toggle('reciting',!!(phrase&&selected?.number===line.dataset.audioNumber&&!audio.paused&&recordingTime()>=phrase.start&&recordingTime()<phrase.end));
  });
 }
 function seekTo(time) {
  time=Math.max(0,time-KENA_AUDIO_SOURCES[sourceNumber].offset);
  if(time===0){
   const wasPlaying=!audio.paused;loadSection(sourceNumber,true);
   if(wasPlaying)audio.play().catch(()=>status('Tap Play to resume.'));
   return;
  }
  if(audio.readyState===0){pendingSeek=time;audio.load();}else audio.currentTime=time;
 }
 async function play(number, restart=false) {
  const clip=clipFor(number);if(!clip)return;
  const changed=selected?.number!==number;
  const serial=++playSerial;
  if(changed){audio.pause();selected=clip;}
  // Start and restart by loading the short source at its natural beginning.
  loadSection(number,changed||restart||recordingTime()<clip.start||recordingTime()>=clip.end-.04);
  audio.playbackRate=rate;
  try { await audio.play(); if(serial===playSerial)status('Playing '+clip.label); }
  catch(error){if(serial===playSerial)status('Playback could not start. Tap Play to try again.',true);}
  refresh();
 }
 function finish() {
  if(!selected)return;
  if(repeat){play(selected.number,true);return;}
  if(continuous){
   const index=KENA_AUDIO.clips.indexOf(selected), next=KENA_AUDIO.clips[index+1];
   if(next){openMantra(next.number,false);play(next.number,true);return;}
  }
  audio.pause();status('Finished '+selected.label);refresh();
 }
 function tick(){
  cancelAnimationFrame(frame);
  if(!audio.paused){if(selected&&recordingTime()>=selected.end-.025)finish();refresh(true);if(!audio.paused)frame=requestAnimationFrame(tick);}
 }
 function positionOptions(panel){
  const options=panel.querySelector('.recitation-settings');if(options.hidden)return;
  const anchor=panel.querySelector('.recitation-toggle').getBoundingClientRect();
  const width=Math.min(320,innerWidth-24);options.style.width=width+'px';
  const desired=Math.min(310,options.scrollHeight), below=innerHeight-anchor.bottom-20, above=anchor.top-20;
  const upward=below<desired&&above>below, available=Math.max(80,upward?above:below);
  options.style.maxHeight=available+'px';
  const height=Math.min(desired,available);
  options.style.left=Math.max(12,Math.min(anchor.right-width,innerWidth-width-12))+'px';
  options.style.top=Math.max(12,Math.min(upward?anchor.top-height-8:anchor.bottom+8,innerHeight-height-12))+'px';
 }
 function setOptions(panel,open,restoreFocus=false){
  panel.querySelector('.recitation-settings').hidden=!open;
  panel.querySelector('.recitation-toggle').setAttribute('aria-expanded',String(open));
  panel.classList.toggle('is-expanded',open);
  if(open)positionOptions(panel);
  if(restoreFocus)panel.querySelector('.recitation-toggle').focus({preventScroll:true});
 }
 function closeOptions(){document.querySelectorAll('.recitation-panel.is-expanded').forEach(panel=>setOptions(panel,false));}
 function mount(container, number) {
  if(!clipFor(number))return;
  const old=container.querySelector('.recitation-panel');
  const wasOpen=old?.dataset.number===number&&old.classList.contains('is-expanded');
  container.querySelectorAll('.recitation-panel').forEach(e=>e.remove());
  const panel=document.createElement('section');panel.className='recitation-panel';panel.dataset.number=number;
  panel.setAttribute('aria-label',clipFor(number).label+' audio');
  const optionsId='recitation-options-'+(++panelSerial);
  panel.innerHTML=`<div class="recitation-main"><button type="button" class="deck-button recitation-play">Play</button><button type="button" class="deck-button recitation-restart" aria-label="Restart ${clipFor(number).label}" title="Restart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6"/></svg></button><button type="button" class="deck-button recitation-toggle" aria-label="More audio controls" title="More audio controls" aria-expanded="false" aria-controls="${optionsId}"><svg class="recitation-more-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></button></div>
   <div class="recitation-settings" id="${optionsId}" role="region" aria-label="Audio options for ${clipFor(number).label}" hidden>
   <div class="recitation-heading">${clipFor(number).label}<output class="recitation-time"></output></div>
   <label class="recitation-progress">Verse position<input class="recitation-seek" type="range" min="0" step="0.05" value="0"></label>
   <label class="recitation-speed-label">Speed <input class="recitation-speed" type="range" min="0.25" max="1" step="0.05" value="0.75"><output class="recitation-rate">0.75×</output></label>
   <div class="recitation-options"><label><input type="checkbox" class="recitation-repeat"> Repeat verse</label><label><input type="checkbox" class="recitation-continuous"> Continue to next verse</label></div>
   <p class="recitation-marker-key">। recitation pause · ॥ verse/section end</p></div>`;
  panel.querySelector('.recitation-play').onclick=()=>{
   if(selected?.number===number&&!audio.paused){audio.pause();status('Paused '+selected.label);}else play(number);
  };
  panel.querySelector('.recitation-restart').onclick=()=>play(number,true);
  panel.querySelector('.recitation-toggle').onclick=()=>{const open=panel.querySelector('.recitation-settings').hidden;closeOptions();setOptions(panel,open);};
  panel.querySelector('.recitation-seek').oninput=event=>{
   const item=clipFor(number);if(selected?.number!==number){audio.pause();selected=item;}
   loadSection(number);seekTo(item.start+Math.min(Number(event.target.value),item.end-item.start));refresh();
  };
  panel.querySelector('.recitation-speed').oninput=event=>{rate=Number(event.target.value);audio.playbackRate=rate;refresh();};
  panel.querySelector('.recitation-repeat').onchange=event=>{repeat=event.target.checked;if(repeat)continuous=false;refresh();};
  panel.querySelector('.recitation-continuous').onchange=event=>{continuous=event.target.checked;if(continuous)repeat=false;refresh();};
  container.prepend(panel);refresh();if(wasOpen)setOptions(panel,true);
 }
 function showPhrases(container,number){
  const clip=clipFor(number);if(!clip)return;
  const sa=container.querySelector('.v-sanskrit,.m-sanskrit');
  const iast=container.querySelector('.v-translit,.m-translit');
  for(const [node,key] of [[sa,'sanskrit'],[iast,'iast']]){
   if(!node)continue;node.replaceChildren();
   clip.phrases.forEach((phrase,index)=>{
    const line=document.createElement('span');line.className='recitation-line';line.textContent=phrase[key];line.dataset.audioNumber=number;line.dataset.audioPhrase=index;
    node.append(line);
   });
  }
 }
 loadSection('shanti');
 audio.preservesPitch=true;audio.playbackRate=rate;
 audio.addEventListener('loadedmetadata',()=>{audio.playbackRate=rate;if(pendingSeek!==null){audio.currentTime=pendingSeek;pendingSeek=null;}refresh();});
 audio.addEventListener('play',tick);
 audio.addEventListener('pause',()=>{cancelAnimationFrame(frame);refresh();});
 audio.addEventListener('timeupdate',()=>{if(!audio.paused&&selected&&recordingTime()>=selected.end)finish();refresh();});
 audio.addEventListener('ended',finish);
 audio.addEventListener('error',()=>status('The embedded recording could not be decoded in this browser. Try a current browser that supports Opus audio.',true));
 document.addEventListener('pointerdown',event=>document.querySelectorAll('.recitation-panel.is-expanded').forEach(panel=>{if(!panel.contains(event.target))setOptions(panel,false);}));
 document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const panel=document.querySelector('.recitation-panel.is-expanded');if(panel){setOptions(panel,false,true);event.preventDefault();}});
 document.addEventListener('scroll',event=>{if(!(event.target instanceof Element&&event.target.closest('.recitation-settings')))closeOptions();},true);
 addEventListener('resize',()=>document.querySelectorAll('.recitation-panel.is-expanded').forEach(positionOptions));
 return {mount,showPhrases,play,closeOptions,pause(){audio.pause();if(selected)status('Paused '+selected.label);},select(number){if(selected&&selected.number!==number){audio.pause();selected=null;}refresh();},get recordingTime(){return recordingTime();},get state(){return {number:selected?.number,rate,repeat,continuous};}};
})();
const originalRenderReading=renderReading;
renderReading=function(){
 originalRenderReading();
 const number=readingDeck[readingIndex].number;
 audioEdition.select(number);
 if(number==='shanti'||number==='closing-shanti'){document.getElementById('reading-khanda').textContent=number==='shanti'?'Opening invocation':'Closing invocation';document.getElementById('reading-number').textContent=number==='shanti'?'Śānti':'Closing Śānti';}
 audioEdition.showPhrases(document.getElementById('reading-copy'),number);
 audioEdition.mount(document.querySelector('.reading-card'),number);
};
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.class-item[data-mantra]').forEach(item=>{
  if(item.dataset.mantra==='shanti'||item.dataset.mantra==='closing-shanti')item.querySelector('.class-num').textContent=item.dataset.mantra==='shanti'?'Śānti':'Śānti · end';
  audioEdition.showPhrases(item.querySelector('.class-body'),item.dataset.mantra);
  audioEdition.mount(item.querySelector('.class-body'),item.dataset.mantra);
 });
 document.getElementById('reading-study').addEventListener('click',()=>{
  const number=readingDeck[readingIndex].number,container=document.getElementById('study-passage');
  audioEdition.showPhrases(container,number);audioEdition.mount(container,number);
  const help=container.querySelector('.pada-help');if(help)help.textContent+=' Study uses separated grammatical forms.';
  if(number==='shanti'||number==='closing-shanti')document.getElementById('study-khanda').textContent=number==='shanti'?'Opening invocation':'Closing invocation';
 });
 document.querySelector('#reading-picker option[value="0"]').textContent='Śānti · Opening invocation';
 const lastOption=document.querySelector('#reading-picker option:last-child');if(lastOption.textContent.startsWith('closing-shanti'))lastOption.textContent='Closing Śānti · Hariḥ Om';
 renderReading();
});

const originalAudioNavigate=navigate;
navigate=function(id,...args){audioEdition.closeOptions();if(!['read','study'].includes(id))audioEdition.pause();return originalAudioNavigate(id,...args);};
