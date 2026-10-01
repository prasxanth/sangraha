const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve('kena_upanishad.html')).href);
    assert(await page.locator('#screen-home').isVisible());
    assert.equal(await page.locator('.bottom-nav').count(), 0);
    assert.equal(await page.locator('.reader-heading').count(), 0);
    for (const [button, screen] of [['home-read','read'], ['home-overview','overview'], ['home-khandas','khandas'], ['home-index','reference']]) {
      await page.locator('#'+button).click();
      assert(await page.locator('#screen-'+screen).isVisible());
      await page.locator('#brand-home').click();
      assert(await page.locator('#screen-home').isVisible());
    }
    await page.locator('#home-read').click();
    assert.equal(await page.locator('#reading-picker option').count(), 13);
    assert.equal(await page.locator('#reading-flip').textContent(), 'Read English ↻');
    assert(await page.locator('#reading-copy .v-sanskrit').count() > 0);
    const passages = await page.evaluate(() => readingDeck.map(item => ({
      number: item.number, english: item.english, sanskrit: item.sanskrit, art: item.art,
    })));
    assert.equal(new Set(passages.map(item => item.art)).size, 13, 'A distinct contextual illustration for every reading');
    assert.equal(await page.evaluate(() => new Set(readingDeck.map(item => KENA_ART[item.art])).size), 13);
    for (const passage of passages) {
      assert(passage.english.length > 20, `English present: ${passage.number}`);
      assert(passage.sanskrit.length > 20, `Sanskrit present: ${passage.number}`);
    }
    for (const [width, height] of [[1440,900], [390,844], [320,568], [844,390]]) {
      await page.setViewportSize({ width, height });
      for (let i = 0; i < passages.length; i++) {
        await page.selectOption('#reading-picker', String(i));
        assert.equal(await page.locator('#reading-number').textContent(), passages[i].number);
        assert.equal(await page.locator('#reading-flip').getAttribute('aria-pressed'), 'false');
        assert(await page.locator('#reading-copy .v-sanskrit').count() > 0, 'Each card opens on Sanskrit');
        assert(await page.locator('#reading-image').evaluate(async image => {
          await image.decode(); return image.naturalWidth >= 1024;
        }));
        assert.equal(await page.locator('.reading-card').evaluate(e => getComputedStyle(e).borderRadius), '8px');
        assert(await page.locator('.reading-art #reading-title').isVisible());
        const layout = await page.evaluate(() => ({
          card: document.querySelector('.reading-card').getBoundingClientRect().bottom,
          controls: document.querySelector('.reader-controls').getBoundingClientRect().bottom,
          passageHeight: document.getElementById('reading-copy').clientHeight,
          contentScroll: document.getElementById('content').scrollHeight - document.getElementById('content').clientHeight,
          height: innerHeight,
        }));
        assert(Math.abs(layout.controls - (layout.height - 12)) < 2, 'Controls reach the bottom gutter');
        assert(layout.controls - layout.card <= 60, 'Card extends down to the controls');
        assert(layout.passageHeight >= 75, 'Readable passage area on short screens');
        assert(layout.contentScroll <= 1, 'Reading view fits the viewport');
        assert(await page.locator('#reading-copy').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
        await page.locator('#reading-flip').click();
        assert.equal(await page.locator('#reading-flip').getAttribute('aria-pressed'), 'true');
        assert(await page.locator('#reading-copy').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
        for (const face of ['English', 'Sanskrit']) {
          const cardText = await page.locator('#reading-copy').innerHTML();
          await page.locator('#reading-study').click();
          assert(await page.locator('#screen-study').isVisible());
          assert.equal(await page.locator('.screen.active .class-item').count(), 1, 'Only this passage is shown');
          assert.equal(await page.locator('.screen.active .class-hdr').count(), 0, 'No other verse headers');
          assert.equal(await page.locator('#study-khanda').textContent(),
            await page.evaluate(() => 'Khaṇḍa ' + ['I','II','III','IV'][readingDeck[readingIndex].kh-1] + ' · ' + readingDeck[readingIndex].number));
          assert.equal(await page.locator('#study-passage').innerHTML(),
            await page.evaluate(() => readingDeck[readingIndex].element.querySelector('.class-body').innerHTML), 'All original study material retained');
          assert(await page.locator('#study-passage').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
          await page.locator('#study-back').click();
          assert.equal(await page.locator('#reading-picker').inputValue(), String(i));
          assert.equal(await page.locator('#reading-copy').innerHTML(), cardText, `${face} face preserved on return`);
          assert(await page.locator('#reading-study').evaluate(e => e === document.activeElement));
          if (face === 'English') await page.locator('#reading-flip').click();
        }
      }
      await page.selectOption('#reading-picker', '0');
      await page.locator('#reading-copy').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#reading-picker').inputValue(), '1');
      await page.locator('#reading-prev').click();
      assert(await page.locator('#reading-prev').isDisabled());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `/tmp/kena-cards-${width}.png` });
      await page.locator('#brand-home').click();
      await page.screenshot({ path: `/tmp/kena-home-${width}.png` });
      await page.locator('#home-read').click();
    }
    await page.evaluate(() => navigate('reference'));
    for (let i = 0; i < 4; i++) {
      await page.locator('#ref-tabs button').nth(i).click();
      assert.equal(await page.locator('.ref-item').count(), [8, 5, 12, 9][i]);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: full-height cards, image titles, homepage links and brand navigation, 13 unique artworks, Sanskrit-first readings, isolated studies, return state, keyboard navigation, index, desktop/mobile/landscape layouts.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
