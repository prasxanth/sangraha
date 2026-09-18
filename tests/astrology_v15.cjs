const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const source = fs.readFileSync('astrology_engine.html', 'utf8');
  assert(!/const\s+REFERENCE_(RANKING_REGRESSION|MAHADASHA_RECONCILIATION_BENCHMARK)/.test(source));
  assert(!source.includes('getMahadashaReconciliationBenchmark:'));
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
    for (const id of ['father', 'mother', 'son1', 'son2']) {
      const results = await page.evaluate(async id => {
        loadSavedProfile(id);
        await calculateProfile(false);
        const md = dashaRoot.find(p => p.b > chart.birthMs), ad = childPeriods(md)[0];
        const hierarchy = selectedPeriodHierarchyInvariant();
        const native = ['Vedic', 'Western', 'Saju'].every(id =>
          activationSystemAt(id, Date.now()).every(x => Number.isFinite(x) && x >= 0 && x <= 2));
        const periods = [md, ad, sajuYearGroups()[0], westernProfectionGroups()[0]];
        const finite = periods.every(period => DOMAINS.every((_, di) =>
          Number.isFinite(scoreVedicPeriod(period, di)) && Number.isFinite(activationVedicPeriod(period, di))));
        const breakdown = vedicPeriodBreakdown(ad, 0);
        const noForeignPath = !hasVedicPeriodPath(periods[2]) && !hasVedicPeriodPath(periods[3]);
        return { native, finite, noForeignPath, hierarchy: hierarchy.ok,
          fixed: breakdown.path.length === 2 && breakdown.pathMode === 'fixed',
          weights: breakdown.path.reduce((sum, x) => sum + x.weight, 0),
          childRange: breakdown.supportRange.count === 9 };
      }, id);
      assert(results.native && results.finite && results.noForeignPath && results.hierarchy && results.fixed && results.childRange, id);
      assert(Math.abs(results.weights - 1) < 1e-9);
    }
    const stable = await page.evaluate(() => {
      const md = dashaRoot.find(p => p.b > chart.birthMs);
      const original = activePathAt;
      try {
        scoreCache.clear();
        const before = scoreVedicPeriod(md, 0);
        activePathAt = () => ['Ketu', 'Mars', 'Saturn', 'Rahu', 'Sun'];
        scoreCache.clear();
        return Math.abs(scoreVedicPeriod(md, 0) - before) < 1e-12;
      } finally { activePathAt = original; scoreCache.clear(); }
    });
    assert(stable, 'Descendant changes must not alter a selected MD baseline');
    await page.evaluate(() => switchTab('cycles'));
    await page.locator('#activationHeat .touch-heat-cell').first().scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.locator('#activationHeat .touch-heat-cell').first().click();
    assert.match(await page.locator('.heat-preview-score').textContent(), /Activation/);
    await page.locator('.heat-preview-close').click();
    await page.locator('#activationHeat button[data-view="details"]').click();
    await page.locator('#activationHeat .explorer-item summary').first().click();
    assert.match(await page.locator('#activationHeat .explorer-detail').first().textContent(), /Fixed baseline/);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => switchTab('cycles'));
    assert(await page.locator('#activationHeat').isVisible());
    const missing = await page.evaluate(() => {
      const id = addSystem({ id: 'NoActivation', name: 'Support only', calculator: () => Array(12).fill(1) });
      selectedSystemIds = new Set([id]);
      const p = currentDisplayPeriod();
      const value = activationPeriod(p, 0);
      switchTab('heatmap');
      const displayed = $('components').textContent;
      switchTab('cycles');
      return { value, displayed };
    });
    assert.equal(missing.value, null);
    assert.match(missing.displayed, /not supplied/);
    const independent = await page.evaluate(() => {
      const id = addSystem({ id: 'IndependentActivation', name: 'Independent signals',
        calculator: () => Array(12).fill(-1), activationCalculator: () => Array(12).fill(1.5) });
      selectedSystemIds = new Set([id]);
      const p = currentDisplayPeriod();
      return { support: scorePeriod(p, 0), activation: activationPeriod(p, 0) };
    });
    assert.equal(independent.support, -1);
    assert(Math.abs(independent.activation - 1.5) < 1e-12);
    assert.deepEqual(errors, []);
    console.log('PASS: four profiles, fixed parent, child ranges, native activation, foreign paths, missing coverage, mobile and desktop interactions.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
