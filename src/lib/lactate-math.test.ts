import { describe, it, expect } from 'vitest';
import { calculate, interpolateThreshold, type StepData, type CalculationResults } from './lactate-math';

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

  it('(b) niet-monotone fit: vangrail overschrijft en THRESHOLD_INTERPOLATED vuurt', () => {
    const r = ok(calculate(mk([
      [10, 1.5, 140], [11, 3.6, 150], [12, 1.8, 158],
      [13, 2.0, 166], [14, 5.5, 174], [15, 9.0, 182], [16, 12.0, 188],
    ]), 1.5));
    expect(codes(r)).toContain('THRESHOLD_INTERPOLATED');
    expect(r.lt1.interpolated || r.lt2.interpolated).toBe(true);
    expect(r.lt1.best).toBeGreaterThanOrEqual(10);
    expect(r.lt1.best).toBeLessThanOrEqual(16);
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

  it('(d) omgekeerde volgorde: THRESHOLD_ORDER vuurt en de orde wordt hersteld indien mogelijk', () => {
    const r = ok(calculate(mk([
      [10, 3.9, 140], [11, 4.1, 150], [12, 4.15, 158],
      [13, 4.2, 166], [14, 4.3, 174], [15, 4.4, 182],
    ]), 1.5));
    expect(codes(r)).toContain('THRESHOLD_ORDER');
    // Herstel enkel wanneer de interpolatie een hogere snelheid oplevert
    if (r.lt2.interp !== null && r.lt2.interp !== undefined && r.lt2.interp > r.lt1.best) {
      expect(r.lt2.best).toBe(r.lt2.interp);
    }

  });
});
