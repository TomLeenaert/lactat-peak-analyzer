import { calculate, type CalculationResults, type StepData } from '@/lib/lactate-math';

export const DEMO_ATHLETE = {
  name: 'Persoon A',
  club: '',
  sport: 'Lopen',
  goal: 'Drempeltest veldcondities',
  testDate: '2026-03-08',
  restingLactate: 0.8,
};

export const DEMO_STEPS: StepData[] = [
  { speed: 10, lactate: 0.8, hr: 136, watt: 0, distance: 1200, time: 422 },
  { speed: 11.5, lactate: 0.8, hr: 152, watt: 0, distance: 1200, time: 372 },
  { speed: 13, lactate: 0.8, hr: 171, watt: 0, distance: 1200, time: 327 },
  { speed: 14.52, lactate: 2.1, hr: 181, watt: 0, distance: 1200, time: 301 },
  { speed: 16, lactate: 5.7, hr: 195, watt: 0, distance: 1200, time: 261 },
];

const demoResults = calculate(DEMO_STEPS, DEMO_ATHLETE.restingLactate);

if (typeof demoResults === 'string') {
  throw new Error(`Demo data invalid: ${demoResults}`);
}

export const DEMO_RESULTS: CalculationResults = demoResults;