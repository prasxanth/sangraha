const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const original = fs.readFileSync('archive/yoga_sudhakara.pre-fire-cards-2026-10-01.html', 'utf8');
  const updated = fs.readFileSync('yoga_sudhakara.html', 'utf8');
  const sutras = /var SUTRAS = .*?\n};/s;
  assert.equal(updated.match(sutras)[0], original.match(sutras)[0], 'Original Sanskrit index preserved');
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  try {
    const page = await browser.newPage({ hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve('yoga_sudhakara.html')).href);
    assert.equal(await page.evaluate(()=>Object.keys(YOGA_PADA.sutras).length),78);
    assert.deepEqual(await page.evaluate(()=>YOGA_PADA.sutras['1.2'].words.map(w=>w[0])),['योगः','चित्त','वृत्ति','निरोधः']);
    assert.deepEqual(await page.evaluate(()=>YOGA_PADA.sutras['3.20'].words.slice(0,3).map(w=>w[1])),['na','ca','tat'],'Local chapter-three numbering is retained');
    const originalLessons = await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return [...doc.querySelectorAll('[id^="screen-ch"] .class-body')].map(el => el.textContent);
    }, original);
    assert.deepEqual(await page.evaluate(() => readingDeck.map(item => item.element.querySelector('.class-body').textContent)), originalLessons);
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
    assert.equal(await page.locator('#reading-picker option').count(), 27);
    assert.equal(await page.locator('#reading-flip').textContent(), 'Read English ↻');
    assert(await page.locator('#reading-copy .v-sanskrit,#reading-copy .s-sanskrit').count() > 0);
    const passages = await page.evaluate(() => readingDeck.map(item => ({
      number: item.number, english: item.english, sanskrit: item.sanskrit, art: item.art,
    })));
    assert.equal(new Set(passages.map(item => item.art)).size, 27, 'A distinct contextual illustration for every reading');

    for (const passage of passages) {
      assert(passage.english.length > 20, `English present: ${passage.number}`);
      assert(passage.sanskrit.length > 20, `Sanskrit present: ${passage.number}`);
    }
    assert.equal((passages[20].sanskrit.match(/reading-verse-number/g) || []).length, 8, 'Transformation card includes sutras 3.9–3.16');
    assert.equal((passages[21].sanskrit.match(/reading-verse-number/g) || []).length, 33, 'Powers card includes sutras 3.17–3.49');
    for (const [width, height] of [[1440,900], [390,844], [320,568], [844,390]]) {
      await page.setViewportSize({ width, height });
      for (let i = 0; i < passages.length; i++) {
        await page.selectOption('#reading-picker', String(i));
        assert.equal(await page.locator('#reading-number').textContent(), passages[i].number);
        assert.equal(await page.locator('#reading-flip').getAttribute('aria-pressed'), 'false');
        assert(await page.locator('#reading-copy .v-sanskrit,#reading-copy .s-sanskrit').count() > 0, 'Each card opens on Sanskrit');
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
          assert.equal(await page.locator('#study-khanda').textContent(),
            await page.evaluate(() => YOGA_CHAPTERS[readingDeck[readingIndex].chapter-1] + ' · ' + readingDeck[readingIndex].number));
          const study = await page.evaluate(() => {
            const source=readingDeck[readingIndex].element.querySelector('.class-body');
            const rendered=document.getElementById('study-passage');
            const selector='.v-sanskrit,.v-translit,.s-sanskrit,.s-translit,.transl,.s-english,.s-commentary,.s-insight,.w-note,.anchor-box';
            const isWordTable=table=>Array.from(table.querySelectorAll('th'),e=>e.textContent.trim()).join('|')==='Sanskrit|IAST|Meaning';
            return {
              sourceText:Array.from(source.querySelectorAll(selector),e=>e.innerHTML),
              studyText:Array.from(rendered.querySelectorAll(selector),e=>e.innerHTML),
              sourceTables:Array.from(source.querySelectorAll('table')).filter(t=>!isWordTable(t)).map(t=>t.outerHTML),
              studyTables:Array.from(rendered.querySelectorAll('table'),t=>t.outerHTML),
              sourceMeanings:Array.from(source.querySelectorAll('table')).filter(isWordTable).flatMap(t=>Array.from(t.querySelectorAll('tbody tr'),r=>r.cells[2].innerHTML)),
              words:studyWords,
              expectedGroups:YOGA_PADA.passages[readingIndex],
              expectedWords:YOGA_PADA.passages[readingIndex].flatMap(ref=>YOGA_PADA.sutras[ref].words),
              labels:Array.from(rendered.querySelectorAll('.pada-label'),e=>e.textContent),
            };
          });
          assert.deepEqual(study.studyText,study.sourceText,'Verses and explanations preserved');
          assert.deepEqual(study.studyTables,study.sourceTables,'Comparison tables preserved');
          for(const meaning of study.sourceMeanings)assert(study.words.some(w=>w.meaning===meaning),'Existing word meaning preserved');
          for(const ref of study.expectedGroups)assert(study.labels.includes('Pada-viccheda · '+ref));
          assert(study.words.length>=study.expectedWords.length);
          assert.deepEqual(study.words.slice(0,study.expectedWords.length).map(w=>[w.sanskrit,w.iast]),study.expectedWords.map(w=>w.slice(0,2)));
          assert.equal(await page.locator('#study-passage .pada-unit').count(),study.words.length);
          assert(study.words.every(w=>/[\u0900-\u097f]/u.test(w.sanskrit)&&w.iast&&w.meaning));
          if(width===390&&face==='English'){
            for(const index of new Set([0,study.words.length-1])){
              for(const script of ['sanskrit','iast']){
                const word=page.locator('.pada-'+script+' .pada-word[data-word-index="'+index+'"]').first();
                await word.click();
                assert(await page.locator('#word-dialog').isVisible());
                assert.equal(await page.locator('#word-title').textContent(),study.words[index].sanskrit);
                assert.equal(await page.locator('#word-iast').textContent(),study.words[index].iast);
                assert.equal(await page.locator('#word-definition').innerHTML(),study.words[index].meaning);
                assert.equal(await word.getAttribute('aria-expanded'),'true');
                assert(await page.locator('#word-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
                if(i===0&&index===0&&script==='sanskrit')await page.screenshot({path:'/tmp/yoga-word-popup.png'});
                if(script==='sanskrit')await page.keyboard.press('Escape');
                else await page.locator('#word-close').click();
                assert(!(await page.locator('#word-dialog').isVisible()));
                await page.waitForFunction(()=>wordInvoker===null);
                assert.equal(await word.getAttribute('aria-expanded'),'false');
                assert(await word.evaluate(e=>e===document.activeElement));
              }
            }
            if(i===0){
              await page.locator('.pada-word').first().focus();
              await page.keyboard.press('Enter');
              assert(await page.locator('#word-dialog').isVisible());
              await page.mouse.click(2,2);
              assert(!(await page.locator('#word-dialog').isVisible()));
              await page.waitForFunction(()=>wordInvoker===null);
              await page.locator('.pada-study').scrollIntoViewIfNeeded();
              await page.screenshot({path:'/tmp/yoga-pada-study.png'});
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
      await page.screenshot({ path: `/tmp/yoga-cards-${width}.png` });
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
        await page.selectOption('#reading-picker','21');
        const copy = await page.locator('#reading-copy').boundingBox();
        await swipe(copy.x+100,copy.y+170,copy.x+100,copy.y+50);
        assert.equal(await page.locator('#reading-picker').inputValue(),'21','Vertical reading scroll does not change cards');
        assert(await page.locator('#reading-copy').evaluate(e=>e.scrollTop>0),'Vertical touch scrolling still works');
        await page.selectOption('#reading-picker','26');
        await swipe(80,150,250,150);
        assert.equal(await page.locator('#reading-picker').inputValue(),'26','No wrap after last card');
        await cdp.detach();

      }
      await page.locator('#brand-home').click();
      await page.screenshot({ path: `/tmp/yoga-home-${width}.png` });
      await page.locator('#home-read').click();
    }
    await page.evaluate(() => navigate('reference'));
    for (let i = 0; i < 4; i++) {
      await page.locator('#ref-tabs .wit-tab').nth(i).click();
      assert.equal(await page.locator('#ref-list .class-item').count(), await page.evaluate(ch => SUTRAS[ch].length, i+1));
      const entry = page.locator('#ref-list .class-hdr').first();
      await entry.focus();
      await page.keyboard.press('Enter');
      assert.equal(await entry.getAttribute('aria-expanded'), 'true');
    }
    await page.locator('#brand-home').click();
    await page.locator('#home-khandas').click();
    for (let ch=1;ch<=4;ch++) {
      await page.locator('#chapter-cards .module-card').nth(ch-1).click();
      assert(await page.locator('#screen-ch'+ch).isVisible());
      await page.locator('#screen-ch'+ch+' .chapter-nav button').nth(ch%4).click();
      assert(await page.locator('#screen-ch'+(ch%4+1)).isVisible());
      await page.locator('#brand-home').click();
      await page.locator('#home-khandas').click();
    }
    assert.deepEqual(errors, []);
    console.log('PASS: 27 bilingual cards, 78 sutra word breakdowns, Sanskrit/IAST meaning popups, Escape/backdrop/close dismissal, restored focus, preserved commentary and comparison tables, four viewport sizes, touch navigation, homepage and index.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
