import { describe, it, expect } from 'vitest';
import { calculate, interpolateThreshold, getZones, type StepData, type CalculationResults } from './lactate-math';

const mk = (rows: [number, number, number][]): StepData[] =>
  rows.map(([speed, lactate, hr]) => ({ speed, lactate, hr, watt: 0 }));

const ok = (r: CalculationResults | string): CalculationResults => {
  if (typeof r === 'string') throw new Error(r);
  return r;
};

const codes = (r: CalculationResults) => r.warnings.map(w => w.code);

describe('interpolateThreshold', () => {
  it('vindt de eerste opwaartse kruising en interpoleert lineair', () => {
    const speeds = [10, 11, 12, 13];
    const lactates = [1.0, 1.5, 3.0, 5.0];
    expect(interpolateThreshold(2.0, speeds, lactates)).toBeCloseTo(11 + (0.5 / 1.5), 5);
    expect(interpolateThreshold(4.0, speeds, lactates)).toBeCloseTo(12.5, 5);
  });

  it('geeft null wanneer het doel nooit bereikt wordt (geen extrapolatie)', () => {
    expect(interpolateThreshold(4.0, [10, 11, 12], [1.0, 1.5, 2.5])).toBeNull();
  });

  it('geeft null wanneer het doel al onder het eerste punt ligt', () => {
    expect(interpolateThreshold(1.0, [10, 11, 12], [1.5, 2.5, 4.5])).toBeNull();
  });
});

describe('calculate — vangrail interpolatie', () => {
  it('(a) propere stijgende curve: geen vangrail-waarschuwingen', () => {
    const r = ok(calculate(mk([
      [10, 1.4, 140], [11, 1.7, 150], [12, 2.2, 158],
      [13, 3.0, 166], [14, 4.2, 174], [15, 6.0, 182], [16, 8.2, 188],
    ]), 1.4));
    expect(codes(r)).not.toContain('OBLA_NOT_REACHED');
    expect(codes(r)).not.toContain('THRESHOLD_ORDER');
    expect(r.lt2.best).toBeGreaterThan(r.lt1.best);
    expect(r.lt2.oblaReached).toBe(true);
  });

  it('(b) niet-monotone fit: blijft binnen het meetbereik en signaleert NON_MONOTONIC', () => {
    const r = ok(calculate(mk([
      [10, 1.5, 140], [11, 3.6, 150], [12, 1.8, 158],
      [13, 2.0, 166], [14, 5.5, 174], [15, 9.0, 182], [16, 12.0, 188],
    ]), 1.5));
    expect(codes(r)).toContain('NON_MONOTONIC');
    expect(r.lt2.best).toBeGreaterThan(r.lt1.best);
    expect(r.lt1.best).toBeGreaterThanOrEqual(10);
    expect(r.lt1.best).toBeLessThanOrEqual(16);
  });

  it('(f) getrainde loper: aerobe drempel ligt duidelijk onder de anaerobe', () => {
    const speeds = [12, 14, 15, 16, 17, 18, 19, 20];
    const lac = [0.9, 0.7, 0.7, 0.9, 1.3, 1.6, 3.0, 5.5];
    const r = ok(calculate(mk(speeds.map((s, i) => [s, lac[i], 120 + i * 8] as [number, number, number])), 0.7));
    const ratio = r.lt1.best / r.lt2.best;
    expect(ratio).toBeGreaterThan(0.70);
    expect(ratio).toBeLessThan(0.90);
    expect(['LEmin', 'Baseline+0.3']).toContain(r.lt1.method);
  });


  it('(c) max lactaat < 4.0: OBLA_NOT_REACHED en geen onmogelijk snelle waarde', () => {
    const r = ok(calculate(mk([
      [10, 1.2, 130], [11, 1.5, 140], [12, 1.9, 148], [13, 2.4, 156], [14, 3.1, 164],
    ]), 1.2));
    expect(codes(r)).toContain('OBLA_NOT_REACHED');
    expect(r.lt2.oblaReached).toBe(false);
    expect(r.lt2.best).toBeLessThanOrEqual(14);
    expect(r.lt2.best).toBeGreaterThan(0);
  });

  it('(d) omgekeerde volgorde: hersteld via interpolatie of anders THRESHOLD_ORDER', () => {
    const r = ok(calculate(mk([
      [10, 3.9, 140], [11, 4.1, 150], [12, 4.15, 158],
      [13, 4.2, 166], [14, 4.3, 174], [15, 4.4, 182],
    ]), 1.5));
    if (r.lt2.interp !== null && r.lt2.interp !== undefined && r.lt2.interp > r.lt1.best) {
      expect(r.lt2.best).toBe(r.lt2.interp);
      expect(codes(r)).toContain('THRESHOLD_INTERPOLATED');
    } else {
      expect(codes(r)).toContain('THRESHOLD_ORDER');
    }
  });

  it('(e) dip in de eerste trappen maar schone stijging bovenaan behoudt Modified Dmax', () => {
    const r = ok(calculate(mk([
      [12, 0.9, 130], [14, 0.7, 138], [15, 0.7, 145], [16, 0.9, 152],
      [17, 1.3, 160], [18, 1.6, 168], [19, 3.0, 176], [20, 5.5, 186],
    ]), 0.9));
    // De lokale monotonie-check mag de Modified Dmax-waarde niet meer wegvangen:
    // er is geen "fit niet betrouwbaar"-override op de anaerobe drempel.
    expect(r.warnings.some(w => /Anaerobe drempel is bepaald via interpolatie/.test(w.message))).toBe(false);
    expect(r.lt2.moddmax).not.toBeNull();
    // Modified Dmax blijft leidend, tenzij de volgorde-herstelstap ingrijpt.
    expect(['Modified Dmax', 'Interpolation']).toContain(r.lt2.method);
  });
});

describe('getZones — geen negatieve zonebreedtes', () => {
  it('(bug 1) vlakke curve met drempelomkering levert geen negatieve zone op', () => {
    const r = ok(calculate(mk([
      [10, 4.2, 140], [11, 4.4, 148], [12, 4.5, 156], [13, 4.6, 164],
      [14, 4.7, 172], [15, 4.8, 180], [16, 4.9, 186],
    ]), 1.5));
    const zones = getZones(r);
    zones.forEach(z => expect(z.to - z.from).toBeGreaterThanOrEqual(0));
  });
});

describe('detectOutliers — robuuste MAD-score', () => {
  const smooth: [number, number, number][] = [
    [10, 1.2, 130], [11, 1.5, 138], [12, 1.9, 146], [13, 2.5, 154],
    [14, 3.4, 162], [15, 4.8, 170], [16, 6.8, 178],
  ];

  it('(bug 2) trap 4 met +2,5 mmol/L afwijking geeft OUTLIER', () => {
    const rows = smooth.map((row, i) => (i === 3 ? [row[0], row[1] + 2.5, row[2]] : row) as [number, number, number]);
    const r = ok(calculate(mk(rows), 1.2));
    expect(codes(r)).toContain('OUTLIER');
  });

  it('dezelfde curve zonder uitschieter geeft geen OUTLIER', () => {
    const r = ok(calculate(mk(smooth), 1.2));
    expect(codes(r)).not.toContain('OUTLIER');
  });
});
