// ============ MATH HELPERS ============

export interface StepData {
  speed: number;
  lactate: number;
  hr: number;
  watt: number;
  distance?: number; // meters per step (from protocol)
  time?: number; // seconds to complete the step
}

export interface LT1Results {
  obla: number | null;
  bsln: number | null;
  loglog: number | null;
  best: number;
}

export interface LT2Results {
  obla: number | null;
  dmax: number | null;
  moddmax: number | null;
  best: number;
}

export interface CalculationResults {
  coeffs: number[];
  r2: number;
  speeds: number[];
  lactates: number[];
  hrs: number[];
  watts: number[];
  restLac: number;
  minActiveLac: number;
  lt1: LT1Results;
  lt2: LT2Results;
  modStartIdx: number;
}

export interface ZoneData {
  name: string;
  label: string;
  color: string;
  from: number;
  to: number;
  desc: string;
}

function transpose(M: number[][]): number[][] {
  const rows = M.length, cols = M[0].length;
  const T: number[][] = [];
  for (let j = 0; j < cols; j++) {
    T.push([]);
    for (let i = 0; i < rows; i++) {
      T[j].push(M[i][j]);
    }
  }
  return T;
}

function matMulFull(A: number[][], B: number[][]): number[][] {
  const m = A.length, n = A[0].length, p = B[0].length;
  const C = Array.from({ length: m }, () => Array(p).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < p; j++)
      for (let k = 0; k < n; k++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

function matVecMul(A: number[][], v: number[]): number[] {
  return A.map(row => row.reduce((s, a, i) => s + a * v[i], 0));
}

function solveLinear4(A: number[][], b: number[]): number[] {
  const n = 4;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    if (Math.abs(M[col][col]) < 1e-12) continue;
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

export function polyFit3(xs: number[], ys: number[]): number[] {
  const n = xs.length;
  const X: number[][] = [];
  for (let i = 0; i < n; i++) {
    X.push([xs[i] ** 3, xs[i] ** 2, xs[i], 1]);
  }
  const XT = transpose(X);
  const A = matMulFull(XT, X);
  const B = matVecMul(XT, ys);
  return solveLinear4(A, B);
}

export function polyEval(coeffs: number[], x: number): number {
  const [a, b, c, d] = coeffs;
  return a * x ** 3 + b * x ** 2 + c * x + d;
}

export function rSquared(xs: number[], ys: number[], coeffs: number[]): number {
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = xs.reduce((s, x, i) => s + (ys[i] - polyEval(coeffs, x)) ** 2, 0);
  return 1 - ssRes / ssTot;
}

export function findSpeedAtLactate(coeffs: number[], targetLac: number, xMin: number, xMax: number): number {
  for (let iter = 0; iter < 100; iter++) {
    const mid = (xMin + xMax) / 2;
    const val = polyEval(coeffs, mid);
    if (Math.abs(val - targetLac) < 0.001) return mid;
    if (val < targetLac) xMin = mid; else xMax = mid;
  }
  return (xMin + xMax) / 2;
}

export function interpolateHR(speed: number, speeds: number[], hrs: number[]): number {
  if (speed <= speeds[0]) return hrs[0];
  if (speed >= speeds[speeds.length - 1]) return hrs[hrs.length - 1];
  for (let i = 0; i < speeds.length - 1; i++) {
    if (speed >= speeds[i] && speed <= speeds[i + 1]) {
      const frac = (speed - speeds[i]) / (speeds[i + 1] - speeds[i]);
      return Math.round(hrs[i] + frac * (hrs[i + 1] - hrs[i]));
    }
  }
  return hrs[hrs.length - 1];
}

export function interpolateWatt(speed: number, speeds: number[], watts: number[]): number {
  const validWatts = watts.filter(w => w > 0);
  if (validWatts.length === 0) return 0;
  if (speed <= speeds[0]) return watts[0];
  if (speed >= speeds[speeds.length - 1]) return watts[watts.length - 1];
  for (let i = 0; i < speeds.length - 1; i++) {
    if (speed >= speeds[i] && speed <= speeds[i + 1]) {
      const frac = (speed - speeds[i]) / (speeds[i + 1] - speeds[i]);
      return Math.round(watts[i] + frac * (watts[i + 1] - watts[i]));
    }
  }
  return watts[watts.length - 1];
}

export function formatPace(speedKmh: number): string {
  if (!speedKmh || speedKmh <= 0) return '-';
  const minPerKm = 60 / speedKmh;
  let mins = Math.floor(minPerKm);
  let secs = Math.round((minPerKm - mins) * 60);
  if (secs === 60) { mins += 1; secs = 0; }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace400(speedKmh: number): string {
  if (!speedKmh || speedKmh <= 0) return '-';
  const minPer400 = (60 / speedKmh) * 0.4;
  const mins = Math.floor(minPer400);
  const secs = Math.round((minPer400 - mins) * 60);
  if (secs === 60) return `${mins + 1}:00`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function linRegError(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den > 0 ? num / den : 0;
  const intercept = my - slope * mx;
  return xs.reduce((s, x, i) => s + (ys[i] - slope * x - intercept) ** 2, 0);
}

export function calculate(testData: StepData[], restingLactate: number): CalculationResults | string {
  const valid = testData.filter(r => r.speed > 0 && r.lactate > 0);
  if (valid.length < 4) {
    return 'Je hebt minstens 4 geldige datapunten nodig (snelheid + lactaat ingevuld).';
  }

  const speeds = valid.map(r => r.speed);
  const lactates = valid.map(r => r.lactate);
  const hrs = valid.map(r => r.hr);
  const watts = valid.map(r => r.watt || 0);
  const restLac = restingLactate || lactates[0];

  const coeffs = polyFit3(speeds, lactates);
  const r2 = rSquared(speeds, lactates, coeffs);

  const xMin = speeds[0];
  const xMax = speeds[speeds.length - 1];

  // LT1: OBLA 2.0
  let lt1_obla: number | null = null;
  if (polyEval(coeffs, xMin) < 2.0 && polyEval(coeffs, xMax) > 2.0) {
    lt1_obla = findSpeedAtLactate(coeffs, 2.0, xMin, xMax);
  }

  // LT1: Baseline + 0.5
  const minActiveLac = Math.min(...lactates.slice(0, 3));
  const bslnTarget = minActiveLac + 0.5;
  let lt1_bsln: number | null = null;
  if (polyEval(coeffs, xMin) < bslnTarget && polyEval(coeffs, xMax) > bslnTarget) {
    lt1_bsln = findSpeedAtLactate(coeffs, bslnTarget, xMin, xMax);
  }

  // LT1: Log-Log
  let lt1_loglog: number | null = null;
  try {
    const logSpeeds = speeds.map(s => Math.log(s));
    const logLactates = lactates.map(l => Math.log(Math.max(l, 0.1)));
    let bestError = Infinity;
    let bestSplit = 2;
    for (let split = 2; split < logSpeeds.length - 1; split++) {
      const err1 = linRegError(logSpeeds.slice(0, split + 1), logLactates.slice(0, split + 1));
      const err2 = linRegError(logSpeeds.slice(split), logLactates.slice(split));
      const totalErr = err1 + err2;
      if (totalErr < bestError) {
        bestError = totalErr;
        bestSplit = split;
      }
    }
    lt1_loglog = speeds[bestSplit];
  } catch (_) { /* ignore */ }

  const lt1_best = lt1_bsln || lt1_loglog || lt1_obla || xMin;

  // LT2: OBLA 4.0
  let lt2_obla: number | null = null;
  if (polyEval(coeffs, xMin) < 4.0 && polyEval(coeffs, xMax) > 4.0) {
    lt2_obla = findSpeedAtLactate(coeffs, 4.0, xMin, xMax);
  }

  // LT2: Dmax
  const slopeAB = (lactates[lactates.length - 1] - lactates[0]) / (speeds[speeds.length - 1] - speeds[0]);
  const qa = 3 * coeffs[0];
  const qb = 2 * coeffs[1];
  const qc = coeffs[2] - slopeAB;
  const disc = qb ** 2 - 4 * qa * qc;
  let lt2_dmax: number | null = null;
  if (disc >= 0 && qa !== 0) {
    const r1 = (-qb + Math.sqrt(disc)) / (2 * qa);
    const r2val = (-qb - Math.sqrt(disc)) / (2 * qa);
    const candidates = [r1, r2val].filter(r => r >= xMin && r <= xMax);
    if (candidates.length > 0) lt2_dmax = Math.max(...candidates);
  }

  // LT2: Modified Dmax
  let lt2_moddmax: number | null = null;
  let modStartIdx = 0;

  // Statistische adaptieve startpuntdetectie
  const bslnPoints = lactates.filter(l => l < restLac + 1.0);
  if (bslnPoints.length >= 3) {
    const bslnMean = bslnPoints.reduce((a, b) => a + b, 0) / bslnPoints.length;
    const bslnSD = Math.sqrt(
      bslnPoints.reduce((s, l) => s + (l - bslnMean) ** 2, 0) / bslnPoints.length
    );
    const trigger = bslnMean + Math.max(2 * bslnSD, 0.2);
    for (let i = 1; i < lactates.length; i++) {
      if (lactates[i] > trigger) {
        modStartIdx = Math.max(0, i - 1);
        break;
      }
    }
  } else {
    // Fallback: vaste drempel van 0.4 mmol/L stijging per stap
    for (let i = 1; i < lactates.length; i++) {
      if (lactates[i] - lactates[i - 1] > 0.4) {
        modStartIdx = Math.max(0, i - 1);
        break;
      }
    }
  }
  const modStartSpeed = speeds[modStartIdx];
  const modStartLac = lactates[modStartIdx];
  const slopeMod = (lactates[lactates.length - 1] - modStartLac) / (speeds[speeds.length - 1] - modStartSpeed);
  const qam = 3 * coeffs[0];
  const qbm = 2 * coeffs[1];
  const qcm = coeffs[2] - slopeMod;
  const discm = qbm ** 2 - 4 * qam * qcm;
  if (discm >= 0 && qam !== 0) {
    const r1m = (-qbm + Math.sqrt(discm)) / (2 * qam);
    const r2m = (-qbm - Math.sqrt(discm)) / (2 * qam);
    const candidatesm = [r1m, r2m].filter(r => r >= modStartSpeed && r <= xMax);
    if (candidatesm.length > 0) lt2_moddmax = Math.max(...candidatesm);
  }

  const lt2_best = lt2_moddmax || lt2_dmax || lt2_obla || xMax;

  return {
    coeffs, r2, speeds, lactates, hrs, watts, restLac, minActiveLac,
    lt1: { obla: lt1_obla, bsln: lt1_bsln, loglog: lt1_loglog, best: lt1_best },
    lt2: { obla: lt2_obla, dmax: lt2_dmax, moddmax: lt2_moddmax, best: lt2_best },
    modStartIdx,
  };
}

export function getZones(results: CalculationResults): ZoneData[] {
  const lt1s = results.lt1.best;
  const lt2s = results.lt2.best;
  const maxSpeed = results.speeds[results.speeds.length - 1];

  // Ensure Zone 3 has minimum width: at least 0.3 km/h gap
  const zone3Top = lt2s * 0.95;
  const minZoneWidth = 0.3; // km/h
  const adjustedZone3Top = (zone3Top - lt1s) < minZoneWidth ? lt1s + minZoneWidth : zone3Top;
  // If adjusted zone3Top exceeds lt2s, cap it and split evenly
  const finalZone3Top = Math.min(adjustedZone3Top, lt2s - minZoneWidth * 0.5);
  const zone4Start = finalZone3Top;

  return [
    { name: 'Zone 1', label: 'Herstel', color: '#60a5fa', from: 0, to: lt1s * 0.85, desc: 'Zeer licht, actief herstel' },
    { name: 'Zone 2', label: 'Aeroob (Endurance)', color: '#34d399', from: lt1s * 0.85, to: lt1s, desc: 'Duurloop, vetverbranding, basis' },
    { name: 'Zone 3', label: 'Tempo', color: '#fbbf24', from: lt1s, to: finalZone3Top, desc: 'Stevig tempo, marathon/HM-tempo' },
    { name: 'Zone 4', label: 'Drempel', color: '#f97316', from: zone4Start, to: lt2s, desc: 'Rond anaerobe drempel, 10K-tempo' },
    { name: 'Zone 5', label: 'VO₂max', color: '#ef4444', from: lt2s, to: maxSpeed * 1.1, desc: 'Intervallen, maximale inspanning' },
  ];
}
