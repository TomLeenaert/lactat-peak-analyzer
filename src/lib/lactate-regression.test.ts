// ============================================================
// REGRESSIESUITE — vaste poort op de rekenlogica
// ------------------------------------------------------------
// De volledige validatieset telt 331 testscenario's (opgebouwd uit
// gepubliceerde lactaattesten: Zenodo 10.5281/zenodo.10841412,
// Human Performance Lab Trinity College Dublin, PLOS ONE 0204696).
// Die volledige set leeft BUITEN deze repo.
//
// De 55 cases hieronder (35 echte testen over het volledige
// drempelbereik + alle 20 edge cases) zijn de vaste poort.
// Elke verschuiving van meer dan 0,05 km/h op ae/an is een BEWUSTE
// beslissing: pas de fixture niet aan om de suite groen te krijgen,
// maar documenteer waarom het model verandert.
// ============================================================

import { describe, it, expect } from 'vitest';
import { calculate, type StepData } from './lactate-math';
import fixtures from './__fixtures__/lactate-regression.json';

interface RegressionCase {
  id: string;
  rest: number;
  s: number[][];
  ae?: number;
  an?: number;
  aeM?: string;
  anM?: string;
  err?: boolean;
}

const cases = fixtures as RegressionCase[];
const TOL = 0.05;

const toSteps = (s: number[][]): StepData[] =>
  s.map(([speed, lactate, hr]) => ({ speed, lactate, hr, watt: 0 }));

describe('lactate regression baseline (55 cases)', () => {
  it.each(cases.map(c => [c.id, c] as const))('%s', (_id, c) => {
    const steps = toSteps(c.s);
    const res = calculate(steps, c.rest);

    if (c.err) {
      expect(typeof res).toBe('string');
      return;
    }

    expect(typeof res).not.toBe('string');
    if (typeof res === 'string') return;

    expect(res.lt1.best).toBeCloseTo(c.ae!, 10 /* placeholder, replaced below */ * 0);
    expect(Math.abs(res.lt1.best - c.ae!)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(res.lt2.best - c.an!)).toBeLessThanOrEqual(TOL);
    expect(res.lt1.method).toBe(c.aeM);
    expect(res.lt2.method).toBe(c.anM);

    // Invarianten die voor élke geldige case gelden
    const speeds = c.s.map(r => r[0]);
    const lo = Math.min(...speeds);
    const hi = Math.max(...speeds);
    expect(res.lt2.best).toBeGreaterThan(res.lt1.best);
    expect(res.lt1.best).toBeGreaterThanOrEqual(lo);
    expect(res.lt1.best).toBeLessThanOrEqual(hi);
    expect(res.lt2.best).toBeGreaterThanOrEqual(lo);
    expect(res.lt2.best).toBeLessThanOrEqual(hi);
  });
});
