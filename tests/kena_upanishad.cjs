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
    const page = await browser.newPage({ hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve('kena_upanishad.html')).href, {waitUntil:'domcontentloaded'});
    assert(await page.locator('#screen-home').isVisible());
    assert.equal(await page.locator('.bottom-nav').count(), 0);
    assert.equal(await page.locator('.reader-heading').count(), 0);
    assert.equal(await page.locator('#brand-home .brand-mark svg').count(), 1);
    for (const [button, screen] of [['home-read','read'], ['home-overview','overview'], ['home-khandas','khandas'], ['home-index','reference']]) {
      await page.locator('#'+button).click();
      assert(await page.locator('#screen-'+screen).isVisible());
      await page.locator('#brand-home').click();
      assert(await page.locator('#screen-home').isVisible());
    }
    await page.locator('#home-read').click();
    assert.equal(await page.locator('#reading-picker option').count(), 34);
    assert.equal(await page.locator('#reading-flip').textContent(), 'Read English ↻');
    assert(await page.locator('#reading-copy .v-sanskrit').count() > 0);
    const passages = await page.evaluate(() => readingDeck.map(item => ({
      number: item.number, english: item.english, sanskrit: item.sanskrit, art: item.art,
    })));
    assert.equal(new Set(passages.map(item => item.art)).size, 34, 'A distinct contextual illustration for every reading');
    assert.equal(await page.evaluate(() => new Set(readingDeck.map(item => KENA_ART[item.art])).size), 34);
    const expected = require('./fixtures/kena_individual_mantras.json');
    assert.deepEqual(passages.map(p=>p.number), expected.map(p=>p.number), 'All 34 single-mantra units in order');
    assert.deepEqual(await page.locator('.class-num').allTextContents(), expected.map(p=>p.number));
    const integrity = await page.evaluate(() => readingDeck.map(item=>({
      number:item.number, section:item.section,
      sourceGroup:KENA_MANTRA_META[item.number].sourceGroup,
      wordContext:KENA_MANTRA_META[item.number].wordContext,
      tables:item.element.querySelectorAll('table.wbw').length,
      shared:Array.from(item.element.querySelectorAll('[data-shared-from]'),e=>e.dataset.sharedFrom),
      hasFocus:!!item.element.querySelector('.study-focus'),
      hasAnchor:!!item.element.querySelector('.anchor-box'),
    })));
    for (const item of integrity) {
      assert(item.tables>0 && item.hasAnchor, 'Word study and contemplation available for '+item.number);
      if (item.number!=='1.1' && item.number!=='1.2' && item.number!=='1.3' && item.number!=='1.4') assert(item.hasFocus);
      if (['1.5','1.6','1.7','1.8'].includes(item.number)) {
        assert.equal(item.section,'From the paradox of knowing to realization');
        assert.equal(item.tables,1,'Each has its own existing word notes');
      }
      if (item.wordContext) assert(['3.2','3.3','3.5','3.8'].includes(item.number));
    }
    assert(!passages.find(p=>p.number==='1.5').sanskrit.includes('प्रतिबोध'));
    assert(!passages.find(p=>p.number==='1.6').sanskrit.includes('यस्यामतं'));
    assert(!passages.find(p=>p.number==='1.7').sanskrit.includes('भूतेषु'));
    assert(!passages.find(p=>p.number==='1.8').sanskrit.includes('इह चेद'));
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
          await image.decode(); return image.naturalWidth >= 1024 && Math.abs(image.naturalWidth/image.naturalHeight-3)<0.02;
        }));
        const framing=await page.locator('#reading-image').evaluate(image=>{
          const r=image.getBoundingClientRect(), card=image.closest('.reading-card').getBoundingClientRect();
          return {ratio:r.width/r.height,native:image.naturalWidth/image.naturalHeight,width:r.width,cardWidth:card.width,fit:getComputedStyle(image).objectFit};
        });
        assert(Math.abs(framing.ratio-framing.native)<0.01,'Whole image retains its native proportions: '+passages[i].number);
        assert(Math.abs(framing.width-(framing.cardWidth-2))<1,'Artwork spans the card width');
        assert.equal(framing.fit,'contain','No cover cropping');
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
          assert.equal(await page.locator('#study-passage table').count(), 0, 'Word tables replaced in study view');
          const preserved = await page.evaluate(() => {
            const source = readingDeck[readingIndex].element.querySelector('.class-body');
            const study = document.getElementById('study-passage');
            const selector = '.v-sanskrit,.v-translit,.transl,.m-english,.m-commentary,.m-shankara,.anchor-box';
            return {
              original: Array.from(source.querySelectorAll(selector), e => e.outerHTML),
              rendered: Array.from(study.querySelectorAll(selector), e => e.outerHTML),
              sourceWords: Array.from(source.querySelectorAll('table.wbw tbody tr'), row => ({
                sanskrit: row.cells[0].textContent.trim(), iast: row.cells[1].textContent.trim(), meaning: row.cells[2].innerHTML,
              })),
              renderedWords: studyWords.map(({sanskrit,iast,meaning}) => ({sanskrit,iast,meaning})),
            };
          });
          assert.deepEqual(preserved.rendered, preserved.original, 'Other explanations and original mantra unchanged');
          assert.deepEqual(preserved.renderedWords, preserved.sourceWords, 'Every existing word meaning preserved');
          assert.equal(await page.locator('#study-passage .pada-unit').count(), preserved.sourceWords.length);
          if (face === 'English') {
            for (const script of ['sanskrit','iast']) {
              const word = page.locator('#study-passage .pada-'+script+' .pada-word').first();
              await word.click();
              assert(await page.locator('#word-dialog').isVisible());
              assert.equal(await page.locator('#word-title').textContent(), preserved.sourceWords[0].sanskrit);
              assert.equal(await page.locator('#word-iast').textContent(), preserved.sourceWords[0].iast);
              assert.equal(await page.locator('#word-definition').innerHTML(), preserved.sourceWords[0].meaning);
              if (width === 390 && i === 4 && script === 'sanskrit') await page.screenshot({path:'/tmp/kena-word-popup.png'});
              if (script === 'sanskrit') await page.keyboard.press('Escape');
              else await page.locator('#word-close').click();
              assert(!(await page.locator('#word-dialog').isVisible()));
              assert(await word.evaluate(e => e === document.activeElement));
            }
          }
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
      if (width === 390) {
        const cdp = await page.context().newCDPSession(page);
        const swipe = async (x,y,endX,endY) => {
          await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x,y}]});
          for (let step=1;step<=5;step++) {
            await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:x+(endX-x)*step/5,y:y+(endY-y)*step/5}]});
            await page.waitForTimeout(20);
          }
          await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
          await page.waitForTimeout(80);
        };
        await swipe(80,150,250,150);
        assert.equal(await page.locator('#reading-picker').inputValue(), '1', 'Right swipe advances');
        await swipe(250,150,80,150);
        assert.equal(await page.locator('#reading-picker').inputValue(), '0', 'Left swipe goes back');
        await swipe(250,150,80,150);
        assert.equal(await page.locator('#reading-picker').inputValue(), '0', 'No wrap before first card');
        await page.setViewportSize({width:390,height:568});
        await page.selectOption('#reading-picker','1');
        await page.locator('#reading-flip').click();
        const copy = await page.locator('#reading-copy').boundingBox();
        await swipe(copy.x+100,copy.y+170,copy.x+100,copy.y+50);
        assert.equal(await page.locator('#reading-picker').inputValue(),'1','Vertical reading scroll does not change cards');
        assert(await page.locator('#reading-copy').evaluate(e=>e.scrollTop>0),'Vertical touch scrolling still works');
        await page.selectOption('#reading-picker','33');
        await swipe(80,150,250,150);
        assert.equal(await page.locator('#reading-picker').inputValue(),'33','No wrap after last card');
        await cdp.detach();
        await page.setViewportSize({width,height});
        await page.selectOption('#reading-picker','4');
        await page.locator('#reading-study').click();
        await page.locator('.pada-viccheda').first().scrollIntoViewIfNeeded();
        await page.screenshot({path:'/tmp/kena-word-study.png'});
        await page.locator('#study-back').click();
      }
      await page.locator('#brand-home').click();
      await page.screenshot({ path: `/tmp/kena-home-${width}.png` });
      await page.locator('#home-read').click();
    }
    await page.evaluate(() => navigate('reference'));
    for (let i = 0; i < 4; i++) {
      await page.locator('#ref-tabs button').nth(i).click();
      assert.equal(await page.locator('.ref-item').count(), [8, 5, 12, 9][i]);
      await page.locator('.ref-hdr').last().click();
      await page.locator('.ref-body.open .index-actions button').last().click();
      assert.equal(await page.locator('#reading-number').textContent(), String(i+1)+'.'+[8,5,12,9][i]);
      assert(await page.locator('#screen-study').isVisible());
      await page.locator('#brand-home').click();
      await page.locator('#home-index').click();
    }
    for (let kh=1;kh<=4;kh++) {
      await page.evaluate(kh=>navigate('kh'+kh),kh);
      const entries=page.locator('#screen-kh'+kh+' .class-hdr');
      assert.equal(await entries.count(),[8,5,12,9][kh-1]);
      await entries.last().click();
      assert(await page.locator('#screen-study').isVisible());
      assert.equal(await page.locator('#reading-number').textContent(),kh+'.'+[8,5,12,9][kh-1]);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: responsive cards, eye icon, right/left touch swipes, vertical scroll, all word meanings in accessible Sanskrit/IAST popups, unchanged explanations, isolated studies, 34 artworks, homepage navigation and index.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
