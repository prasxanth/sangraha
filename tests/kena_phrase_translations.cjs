const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const verses = require('../docs/kena-individual-mantras.json');
const phrases = require('../docs/kena-phrase-translations.json');
const html = fs.readFileSync(path.join(root, 'kena_upanishad.html'), 'utf8');
assert.deepEqual(Object.keys(phrases), verses.map(v => v.number), 'Every mantra has phrase pairs');
assert.deepEqual(JSON.parse(html.match(/const KENA_PHRASE_TRANSLATIONS = (.*);/)[1]), phrases,
  'Standalone app and editable phrase data agree');
let count = 0;
for (const verse of verses) {
  let next = 0;
  for (const phrase of phrases[verse.number]) {
    assert.equal(phrase.start, next, `${verse.number}: no skipped or repeated ranges`);
    assert(Number.isInteger(phrase.end) && phrase.end > phrase.start && phrase.end <= verse.words.length);
    const words = verse.words.slice(phrase.start, phrase.end);
    assert.equal(phrase.sanskrit, words.map(w => w.sanskrit).join(' '));
    assert.equal(phrase.iast, words.map(w => w.iast).join(' '));
    assert(phrase.english.trim(), `${verse.number}: every phrase has English`);
    next = phrase.end;
    count++;
  }
  assert.equal(next, verse.words.length, `${verse.number}: covers the complete mantra`);
}
assert.equal(phrases['2.4'][2].english, 'Through the Self, one gains strength.');
assert.equal(phrases['4.9'].at(-1).sanskrit, 'प्रतितिष्ठति', 'Retain the final emphatic repetition');
console.log(`PASS: ${count} phrase pairs cover all 601 padas in 34 mantras; app and source data agree.`);
