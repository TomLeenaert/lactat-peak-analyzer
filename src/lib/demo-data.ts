import { calculate, type CalculationResults, type StepData } from '@/lib/lactate-math';

export const DEMO_ATHLETE = {
  name: 'Demo-atleet Sarah Vermeulen',
  club: 'North Track Lab',
  sport: 'Lopen - 10 km / halve marathon',
  goal: 'Periodieke drempelopvolging voor coaches en prestatieteams',
  testDate: '2026-03-08',
  restingLactate: 1.0,
};

export const DEMO_STEPS: StepData[] = [
  { speed: 9, lactate: 0.9, hr: 128, watt: 180, distance: 1600, time: 640 },
  { speed: 10, lactate: 1.0, hr: 138, watt: 210, distance: 1600, time: 576 },
  { speed: 11, lactate: 1.2, hr: 148, watt: 240, distance: 1600, time: 524 },
  { speed: 12, lactate: 1.5, hr: 155, watt: 270, distance: 1600, time: 480 },
  { speed: 13, lactate: 2.1, hr: 163, watt: 300, distance: 1600, time: 443 },
  { speed: 14, lactate: 3.0, hr: 171, watt: 330, distance: 1600, time: 411 },
  { speed: 15, lactate: 4.5, hr: 178, watt: 360, distance: 1600, time: 384 },
  { speed: 16, lactate: 7.2, hr: 186, watt: 390, distance: 1600, time: 360 },
];

const demoResults = calculate(DEMO_STEPS, DEMO_ATHLETE.restingLactate);

if (typeof demoResults === 'string') {
  throw new Error(`Demo data invalid: ${demoResults}`);
}

export const DEMO_RESULTS: CalculationResults = demoResults;