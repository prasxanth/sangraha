const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://**', r => r.abort());
    await page.addInitScript(() => {
      const original = setTimeout;
      window.setTimeout = (fn, delay, ...args) => String(fn).includes('loadSwiss().then') ? 0 : original(fn, delay, ...args);
    });
    await page.goto('file://' + process.cwd() + '/astrology_engine.html');
    await page.waitForFunction(() => document.querySelector('#validationTable').dataset.autorun === 'done');
    const reference = await page.evaluate(() => {
      const md = dashaRoot.find(p => p.lord === 'Mercury' && p.a > chart.birthMs), children = childPeriods(md);
      const venus = bphsLordDomainAssessment('Venus', 0), pair = bphsPairAssessment('Mercury', 'Venus', 0);
      return {
        friendship: [naturalRelationship('Moon', 'Mercury'), naturalRelationship('Mercury', 'Moon')],
        dignity: [ruleDignity('Mercury', 164.999).band, ruleDignity('Mercury', 165).band, ruleDignity('Mercury', 170).band],
        varga: venus.contributions.varga, expectedVarga: .35 * venus.varga.signal,
        floor: venus.contributions.domainFactor,
        relative: pair.relativeHouse, qualified: pair.qualifiedNegative, weak: pair.strength.weak,
        partition: children.every((p, i) => (i === 0 ? p.a === md.a : p.a === children[i-1].b) && Math.abs((p.b-p.a)/(md.b-md.a) - DASHA[p.lord]/120) < 1e-12) && children.at(-1).b === md.b,
        noSelf: DSEQ.every(n => bphsPairAssessment(n, n, 0).pairSignal === 0),
        node: functionalAssessment('Ketu').status,
        coverage: AstroHeatmap.getRuleCoverage(),
        natalCircuit: bnnNatalDomainAssessment(0),
        swissIndependent: (() => { const original = ruleDignity; try { ruleDignity = () => { throw new Error('BNN imported BPHS compound dignity'); }; scoreCache.clear(); return Number.isFinite(bnnNatalDomainAssessment(0).support); } finally { ruleDignity = original; scoreCache.clear(); } })()
      };
    });
    assert.deepEqual(reference.friendship, [1, -1], 'Natural friendship is directed');
    assert.deepEqual(reference.dignity, ['exalted', 'moolatrikona', 'own sign']);
    assert.equal(reference.varga, reference.expectedVarga);
    assert(reference.varga !== 0 && reference.floor >= .65, 'D10 evidence cannot be erased by low D1 relevance');
    assert.equal(reference.relative, 12);
    assert.equal(reference.qualified, reference.weak, 'Mercury/Venus relative caution requires weakness');
    assert(reference.partition && reference.noSelf && reference.swissIndependent);
    assert.equal(reference.node, 'conditional node agency');
    assert.equal(reference.coverage.exhaustive, false);
    assert(reference.coverage.families.some(r => r[2] === 'not implemented'));
    assert(reference.natalCircuit.connections.every(c => c.weight === Math.max(...c.relations.map(r => r.weight))), 'Count strongest relationship once');
    for (const id of ['father', 'mother', 'son1', 'son2']) {
      const result = await page.evaluate(async id => {
        loadSavedProfile(id); await calculateProfile(false);
        const pairs = DOMAINS.flatMap((_, di) => DSEQ.flatMap(md => DSEQ.map(ad => bphsPairAssessment(md, ad, di))));
        const vals = DOMAINS.flatMap((_, di) => DSEQ.flatMap(md => DSEQ.map(ad => bphsPathSupport([md, ad], di))));
        const chains = DSEQ.map(dispositorChain);
        return { count: pairs.length, bounded: vals.every(v => Number.isFinite(v) && Math.abs(v) <= 2), evidence: pairs.every(p => p.evidence.length >= 3), terminates: chains.every(c => c.path.length <= 9), distinct: new Set(vals.map(x => x.toFixed(6))).size };
      }, id);
      assert.equal(result.count, 12 * 81);
      assert(result.bounded && result.evidence && result.terminates && result.distinct > 9, id);
    }
    await page.evaluate(async () => { loadSavedProfile('father'); await calculateProfile(false); switchTab('cycles'); $('methodComparison').open = true; renderMethodComparison(); });
    await page.locator('#ruleCoverage > summary').click();
    assert(await page.locator('#ruleCoverage').innerText().then(t => t.includes('not implemented') && t.includes('Reviewed sources')));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Coverage fits a 360px viewport');
    await page.screenshot({ path: '/tmp/kala-v17-mobile.png', fullPage: true });
    const validation = await page.evaluate(() => { const r = runValidationSuite(); return { requiredPass: r.requiredPass, requiredFail: r.requiredFail, syntheticPass: r.syntheticPass, syntheticFail: r.syntheticFail, devata: referenceDevataRegression()?.ok }; });
    assert.equal(validation.requiredFail, 0);
    console.log('Built-in validation:', validation);
    assert.deepEqual(errors, []);
    console.log('PASS: 3,888 domain/MD–AD assessments; asymmetric friendship, dignity boundaries, independent varga, conditional cautions, no self boost, BNN method separation, dasha partition, bounded scores and mobile coverage UI.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
