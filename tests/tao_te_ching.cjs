const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const providedReference = require('./fixtures/tao_provided_translation.json');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 3, reducedMotion: 'reduce', hasTouch: true });
    const errors = [];
    const remoteRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) remoteRequests.push(request.url()); });
    await page.goto(pathToFileURL(path.resolve('tao_te_ching.html')).href);
    assert.equal(await page.locator('#currentNo').textContent(), await page.evaluate(() => String(dailyChapter()).padStart(2, '0')), 'Opens on the daily chapter');
    const cycle = await page.evaluate(() => Array.from({ length: 82 }, (_, i) => dailyChapter(new Date(2028, 1, 20 + i, 12))));
    assert.equal(new Set(cycle.slice(0, 81)).size, 81, 'No repeats across a full cycle, including leap day and DST');
    assert.equal(cycle[0], cycle[81]);
    assert(await page.evaluate(() => dailyChapter(new Date(2026, 11, 31)) !== dailyChapter(new Date(2027, 0, 1))), 'New Year advances the card');
    assert.equal(await page.locator('.front').evaluate(face => getComputedStyle(face).borderRadius), '8px');
    assert.equal(await page.locator('#next').evaluate(button => getComputedStyle(button).borderRadius), '5px');
    const dailyPage = await browser.newPage({ timezoneId: 'America/Los_Angeles', reducedMotion: 'reduce' });
    await dailyPage.clock.install({ time: new Date('2026-09-28T23:59:00-07:00') });
    await dailyPage.goto(pathToFileURL(path.resolve('tao_te_ching.html')).href);
    const firstDay = await dailyPage.locator('#currentNo').textContent();
    await dailyPage.reload();
    assert.equal(await dailyPage.locator('#currentNo').textContent(), firstDay, 'Reload keeps today’s card');
    await dailyPage.evaluate(() => { go(1); refreshDailyCard(); });
    assert.notEqual(await dailyPage.locator('#currentNo').textContent(), firstDay, 'Same-day refresh preserves manual browsing');
    await dailyPage.clock.fastForward(61000);
    assert.equal(await dailyPage.locator('#currentNo').textContent(), await dailyPage.evaluate(() => String(dailyChapter()).padStart(2, '0')), 'Midnight advances to the new daily card');
    assert.notEqual(await dailyPage.locator('#currentNo').textContent(), firstDay);
    await dailyPage.clock.setSystemTime(new Date('2026-09-30T10:00:00-07:00'));
    await dailyPage.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    assert.equal(await dailyPage.locator('#currentNo').textContent(), await dailyPage.evaluate(() => String(dailyChapter()).padStart(2, '0')), 'Resuming on a new date refreshes the daily card');
    await dailyPage.close();
    assert.equal(await page.locator('#translation').inputValue(), 'provided');
    assert.equal(await page.locator('#translation option:checked').textContent(), 'ChatGPT Luna Medium');
    const imported = await page.evaluate(() => providedTranslation);
    assert.equal(imported.length, 81);
    const hash = value => crypto.createHash('sha256').update(value).digest('hex');
    assert.deepEqual(imported.map(chapter => hash(chapter.english)), providedReference.chapterHashes);
    assert.deepEqual(imported.map(chapter => chapter.notes.map(hash)), providedReference.noteHashes);
    await page.evaluate(() => { active = 1; render('initial'); });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const openingLines = await page.locator('.english-text p').first().evaluate(paragraph => {
      const node = paragraph.firstChild;
      const breakAt = node.textContent.indexOf('\n');
      const first = document.createRange(); first.setStart(node, 0); first.setEnd(node, breakAt);
      const second = document.createRange(); second.setStart(node, breakAt + 1); second.setEnd(node, node.length);
      return { firstBottom: first.getBoundingClientRect().bottom, secondTop: second.getBoundingClientRect().top };
    });
    assert(openingLines.secondTop >= openingLines.firstBottom, 'The Way and The name begin on separate rendered lines');
    const art = await page.evaluate(async () => {
      const sizes = await Promise.all(Object.entries(artCatalog).map(async ([name, src]) => {
        const image = new Image(); image.src = src; await image.decode();
        return { name, width: image.naturalWidth, height: image.naturalHeight };
      }));
      return { sizes, assignments: chapterArt, count: chapters.length };
    });
    assert.equal(art.count, 81);
    assert.equal(art.assignments.length, 81);
    assert.equal(art.sizes.length, 18);
    assert(art.sizes.every(image => image.width >= 1536 && image.height >= 887));
    for (const [chapter, motif] of [[5, 'bellows'], [8, 'water'], [11, 'vessel'], [12, 'simplicity'], [55, 'infant'], [73, 'net'], [76, 'bamboo'], [77, 'bow'], [80, 'village'], [81, 'giving']]) {
      assert.equal(art.assignments[chapter - 1].art, motif, `Chapter ${chapter} retains its intended symbol`);
    }
    for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932], [768, 1024], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      for (const chapter of [1, 12, 38, 55, 77, 81]) {
        await page.evaluate(number => { active = number; render('initial'); }, chapter);
        await page.locator('.front img').evaluate(image => image.decode());
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const layout = await page.evaluate(() => {
          const face = document.querySelector('.front');
          const image = face.querySelector('.art-panel').getBoundingClientRect();
          const text = face.querySelector('.text-panel').getBoundingClientRect();
          const reading = face.querySelector('.reading');
          return {
            stacked: image.bottom <= text.top + 1,
            horizontalOverflow: reading.scrollWidth > reading.clientWidth + 1,
            readingHeight: reading.clientHeight,
            controls: ['prev', 'next', 'flip', 'browse', 'random', 'translation'].map(id => {
              const rect = document.getElementById(id).getBoundingClientRect();
              return { visible: rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight, height: rect.height };
            }),
          };
        });
        assert(layout.stacked, `Image above text: ${width}, chapter ${chapter}`);
        assert(!layout.horizontalOverflow, `No clipped text: ${width}, chapter ${chapter}`);
        assert(layout.readingHeight >= 150);
        assert(layout.controls.every(control => control.visible));
        if (width <= 760) assert(layout.controls.every(control => control.height >= 44));
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (let chapter = 1; chapter <= 81; chapter++) {
      await page.evaluate(number => { active = number; render('initial'); }, chapter);
      await page.locator('.front img').evaluate(image => image.decode());
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator('#currentNo').textContent(), String(chapter).padStart(2, '0'));
      for (const version of ['provided', 'legge']) {
        await page.selectOption('#translation', version);
        const actual = await page.locator('.english-text').textContent();
        const expected = await page.evaluate(() => {
          const source = translation === 'legge' ? chapters[active - 1] : providedTranslation[active - 1];
          return source.english.split(/\n\s*\n/).map(p => p.replace(/^\s*\d+\.\s*/, '').trim()).filter(Boolean).join('');
        });
        assert.equal(actual, expected, `${version}, chapter ${chapter}: passage preserved`);
        assert.equal(await page.locator('.english-text').evaluate(element => getComputedStyle(element).whiteSpace), 'pre-line', `${version}, chapter ${chapter}: explicit verse line breaks are displayed`);
        assert.equal(await page.locator('.translation-notes').count(), version === 'provided' && chapter === 1 ? 1 : 0);
      }
      await page.click('#flip');
      assert(await page.locator('.front').evaluate(face => face.inert));
      assert(await page.locator('.front .scroll-cue').evaluate(cue => cue.hidden && getComputedStyle(cue).display === 'none'), 'English cue cannot paint through the Chinese face');
      assert(!(await page.locator('.back').evaluate(face => face.inert)));
      assert((await page.locator('.chinese-text').textContent()).length > 0);
    }
    await page.selectOption('#translation', 'provided');
    assert(await page.locator('.front').evaluate(face => face.inert), 'Changing translation preserves the Chinese face');
    await page.selectOption('#translation', 'legge');
    await page.reload();
    assert.equal(await page.locator('#translation').inputValue(), 'legge', 'Saved preference restored');
    await page.selectOption('#translation', 'provided');
    await page.reload();
    assert.equal(await page.locator('#translation').inputValue(), 'provided');
    await page.evaluate(() => { active = 81; render('initial'); });
    await page.click('#next');
    assert.equal(await page.locator('#currentNo').textContent(), '01');
    await page.click('#browse');
    await page.fill('#chapterSearch', '38');
    await page.click('[data-number="38"]');
    assert.equal(await page.locator('#currentNo').textContent(), '38');
    await page.locator('.front .reading').evaluate(reading => { reading.scrollTop = reading.scrollHeight; });
    await page.waitForFunction(() => document.querySelector('.front .scroll-cue').hidden);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.selectOption('#translation', 'legge');
    await page.evaluate(() => { active = 38; render('initial'); });
    await page.waitForFunction(() => !document.querySelector('.front .scroll-cue').hidden);
    await page.click('#flip');
    assert(await page.locator('.front .scroll-cue').evaluate(cue => cue.hidden && getComputedStyle(cue).display === 'none'));
    // Resize and observer updates must not reveal the inactive face's cue.
    await page.setViewportSize({ width: 375, height: 667 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert(await page.locator('.front .scroll-cue').evaluate(cue => cue.hidden));
    await page.click('#flip');
    assert(await page.locator('.back .scroll-cue').evaluate(cue => cue.hidden && getComputedStyle(cue).display === 'none'));
    assert(await page.locator('.front .scroll-cue').evaluate(cue => !cue.hidden), 'English cue returns on a long passage');
    assert.deepEqual(errors, []);
    assert.deepEqual(remoteRequests, [], 'Reader works without remote image, script or font requests');
    console.log('PASS: source-verified import, both translations across 81 chapters, saved preference, Chinese faces, 18 high-resolution images, six viewport sizes, 44px phone controls, chapter search, wrapping and offline rendering.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
