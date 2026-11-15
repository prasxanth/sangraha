/* The recording's opening Om belongs to the invocation, not a second Om at 1.1. */
const firstMantra=document.querySelector('[data-mantra="1.1"]');
firstMantra.querySelector('.v-sanskrit').textContent=firstMantra.querySelector('.v-sanskrit').textContent.replace(/^ॐ\s*/, '');
firstMantra.querySelector('.v-translit').textContent=firstMantra.querySelector('.v-translit').textContent.replace(/^oṃ\s*/, '');
const firstWord=firstMantra.querySelector('table.wbw tbody tr');
if(firstWord?.cells[0].textContent.trim()==='ॐ')firstWord.remove();
KENA_PHRASE_TRANSLATIONS['1.1']=KENA_PHRASE_TRANSLATIONS['1.1'].slice(1).map(p=>({...p,start:p.start-1,end:p.end-1}));
/* One embedded recording, with bounded, independently playable recitations. */
const audioEdition = (() => {
 const audio = document.getElementById('recitation-audio');
 let selected = null, repeat = false, continuous = false, frame = 0, pendingSeek = null;
 let rate = .75;
 const format = seconds => `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
 const clipFor = number => KENA_AUDIO.clips.find(c => c.number === number);
 function status(text) { document.getElementById('audio-status').textContent = text; }
 function refresh(visibleOnly=false) {
  const clip=selected, elapsed=clip ? Math.max(0,Math.min(audio.currentTime-clip.start,clip.end-clip.start)) : 0;
  document.querySelectorAll('.recitation-panel').forEach(panel => {
   if(visibleOnly&&!panel.closest('.screen.active'))return;
   const number=panel.dataset.number, item=clipFor(number), active=clip && clip.number===number;
   panel.querySelector('.recitation-play').textContent=active&&!audio.paused?'Pause':'Play verse';
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
   line.classList.toggle('reciting',!!(phrase&&selected?.number===line.dataset.audioNumber&&!audio.paused&&audio.currentTime>=phrase.start&&audio.currentTime<phrase.end));
  });
 }
 function seekTo(time) {
  if(audio.readyState===0){pendingSeek=time;audio.load();}else audio.currentTime=time;
 }
 async function play(number, restart=false) {
  const clip=clipFor(number);if(!clip)return;
  const changed=selected?.number!==number;
  if(changed){audio.pause();selected=clip;}
  if(changed||restart||audio.currentTime<clip.start||audio.currentTime>=clip.end-.04)seekTo(clip.start);
  audio.playbackRate=rate;
  try { await audio.play(); status('Playing '+clip.label); }
  catch(error){status('Playback could not start. Tap Play verse to try again.');}
  refresh();
 }
 function finish() {
  if(!selected)return;
  if(repeat){seekTo(selected.start);if(audio.paused)audio.play().catch(()=>status('Tap Play verse to resume.'));return;}
  if(continuous){
   const index=KENA_AUDIO.clips.indexOf(selected), next=KENA_AUDIO.clips[index+1];
   if(next){openMantra(next.number,false);play(next.number,true);return;}
  }
  audio.pause();audio.currentTime=selected.end;status('Finished '+selected.label);refresh();
 }
 function tick(){
  cancelAnimationFrame(frame);
  if(!audio.paused){if(selected&&audio.currentTime>=selected.end-.025)finish();refresh(true);if(!audio.paused)frame=requestAnimationFrame(tick);}
 }
 function mount(container, number) {
  if(!clipFor(number))return;
  container.querySelectorAll('.recitation-panel').forEach(e=>e.remove());
  const panel=document.createElement('section');panel.className='recitation-panel';panel.dataset.number=number;
  panel.setAttribute('aria-label',clipFor(number).label+' audio');
  panel.innerHTML=`<div class="recitation-heading">Listen · ${clipFor(number).label}</div>
   <div class="recitation-actions"><button type="button" class="deck-button recitation-play">Play verse</button><button type="button" class="deck-button recitation-restart">↺ Restart</button><output class="recitation-time"></output></div>
   <label class="recitation-progress">Verse position<input class="recitation-seek" type="range" min="0" step="0.05" value="0"></label>
   <label class="recitation-speed-label">Speed <input class="recitation-speed" type="range" min="0.25" max="1" step="0.05" value="0.75"><output class="recitation-rate">0.75×</output></label>
   <div class="recitation-options"><label><input type="checkbox" class="recitation-repeat"> Repeat verse</label><label><input type="checkbox" class="recitation-continuous"> Continue to next verse</label></div>`;
  panel.querySelector('.recitation-play').onclick=()=>{
   if(selected?.number===number&&!audio.paused){audio.pause();status('Paused '+selected.label);}else play(number);
  };
  panel.querySelector('.recitation-restart').onclick=()=>play(number,true);
  panel.querySelector('.recitation-seek').oninput=event=>{
   const item=clipFor(number);if(selected?.number!==number){audio.pause();selected=item;}
   seekTo(item.start+Math.min(Number(event.target.value),item.end-item.start));refresh();
  };
  panel.querySelector('.recitation-speed').oninput=event=>{rate=Number(event.target.value);audio.playbackRate=rate;refresh();};
  panel.querySelector('.recitation-repeat').onchange=event=>{repeat=event.target.checked;if(repeat)continuous=false;refresh();};
  panel.querySelector('.recitation-continuous').onchange=event=>{continuous=event.target.checked;if(continuous)repeat=false;refresh();};
  container.prepend(panel);refresh();
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
 audio.preservesPitch=true;audio.playbackRate=rate;
 audio.addEventListener('loadedmetadata',()=>{audio.playbackRate=rate;if(pendingSeek!==null){audio.currentTime=pendingSeek;pendingSeek=null;}refresh();});
 audio.addEventListener('play',tick);
 audio.addEventListener('pause',()=>{cancelAnimationFrame(frame);refresh();});
 audio.addEventListener('timeupdate',()=>{if(!audio.paused&&selected&&audio.currentTime>=selected.end)finish();refresh();});
 audio.addEventListener('ended',finish);
 audio.addEventListener('error',()=>status('The embedded recording could not be decoded in this browser. Try a current browser that supports Opus audio.'));
 return {mount,showPhrases,play,pause(){audio.pause();if(selected)status('Paused '+selected.label);},select(number){if(selected&&selected.number!==number){audio.pause();selected=null;}refresh();},get state(){return {number:selected?.number,rate,repeat,continuous};}};
})();
const originalRenderReading=renderReading;
renderReading=function(){
 originalRenderReading();
 const number=readingDeck[readingIndex].number;
 audioEdition.select(number);
 if(number==='shanti'||number==='closing-shanti'){document.getElementById('reading-khanda').textContent=number==='shanti'?'Opening invocation':'Closing invocation';document.getElementById('reading-number').textContent=number==='shanti'?'Śānti':'Closing Śānti';}
 audioEdition.showPhrases(document.getElementById('reading-copy'),number);
 audioEdition.mount(document.querySelector('.reading-text'),number);
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
  if(number==='shanti'||number==='closing-shanti')document.getElementById('study-khanda').textContent=number==='shanti'?'Opening invocation':'Closing invocation';
 });
 document.querySelector('#reading-picker option[value="0"]').textContent='Śānti · Opening invocation';
 const lastOption=document.querySelector('#reading-picker option:last-child');if(lastOption.textContent.startsWith('closing-shanti'))lastOption.textContent='Closing Śānti · Hariḥ Om';
 renderReading();
});

const originalAudioNavigate=navigate;
navigate=function(id,...args){if(!['read','study'].includes(id))audioEdition.pause();return originalAudioNavigate(id,...args);};
