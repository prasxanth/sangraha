const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://**', route => route.abort());
    await page.addInitScript(() => {
      const timeout = setTimeout;
      window.setTimeout = (fn, delay, ...args) => String(fn).includes('loadSwiss().then') ? 0 : timeout(fn, delay, ...args);
    });
    await page.goto('file://' + process.cwd() + '/astrology_engine.html');
    await page.waitForFunction(() => document.querySelector('#validationTable').dataset.autorun === 'done');
    assert.deepEqual(await page.evaluate(() => [...selectedSystemIds]), ['Vedic', 'Western', 'Saju']);
    assert(await page.evaluate(() => methodSelectionInvariant().ok));
    assert.deepEqual(await page.evaluate(() => [1, 2, 3, 4, 5].map(d => [gocharaWeightForDepth(d), activationGocharaWeightForDepth(d)])), [[.05, .20], [.08, .25], [.12, .35], [.18, .45], [.24, .55]]);
    const results = [];
    for (const id of ['father', 'mother', 'son1', 'son2']) {
      results.push(await page.evaluate(async id => {
        loadSavedProfile(id); await calculateProfile(false);
        const bp = DOMAINS.flatMap((_, di) => DSEQ.map(lord => bphsLordDomainAssessment(lord, di)));
        const ms = Date.now(), support = scoreBNNAt(ms), activation = activationBNNAt(ms);
        const original = activePathAt;
        let independent;
        try {
          activePathAt = () => { throw new Error('BNN must not consult dashas'); };
          scoreCache.clear();
          independent = JSON.stringify(scoreBNNAt(ms)) === JSON.stringify(support) &&
            JSON.stringify(activationBNNAt(ms)) === JSON.stringify(activation);
        } finally { activePathAt = original; scoreCache.clear(); }
        const association = bphsPathAssociationFactor(['Mercury', 'Mercury'], 0);
        return { id, independent,
          bounded: bp.every(x => Number.isFinite(x.support) && Math.abs(x.support) <= 2 && x.activation >= 0 && x.activation <= 2) &&
            support.every(x => Number.isFinite(x) && Math.abs(x) <= 2) && activation.every(x => Number.isFinite(x) && x >= 0 && x <= 2),
          noSelfBoost: association.supportFactor === 1 && association.activationFactor === 1,
          profileScore: bphsLordDomainAssessment('Mercury', 0).support,
          api: AstroHeatmap.getMethodRegistry().primaryVedic === 'BPHS' && AstroHeatmap.getSystems().some(s => s.id === 'BNN' && !s.defaultSelected)
        };
      }, id));
    }
    assert(results.every(x => x.independent && x.bounded && x.noSelfBoost && x.api));
    assert(new Set(results.map(x => x.profileScore)).size > 1, 'Profiles must not share stale cached scores');
    await page.evaluate(() => { switchTab('cycles'); $('methodComparison').open = true; renderMethodComparison(); });
    assert.equal(await page.evaluate(() => selectedSystemIds.has('BNN')), false, 'Preview is not opt-in');
    await page.locator('#methodDomain').selectOption('Marriage');
    assert(await page.locator('.bnnCircuit').count() > 0);
    await page.locator('#toggleBNN').click();
    assert(await page.evaluate(() => selectedSystemIds.has('BNN')));
    const coverage = await page.evaluate(() => {
      const den = selectedSystems().reduce((sum, s) => sum + effectiveNominalWeight('Career', s.id), 0);
      return effectiveNominalWeight('Career', 'BNN') / den;
    });
    assert(Math.abs(coverage - .15 / 1.15) < 1e-12);
    await page.locator('#toggleBNN').click();
    assert.equal(await page.evaluate(() => selectedSystemIds.has('BNN')), false);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => renderMethodComparison());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => { AstroHeatmap.setSelectedSystems(['BNN']); switchTab('cycles'); renderMethodComparison(); });
    assert.equal(await page.evaluate(() => selectedCycleKeys().length), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: BPHS/BNN bounds, four-profile caches, independent BNN, no self-association boost, preview/opt-in, weights, BNN-only and responsive comparison.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
