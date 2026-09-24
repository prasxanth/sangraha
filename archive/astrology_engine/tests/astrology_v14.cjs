// Run from the repository root with Playwright installed (see upgrade notes).
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://**', route => route.abort());
    await page.addInitScript(() => {
      const original = setTimeout;
      window.setTimeout = (fn, delay, ...args) => String(fn).includes('loadSwiss().then')
        ? 0 : original(fn, delay, ...args);
    });
    await page.goto('file://' + process.cwd() + '/astrology_engine.html');
    await page.waitForFunction(() => document.querySelector('#validationTable').dataset.autorun === 'done');
    assert.equal(await page.locator('#valFailed').textContent(), '0');

    for (const id of ['father', 'mother', 'son1', 'son2']) {
      const result = await page.evaluate(async id => {
        loadSavedProfile(id);
        await calculateProfile(false);
        switchTab('dharma');
        const knowledge = resolveVedicKnowledge(dharmaDateMs(), 20);
        switchTab('vedicYoga');
        const windows = scanShaniWindows(chart.birthMs, chart.birthMs + profile.horizon * YEAR_MS);
        return {
          counts: [detectedVedicYogas().length, knowledge.formAssessment.forms.length,
            knowledge.allPractices.length, knowledge.allTexts.length],
          eligible: knowledge.dailyPractices.every(x => x.safePublic === true &&
            !x.requiresInitiation && !x.requiresGuru && !x.lineageSensitive),
          finite: DOMAINS.every((_, di) => Number.isFinite(scoreVedicPeriod(currentDisplayPeriod(), di))),
          windows: windows.every(w => w.a < w.b && shaniStateAt((w.a + w.b) / 2).fromMoon === w.fromMoon),
          overflow: document.documentElement.scrollWidth > innerWidth,
          renderError: $('dharmaTab').dataset.renderError,
          invariants: [vedicGocharaInvariant().ok, vedicYogaInvariant().ok, shaniCycleInvariant().ok]
        };
      }, id);
      assert.deepEqual(result.counts, [34, 51, 47, 33], id);
      assert(result.eligible && result.finite && result.windows, id);
      assert(!result.overflow && !result.renderError && result.invariants.every(Boolean), id);
      console.log(`${id}: catalogs, eligibility, scoring, Saturn windows and mobile layout passed`);
    }

    await page.evaluate(() => switchTab('dharma'));
    await page.locator('[data-stab="dharma-practice"]').click();
    await page.locator('details').filter({ has: page.locator('#textAffinityGrid') })
      .locator('summary').first().click();
    await page.locator('#textAffinityGrid input').fill('hanuman');
    assert.equal(await page.locator('#textAffinityGrid .catalogEntry').count(), 1);
    await page.locator('#textAffinityGrid select[data-filter="group"]').selectOption('advanced');
    assert.equal(await page.locator('#textAffinityGrid .catalogEntry').count(), 0);
    await page.evaluate(() => {
      switchTab('cycles');
      $('gocharaDetails').open = true;
      renderVedicGocharaPanel();
    });
    assert.equal(await page.locator('.transitBar').count(), 12);
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const tab of ['dharma', 'vedicYoga', 'rankings', 'westernPath', 'sajuCultivation']) {
      await page.evaluate(tab => switchTab(tab), tab);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), tab);
    }
    assert.deepEqual(errors, []);
    console.log('Catalog interactions, transit bars and desktop tabs passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
