// Independent external Sanskrit witnesses, not a snapshot of the rendered app.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const data = require('../docs/kena-individual-mantras.json');
const source = require('./fixtures/kena_source_witness.json');
const wisdom = require('./fixtures/kena_wisdomlib_witness.json');
const html = fs.readFileSync('kena_upanishad.html','utf8');
const normalize = s => s.normalize('NFC').replace(/[\s।॥|०-९0-9]/gu,'').replace(/[ँꣳ]/gu,'ं').replace(/ओं/gu,'ॐ');
const shlokam = source.verses.map(s => s.split(/॥\s*[०-९]+\s*॥/u)[0].trim());
assert.equal(shlokam.length,35);
const selected = [shlokam[0],shlokam[1],shlokam[2]+' '+shlokam[3],...shlokam.slice(4)];
// Explicit edition choices; these are independently documented, not inferred from app text.
selected[8] = selected[8].replace('दहरमेवापि var दभ्रमेवापि','दभ्रमेवापि');
const claimEnd = selected[14].indexOf(' । ');
selected[13] += ' '+selected[14].slice(0,claimEnd);
selected[14] = selected[14].slice(claimEnd+3);
selected[15] = selected[15].replace('किमिदं यक्षमिति','किमेतद्यक्षमिति');
assert.equal(selected.length,34);
const witness2 = wisdom.passages.flatMap(p=>p.sanskrit.split(/(?:॥|\|\|)\s*[०-९0-9]+\s*(?:॥|\|\|)/u).map(s=>s.trim()).filter(Boolean));
assert.equal(witness2.length,34);
// Known punctuation/sandhi differences and web transcription faults. Every other character must agree.
const corrections = {
 '1.2':[['प्राणश्चक्षुषश्चक्षुःअ','प्राणःचक्षुषश्चक्षुर']],
 '1.3':[['मनोन','मनःन'],['नुशिष्यादन्यदेव','नुशिष्यात्अन्यदेव']],
 '1.4':[['यद्वाचानभ्युदितं','यद्वाचाऽनभ्युदितं']],
 '1.7':[['श्रोत्रमिंश्रुतम्','श्रोत्रमिदंश्रुतम्']],
 '2.1':[['दहरमेवापि','दभ्रमेवापि'],['नूनम्','नूनं']],
 '3.1':[['तअइक्षन्त','तऐक्षन्त']],
 '3.3':[['ब्रुवन्जातवेद','ब्रुवञ्जातवेद']],
 '3.10':[['शशाकाऽऽदतुं','शशाकादातुं']],
 '4.4':[['दाउ','दा'],['दाउ','दा']],
 '4.5':[['यद्देतद्','यदेतद्'],['भीक्ष्णम्','भीक्ष्णं']],
 '4.8':[['तसै','तस्यै']],
};
const index=JSON.parse(html.match(/^var MANTRAS = (.*);$/m)[1]);
const bodies=[...html.matchAll(/<div class="class-item" data-mantra="([\d.]+)">([\s\S]*?)(?=<div class="class-item"|<!-- ══ REFERENCE)/g)];
assert.equal(bodies.length,34);
const decode=s=>s.replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
const expectedNumbers=[8,5,12,9].flatMap((n,k)=>Array.from({length:n},(_,v)=>`${k+1}.${v+1}`));
assert.deepEqual(data.map(d=>d.number),expectedNumbers);
for(let i=0;i<data.length;i++) {
 const d=data[i], body=bodies[i][2];
 assert.equal(normalize(d.sanskrit),normalize(selected[i]),d.number+' agrees with Shlokam under documented edition choices');
 let w=normalize(witness2[i]);
 for(const [from,to] of corrections[d.number]||[]) {assert(w.includes(from),d.number+' source correction still applies');w=w.replace(from,to);}
 assert.equal(normalize(d.sanskrit),w,d.number+' agrees with independent Wisdomlib transcription after explicit corrections');
 assert.equal(decode(body.match(/class="v-sanskrit"[^>]*>([^<]+)</)[1]),d.sanskrit,d.number+' HTML uses audited text');
 assert.equal(decode(body.match(/class="v-translit"[^>]*>([^<]+)</)[1]),d.iast,d.number+' matching IAST');
 const row=index[d.kh].find(r=>r[0]===d.number);
 assert.deepEqual(row,[d.number,d.sanskrit,d.iast,d.english],d.number+' index agrees');
 assert(body.includes(d.wisdomlib),d.number+' specific source link');
 assert(body.includes('English rendering · editorial:'),d.number+' honest attribution');
 assert.equal(d.excerpt,false,d.number+' no truncated mantra');
 assert(d.words.every(w=>w.sanskrit && w.iast && w.meaning),d.number+' no empty word study');
}
for(const number of ['1.4','1.5','1.6','1.7','1.8']) {
 const d=data.find(d=>d.number===number);
 assert(d.sanskrit.includes('तदेव ब्रह्म त्वं विद्धि नेदं यदिदमुपासते'));
 assert.deepEqual(d.words.slice(-10).map(w=>w.sanskrit),['तत्','एव','ब्रह्म','त्वम्','विद्धि','न','इदम्','यत्','इदम्','उपासते']);
}
assert.equal(data.reduce((n,d)=>n+d.words.length,0),601);
assert(!html.includes('मन्ये विदितमिति नो न विदितं परं मतम्'),'Former fabricated 2.1 removed');
assert(!html.includes('न विद्यो न विजानीमः'),'Former malformed chapter heading removed');
console.log('PASS: all 34 complete mantras match two external Sanskrit witnesses with explicit variants; HTML, IAST, index, source links and 601 word occurrences agree.');
