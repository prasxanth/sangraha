const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
    page.setDefaultTimeout(120000);
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
        weightsVerified: children.every(p => {
          const w = normalizedDashaWeights(p.path.length), gw = gocharaWeightForDepth(p.path.length);
          const baseline = w[0]*bphsLordDomainAssessment('Mercury',0).support + w[1]*bphsLordDomainAssessment(p.lord,0).support;
          const context = .35*w[1]*bphsPairAssessment('Mercury',p.lord,0).pairSignal;
          const transit = avg(vedicPeriodSampleTimes(p).map(ms => vedicGocharaScore(ms,0,p.path).score));
          return Math.abs(w[0]-.375)<1e-12 && w[1]===.625 && gw===.08 && Math.abs((1-gw)*(baseline+context)+gw*transit-scoreVedicContextPeriod(p,0))<1e-12;
        }),
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
    assert(reference.weightsVerified && reference.partition && reference.noSelf && reference.swissIndependent);
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
        const md=dashaRoot.find(p=>p.a>chart.birthMs),supportBefore=scorePeriod(md,0);
        const expression=DOMAINS.flatMap((d,di)=>domainExpressionAssessment(md,di));
        const expressionOK=expression.length===24&&expression.every(x=>Number.isFinite(x.score)&&x.score>=0&&x.score<=2&&Math.abs(Object.values(x.contributions).reduce((s,v)=>s+v,0)-x.score)<1e-12);
        const isolated=scorePeriod(md,0)===supportBefore;
        const defaultSamples=sampleTimes(md);
        const samplingOK=$('sampleMode').value==='auto'&&defaultSamples.length>3&&defaultSamples.length<=192&&defaultSamples.every(t=>t>md.a&&t<md.b);
        return { expressionOK, isolated, samplingOK, count: pairs.length, bounded: vals.every(v => Number.isFinite(v) && Math.abs(v) <= 2), evidence: pairs.every(p => p.evidence.length >= 3), terminates: chains.every(c => c.path.length <= 9), distinct: new Set(vals.map(x => x.toFixed(6))).size };
      }, id);
      assert.equal(result.count, 12 * 81);
      assert(result.expressionOK && result.isolated && result.samplingOK && result.bounded && result.evidence && result.terminates && result.distinct > 9, id);
    }
    await page.evaluate(async () => { loadSavedProfile('father'); await calculateProfile(false); switchTab('cycles'); $('methodComparison').open = true; renderMethodComparison(); });
    await page.locator('#methodDomain').selectOption('Wealth');
    assert.equal(await page.locator('.domainExpression').count(),1);
    assert((await page.locator('.domainExpression').textContent()).includes('Stewardship / continuity'));
    await page.locator('#ruleCoverage > summary').click();
    assert(await page.locator('#ruleCoverage').innerText().then(t => t.includes('not implemented') && t.includes('Reviewed sources')));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Coverage fits a 360px viewport');
    await page.screenshot({ path: '/tmp/kala-v17-mobile.png', fullPage: true });
    await page.evaluate(()=>{prefix=['Mercury'];cycleFamilyKey='vimshottari';renderMethodComparison()});
    await page.locator('#expressionPeriods > summary').click();
    await page.locator('.expressionPeriodsBody article').first().waitFor();
    assert.equal(await page.locator('.expressionPeriodsBody article').count(),9);
    await page.locator('.domainExpression').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/kala-v18-expression.png'});
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(() => renderDomainBars());
    assert(await page.locator('.dbar-seg').count() > 0);
    assert.equal(await page.locator('.dbar-grade').count(),0,'Only support scores belong in cells');
    assert(await page.locator('.dbar-score').evaluateAll(cells => cells.every(c => /^[+−-]?\d+\.\d{2}$/.test(c.textContent))));
    const migration = await page.evaluate(()=>{
      const old=JSON.parse(localStorage.getItem('kala-family-profiles-v1'));delete old.samplingVersion;
      for(const p of Object.values(old.profiles))p.fields.sampleMode='3';
      localStorage.setItem('kala-family-profiles-v1',JSON.stringify(old));setupSavedProfiles();
      const migrated=Object.values(savedProfiles).every(p=>p.fields.sampleMode==='auto');
      $('sampleMode').value='3';captureActiveProfile();persistProfiles();setupSavedProfiles();
      const preservesChoice=$('sampleMode').value==='3';$('sampleMode').value='auto';scoreCache.clear();
      return migrated&&preservesChoice;
    });
    assert(migration,'Upgrade the old default once; preserve later explicit coarse-preview choices');
    const validation = await page.evaluate(() => { const r = runValidationSuite(); return { requiredPass: r.requiredPass, requiredFail: r.requiredFail, syntheticPass: r.syntheticPass, syntheticFail: r.syntheticFail, devata: referenceDevataRegression()?.ok }; });
    assert.equal(validation.requiredFail, 0);
    console.log('Built-in validation:', validation);
    assert.deepEqual(errors, []);
    console.log('PASS: 3,888 domain/MD–AD assessments; asymmetric friendship, dignity boundaries, independent varga, conditional cautions, no self boost, BNN method separation, dasha partition, bounded scores and mobile coverage UI.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
