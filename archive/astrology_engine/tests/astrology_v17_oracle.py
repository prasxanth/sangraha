"""Independent Swiss/Moshier fixture generator; requires pyswisseph, never shipped to the app."""
import json
import sys
from pathlib import Path
import swisseph as swe

work = Path(sys.argv[1])
swe.set_sid_mode(swe.SIDM_LAHIRI)
x = json.loads((work / 'offline.json').read_text())
dates = [x['chart']['birthMs']]
if (work / 'dates.json').exists():
    dates += json.loads((work / 'dates.json').read_text())
ids = {'Sun': 0, 'Moon': 1, 'Mercury': 2, 'Venus': 3, 'Mars': 4, 'Jupiter': 5,
       'Saturn': 6, 'Uranus': 7, 'Neptune': 8, 'Pluto': 9, 'Mean Node': 10}
fixtures = {}
for ms in dates:
    jd = ms / 86400000 + 2440587.5
    fixtures[f'{jd:.8f}'] = {
        'ayan': swe.get_ayanamsa_ut(jd),
        'planets': {n: list(swe.calc_ut(jd, i, swe.FLG_MOSEPH | swe.FLG_SPEED)[0]) for n, i in ids.items()}}
(work / 'fixtures.json').write_text(json.dumps(fixtures))
# Independently derive the post-birth Mercury MD from lunar mansion balance.
birth = x['chart']['birthMs']
natal = fixtures[f"{x['chart']['jd']:.8f}"]
moon = (natal['planets']['Moon'][0] - natal['ayan']) % 360
sequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
years = dict(zip(sequence, [7, 20, 6, 10, 7, 18, 16, 19, 17]))
span = 360 / 27
index = int(moon / span) % 9
year_ms = 365.2425 * 86400000
start = birth - (moon % span) / span * years[sequence[index]] * year_ms
for i in range(18):
    lord = sequence[(index + i) % 9]
    end = start + years[lord] * year_ms
    if lord == 'Mercury' and start > birth:
        (work / 'independent-dasha.json').write_text(json.dumps({'a': start, 'b': end, 'version': swe.version, 'moon': moon}))
        break
    start = end
