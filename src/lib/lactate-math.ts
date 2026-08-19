// ============================================================
// MyLactest rekenmodel voor lactaatdrempelbepaling
// ------------------------------------------------------------
// LT1 (Aerobic)   — primary: Baseline + 0.5 mmol/L
// LT2 (Anaerobic) — primary: Modified Dmax (Bishop variant)
//
// Curvefit is adaptief:
//   4 punten   → lineair
//   5-6 punten → quadratisch
//   7+ punten  → cubic
//
// Snelheid wordt voor numerieke stabiliteit genormaliseerd naar [0,1]
// tijdens fitting. De geretourneerde `coeffs` worden teruggetransformeerd
// naar de standaard cubic-vorm [a3,a2,a1,a0] zodat polyEval(coeffs, x)
// met ráwe snelheid blijft werken (backwards compatible met bestaande UI).
// ============================================================

// ============ TYPES (backwards compatible + extras) ============

export interface StepData {
  speed: number;
  lactate: number;
  hr: number;
  watt: number;
  distance?: number;
  time?: number;
}

export interface LT1Results {
  obla: number | null;
  bsln: number | null;
  loglog: number | null;
  best: number;
  method: string;
  hr: number;
  watt: number;
  /** true wanneer de polynoomwaarde overruled is door interpolatie op de meetpunten */
  interpolated?: boolean;
  /** snelheid via interpolatie op ruwe meetpunten (null = doel niet bereikt) */
  interp?: number | null;
}

export interface LT2Results {
  obla: number | null;
  dmax: number | null;
  moddmax: number | null;
  best: number;
  method: string;
  hr: number;
  watt: number;
  /** true wanneer de polynoomwaarde overruled is door interpolatie op de meetpunten */
  interpolated?: boolean;
  /** snelheid via interpolatie op ruwe meetpunten bij 4.0 mmol/L (null = niet bereikt) */
  interp?: number | null;
  /** false wanneer het maximale gemeten lactaat onder 4.0 mmol/L bleef */
  oblaReached?: boolean;
}

export interface FitQuality {
  r2: number;
  rmse: number;
  fitQuality: 'good' | 'moderate' | 'poor';
}

export type WarningSeverity = 'info' | 'warning';
export interface CalcWarning {
  severity: WarningSeverity;
  code: 'LOW_DATA_LINEAR' | 'MEDIUM_DATA_QUADRATIC' | 'OUTLIER' | 'NON_MONOTONIC' | 'SUBMAXIMAL_ALLOUT' | 'LT_GAP_LARGE' | 'THRESHOLD_INTERPOLATED' | 'OBLA_NOT_REACHED' | 'THRESHOLD_ORDER';
  message: string;
  affectedStep?: number;
}


export interface CalculationResults {
  /** Cubic-form coefficients [a3,a2,a1,a0] in RAW speed-space (km/h).
   *  For lineair/quadratisch zijn de hogere ordes gewoon 0. */
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
  // Nieuwe metadata (niet-breaking)
  curveType: 'linear' | 'quadratic' | 'cubic';
  quality: FitQuality;
  warnings: CalcWarning[];
}

export interface ZoneData {
  name: string;
  label: string;
  color: string;
  from: number;
  to: number;
  desc: string;
}

// ============ INTERNE HELPERS ============

interface XScale { min: number; range: number; }

function transpose(M: number[][]): number[][] {
  const rows = M.length, cols = M[0].length;
  const T: number[][] = [];
  for (let j = 0; j < cols; j++) { T.push([]); for (let i = 0; i < rows; i++) T[j].push(M[i][j]); }
  return T;
}
function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length, n = A[0].length, p = B[0].length;
  const C = Array.from({ length: m }, () => Array(p).fill(0));
  for (let i = 0; i < m; i++) for (let j = 0; j < p; j++) for (let k = 0; k < n; k++) C[i][j] += A[i][k] * B[k][j];
  return C;
}
function matVec(A: number[][], v: number[]): number[] {
  return A.map(row => row.reduce((s, a, i) => s + a * v[i], 0));
}
function gaussSolve(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    if (Math.abs(M[i][i]) < 1e-12) throw new Error('Singular matrix');
    for (let k = i + 1; k < n; k++) {
      const f = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

// Polyfit op genormaliseerde x = (x - min)/range, returns asc-power coeffs [c0,c1,..,cd]
function polyFitNorm(x: number[], y: number[], degree: number): { coeffs: number[]; xScale: XScale } {
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const xRange = xMax - xMin;
  if (xRange <= 0) throw new Error('Snelheidsbereik is nul');
  const xn = x.map(xi => (xi - xMin) / xRange);
  const n = x.length, m = degree + 1;
  const X: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let k = 0; k < m; k++) row.push(Math.pow(xn[i], k));
    X.push(row);
  }
  const XT = transpose(X);
  const A = matMul(XT, X);
  const b = matVec(XT, y);
  return { coeffs: gaussSolve(A, b), xScale: { min: xMin, range: xRange } };
}

function evalNorm(coeffs: number[], xScale: XScale, x: number): number {
  const u = (x - xScale.min) / xScale.range;
  let s = 0;
  for (let i = 0; i < coeffs.length; i++) s += coeffs[i] * Math.pow(u, i);
  return s;
}

function evalNormDeriv(coeffs: number[], xScale: XScale, x: number): number {
  const u = (x - xScale.min) / xScale.range;
  let d = 0;
  for (let i = 1; i < coeffs.length; i++) d += i * coeffs[i] * Math.pow(u, i - 1);
  return d / xScale.range;
}

// Denormaliseer asc-power coeffs ([c0..cd] op u=(x-m)/r) naar standaard cubic
// vorm [a3,a2,a1,a0] in raw x-space. Hogere ordes 0 als degree<3.
function denormalizeToCubic(coeffsAsc: number[], xs: XScale): number[] {
  const out = [0, 0, 0, 0]; // [a3,a2,a1,a0]
  const m = xs.min, r = xs.range;
  const fac = [1, 1, 2, 6];
  for (let i = 0; i < coeffsAsc.length; i++) {
    if (i > 3) break;
    const ci = coeffsAsc[i];
    const invR = ci / Math.pow(r, i);
    // expand (x - m)^i = sum_k C(i,k) x^k (-m)^(i-k)
    for (let k = 0; k <= i; k++) {
      const binom = fac[i] / (fac[k] * fac[i - k]);
      const term = invR * binom * Math.pow(-m, i - k);
      out[3 - k] += term;
    }
  }
  return out;
}

// ============ PUBLIC: evaluatie op DENORMALISEERDE cubic coeffs ============

export function polyEval(coeffs: number[], x: number): number {
  // coeffs: [a3,a2,a1,a0]
  const [a, b, c, d] = coeffs;
  return a * x * x * x + b * x * x + c * x + d;
}

export function rSquared(xs: number[], ys: number[], coeffs: number[]): number {
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = xs.reduce((s, x, i) => s + (ys[i] - polyEval(coeffs, x)) ** 2, 0);
  return ssTot > 0 ? 1 - ssRes / ssTot : 1;
}

// Sample-based root finding op denormaliseerde cubic — robuust voor niet-monotone fits.
export function findSpeedAtLactate(coeffs: number[], targetLac: number, xMin: number, xMax: number): number {
  const N = 500;
  const step = (xMax - xMin) / N;
  let prevDiff = polyEval(coeffs, xMin) - targetLac;
  for (let i = 1; i <= N; i++) {
    const x = xMin + i * step;
    const diff = polyEval(coeffs, x) - targetLac;
    if (prevDiff === 0) return xMin + (i - 1) * step;
    if (prevDiff * diff <= 0) {
      const xPrev = x - step;
      return diff === prevDiff ? x : xPrev - prevDiff * step / (diff - prevDiff);
    }
    prevDiff = diff;
  }
  return (xMin + xMax) / 2;
}

function findSpeedAtLactateOrNull(coeffs: number[], target: number, xMin: number, xMax: number): number | null {
  const lo = polyEval(coeffs, xMin), hi = polyEval(coeffs, xMax);
  if ((lo - target) * (hi - target) > 0) {
    // Geen sign-change op de randen — controleer toch via sample voor niet-monotoon
    const N = 500;
    const step = (xMax - xMin) / N;
    let prev = lo - target;
    for (let i = 1; i <= N; i++) {
      const diff = polyEval(coeffs, xMin + i * step) - target;
      if (prev * diff <= 0) return findSpeedAtLactate(coeffs, target, xMin, xMax);
      prev = diff;
    }
    return null;
  }
  return findSpeedAtLactate(coeffs, target, xMin, xMax);
}

// ============ INTERPOLATIE ============

function interpolateAt(target: number, speeds: number[], values: number[], skipZeros: boolean): number {
  const pts = speeds.map((s, i) => ({ s, v: values[i] })).filter(p => !skipZeros || p.v > 0);
  if (pts.length === 0) return 0;
  if (target <= pts[0].s) return Math.round(pts[0].v);
  if (target >= pts[pts.length - 1].s) return Math.round(pts[pts.length - 1].v);
  for (let i = 1; i < pts.length; i++) {
    if (target <= pts[i].s) {
      const t = (target - pts[i - 1].s) / (pts[i].s - pts[i - 1].s);
      return Math.round(pts[i - 1].v + t * (pts[i].v - pts[i - 1].v));
    }
  }
  return Math.round(pts[pts.length - 1].v);
}

export function interpolateHR(speed: number, speeds: number[], hrs: number[]): number {
  return interpolateAt(speed, speeds, hrs, true);
}
export function interpolateWatt(speed: number, speeds: number[], watts: number[]): number {
  return interpolateAt(speed, speeds, watts, true);
}

// ============ FORMATTERS ============

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

// ============ DMAX (geometrisch correct: max verticale afstand boven secant) ============

function computeDmax(
  coeffsAsc: number[], xs: XScale,
  speeds: number[], lactates: number[],
  startIdx: number, endIdx: number,
): number | null {
  if (startIdx >= endIdx || endIdx >= speeds.length) return null;
  const v1 = speeds[startIdx], v2 = speeds[endIdx];
  const L1 = lactates[startIdx], L2 = lactates[endIdx];
  if (v2 <= v1) return null;
  const slope = (L2 - L1) / (v2 - v1);
  const intercept = L1 - slope * v1;
  // Classic Dmax (Cheng 1992): max PERPENDICULAR distance van curve naar chord.
  // Voor argmax is dit equivalent met max |vertical distance| (verschilt enkel
  // door constante factor 1/√(1+slope²)). Lactaatcurves zijn convex-up en
  // liggen onder het koord; we nemen daarom de absolute waarde.
  const N = 500;
  const step = (v2 - v1) / N;
  let bestV = v1, bestDist = -Infinity;
  for (let i = 1; i < N; i++) {
    const v = v1 + i * step;
    const dist = Math.abs(evalNorm(coeffsAsc, xs, v) - (slope * v + intercept));
    if (dist > bestDist) { bestDist = dist; bestV = v; }
  }
  // Vereis significante afstand én niet op de rand (geen numeriek artefact)
  const onBoundary = (bestV - v1) < step * 1.5 || (v2 - bestV) < step * 1.5;
  return bestDist > 0.05 && !onBoundary ? bestV : null;
}

// ModDmax startpunt (Bishop): eerste trap waar ΔL ≥ 0.4 mmol/L → startIdx = i-1
function findModDmaxStart(lactates: number[], restLac: number): number {
  for (let i = 1; i < lactates.length; i++) {
    if (lactates[i] - lactates[i - 1] >= 0.4) return Math.max(0, i - 1);
  }
  // Fallback: laatste trap onder restLac+0.5
  let last = 0;
  for (let i = 0; i < lactates.length; i++) {
    if (lactates[i] < restLac + 0.5) last = i;
    else break;
  }
  return last;
}

// ============ LOG-LOG (twee-segment lineaire fit) ============

function linRegError(x: number[], y: number[]): number {
  if (x.length < 2) return Infinity;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumXX = x.reduce((s, xi) => s + xi * xi, 0);
  const den = n * sumXX - sumX * sumX;
  if (Math.abs(den) < 1e-12) return Infinity;
  const slope = (n * sumXY - sumX * sumY) / den;
  const inter = (sumY - slope * sumX) / n;
  return x.reduce((s, xi, i) => s + Math.pow(y[i] - (slope * xi + inter), 2), 0);
}

function computeLogLog(speeds: number[], lactates: number[]): number | null {
  if (speeds.length < 5) return null;
  const lv = speeds.map(Math.log);
  const ll = lactates.map(l => Math.log(Math.max(l, 0.1)));
  let bestSplit = -1, bestErr = Infinity;
  for (let split = 2; split < lv.length - 1; split++) {
    const e = linRegError(lv.slice(0, split), ll.slice(0, split)) + linRegError(lv.slice(split), ll.slice(split));
    if (e < bestErr) { bestErr = e; bestSplit = split; }
  }
  return bestSplit > 0 ? speeds[bestSplit] : null;
}

// ============ DIAGNOSTIEK ============

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function detectOutliers(speeds: number[], lactates: number[], coeffsAsc: number[], xs: XScale, warnings: CalcWarning[]) {
  const res = speeds.map((s, i) => lactates[i] - evalNorm(coeffsAsc, xs, s));
  // Robuuste score: mediaan + MAD i.p.v. mean/SD, want bij 6–9 trappen blaast
  // de uitschieter zelf de SD op waardoor hij nooit gedetecteerd wordt.
  const med = median(res);
  const mad = median(res.map(r => Math.abs(r - med)));
  if (mad < 0.05) return;
  res.forEach((r, i) => {
    const z = (0.6745 * (r - med)) / mad;
    if (Math.abs(z) > 3) {
      warnings.push({
        severity: 'warning', code: 'OUTLIER', affectedStep: i,
        message: `Trap ${i + 1} (${speeds[i]} km/h, ${lactates[i]} mmol/L) wijkt sterk af van de curve.`,
      });
    }
  });
}


/** Vindt de eerste snelheid waar de fit duidelijk daalt; null als monotoon stijgend. */
function findNonMonotonicPoint(coeffsAsc: number[], xs: XScale, xMin: number, xMax: number): number | null {
  const N = 100, step = (xMax - xMin) / N;
  for (let i = 1; i < N; i++) {
    const v = xMin + i * step;
    if (evalNormDeriv(coeffsAsc, xs, v) < -0.05) return v;
  }
  return null;
}

/** Daalt de fit binnen een venster van ± `halfWidth` km/h rond `at`? */
function isNonMonotonicNear(coeffsAsc: number[], xs: XScale, at: number, xMin: number, xMax: number, halfWidth = 1.0): boolean {
  const lo = Math.max(xMin, at - halfWidth), hi = Math.min(xMax, at + halfWidth);
  const N = 40, step = (hi - lo) / N;
  if (step <= 0) return false;
  for (let i = 0; i <= N; i++) {
    if (evalNormDeriv(coeffsAsc, xs, lo + i * step) < -0.05) return true;
  }
  return false;
}

function checkMonotonicity(coeffsAsc: number[], xs: XScale, xMin: number, xMax: number, warnings: CalcWarning[]) {
  const v = findNonMonotonicPoint(coeffsAsc, xs, xMin, xMax);
  if (v !== null) {
    warnings.push({
      severity: 'warning', code: 'NON_MONOTONIC',
      message: `Lactaatcurve daalt rond ${v.toFixed(1)} km/h — fysiologisch ongebruikelijk, controleer metingen.`,
    });
  }
}

// ============ MONOTONE INTERPOLATIE OP RUWE MEETPUNTEN ============
// Vangnet tegen de polynoomfit: echte lactaatwaarden stijgen na de baseline
// monotoon, dus een rechte lijn tussen twee opeenvolgende meetpunten is een
// veilige referentie. Geen extrapolatie buiten het gemeten bereik.

/**
 * Zoekt de EERSTE opwaartse kruising waar lactates[i-1] < target <= lactates[i]
 * en interpoleert lineair de bijhorende snelheid.
 * @returns snelheid, of null als het doel binnen het meetbereik nooit opwaarts
 *          gekruist wordt (dus niet extrapoleren).
 */
export function interpolateThreshold(target: number, speeds: number[], lactates: number[]): number | null {
  const n = Math.min(speeds.length, lactates.length);
  for (let i = 1; i < n; i++) {
    const l0 = lactates[i - 1], l1 = lactates[i];
    if (l0 < target && target <= l1) {
      const dl = l1 - l0;
      if (dl <= 0) return speeds[i];
      const t = (target - l0) / dl;
      return speeds[i - 1] + t * (speeds[i] - speeds[i - 1]);
    }
  }
  return null;
}

/** Verschil in tempo (s/km) tussen twee snelheden in km/h. */
function paceDiffSecPerKm(a: number, b: number): number {
  if (a <= 0 || b <= 0) return Infinity;
  return Math.abs((60 / a) - (60 / b)) * 60;
}


/**
 * Detecteer een submaximale all-out trap.
 * Heuristiek: de laatste trap is een "all-out" als haar snelheidssprong t.o.v.
 * de vorige trap duidelijk groter is dan de mediaan van de eerdere sprongen
 * (>= 1.6x). Een echte maximale inspanning verwachten we lactaat-stijging van
 * minstens ~3 mmol/L boven de voorlaatste trap. Anders waarschuwing.
 */
function checkAllOutSubmaximal(speeds: number[], lactates: number[], warnings: CalcWarning[]) {
  if (speeds.length < 4) return;
  const n = speeds.length;
  const increments: number[] = [];
  for (let i = 1; i < n - 1; i++) increments.push(speeds[i] - speeds[i - 1]);
  if (increments.length === 0) return;
  const sorted = [...increments].sort((a, b) => a - b);
  const medInc = sorted[Math.floor(sorted.length / 2)];
  const lastJump = speeds[n - 1] - speeds[n - 2];
  if (medInc <= 0 || lastJump < medInc * 1.6) return; // geen all-out detectie
  const lactateRise = lactates[n - 1] - lactates[n - 2];
  if (lactateRise < 3.0) {
    warnings.push({
      severity: 'warning',
      code: 'SUBMAXIMAL_ALLOUT',
      message: `All-out bij ${speeds[n - 1].toFixed(1)} km/h lijkt submaximaal (lactaat slechts +${lactateRise.toFixed(1)} mmol/L boven vorige trap). Overweeg deze trap uit te sluiten — een echte maximale inspanning geeft meestal ≥ 3 mmol/L extra stijging.`,
      affectedStep: n - 1,
    });
  }
}

// ============ HOOFDFUNCTIE ============

/** Minimum Lactate Equivalent (Garcia-Tabar & Gorostiaga 2018): de snelheid waar
 *  de verhouding lactaat/snelheid minimaal is. Gevalideerd als aerobe drempel bij
 *  getrainde lopers (77 ± 2% van MLSS, r = 0.91). Null bij een randoplossing. */
function computeLEmin(coeffsAsc: number[], xs: XScale, xMin: number, xMax: number): number | null {
  const N = 400, step = (xMax - xMin) / N;
  let bestV: number | null = null, best = Infinity;
  for (let i = 0; i <= N; i++) {
    const v = xMin + i * step;
    if (v <= 0) continue;
    const ratio = evalNorm(coeffsAsc, xs, v) / v;
    if (ratio < best) { best = ratio; bestV = v; }
  }
  if (bestV === null) return null;
  if (bestV - xMin < step * 2 || xMax - bestV < step * 2) return null; // rand = geen echt minimum
  return bestV;
}

/** Laagste lactaatwaarde van de test: het minimum van de gemeten punten én van de
 *  gefitte curve. Niet de eerste drie trappen — bij getrainde lopers ligt het
 *  minimum vaak pas bij trap 3 of 4 (lactate shuttle na de warming-up). */
function curveNadir(coeffsAsc: number[], xs: XScale, lactates: number[], xMin: number, xMax: number): number {
  let m = Math.min(...lactates);
  const N = 200, step = (xMax - xMin) / N;
  for (let i = 0; i <= N; i++) {
    const y = evalNorm(coeffsAsc, xs, xMin + i * step);
    if (y < m) m = y;
  }
  return Math.max(m, 0.3);
}

export function calculate(testData: StepData[], restingLactate: number): CalculationResults | string {

  const valid = testData
    .filter(r => Number.isFinite(r.speed) && Number.isFinite(r.lactate) && r.speed > 0 && r.lactate > 0)
    .sort((a, b) => a.speed - b.speed);

  if (valid.length < 4) {
    return 'Je hebt minstens 4 geldige datapunten nodig (snelheid + lactaat ingevuld).';
  }
  // dedup op snelheid: behoud eerste
  const dedup: StepData[] = [];
  for (const r of valid) {
    if (dedup.length === 0 || r.speed !== dedup[dedup.length - 1].speed) dedup.push(r);
  }
  if (dedup.length < 4) {
    return 'Dubbele snelheden — elke trap moet een unieke snelheid hebben.';
  }

  const speeds = dedup.map(r => r.speed);
  const lactates = dedup.map(r => r.lactate);
  const hrs = dedup.map(r => r.hr);
  const watts = dedup.map(r => r.watt || 0);
  // FIX bug #1: bij herladen krijgt restingLactate=0 → fallback op min(lactates),
  // wat deterministisch is en dus dezelfde resultaten geeft.
  const restLac = restingLactate > 0 ? restingLactate : Math.min(...lactates);

  const warnings: CalcWarning[] = [];
  const xMin = speeds[0];
  const xMax = speeds[speeds.length - 1];

  // --- Adaptieve fit ---
  let degree: number;
  let curveType: 'linear' | 'quadratic' | 'cubic';
  if (speeds.length === 4) {
    degree = 1; curveType = 'linear';
    warnings.push({
      severity: 'warning', code: 'LOW_DATA_LINEAR',
      message: '4 datapunten — lineaire fit. Voeg trappen toe voor een betrouwbaarder resultaat.',
    });
  } else if (speeds.length <= 6) {
    degree = 2; curveType = 'quadratic';
    warnings.push({
      severity: 'info', code: 'MEDIUM_DATA_QUADRATIC',
      message: `${speeds.length} datapunten — quadratische fit. 7+ trappen geven nog stabielere resultaten.`,
    });
  } else {
    degree = 3; curveType = 'cubic';
  }

  let coeffsAsc: number[], xScale: XScale;
  try {
    const f = polyFitNorm(speeds, lactates, degree);
    coeffsAsc = f.coeffs; xScale = f.xScale;
  } catch (e) {
    return `Curvefit faalde: ${(e as Error).message}`;
  }

  // Denormaliseer naar cubic-vorm voor externe consumenten
  const coeffs = denormalizeToCubic(coeffsAsc, xScale);

  // Kwaliteit
  const predicted = speeds.map(s => evalNorm(coeffsAsc, xScale, s));
  const meanL = lactates.reduce((a, b) => a + b, 0) / lactates.length;
  const ssRes = lactates.reduce((s, l, i) => s + (l - predicted[i]) ** 2, 0);
  const ssTot = lactates.reduce((s, l) => s + (l - meanL) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;
  const rmse = Math.sqrt(ssRes / lactates.length);

  detectOutliers(speeds, lactates, coeffsAsc, xScale, warnings);
  checkMonotonicity(coeffsAsc, xScale, xMin, xMax, warnings);
  checkAllOutSubmaximal(speeds, lactates, warnings);

  // --- LT1 ---
  const minActiveLac = Math.min(...lactates.slice(0, 3));
  const nadirLac = curveNadir(coeffsAsc, xScale, lactates, xMin, xMax);
  const baselineLac = nadirLac;
  const lt1_lemin = computeLEmin(coeffsAsc, xScale, xMin, xMax);
  const lt1_nadir = findSpeedAtLactateOrNull(coeffs, nadirLac + 0.3, xMin, xMax);
  const lt1_obla = findSpeedAtLactateOrNull(coeffs, 2.0, xMin, xMax);
  const lt1_bsln = lt1_nadir;
  const lt1_loglog = computeLogLog(speeds, lactates);
  const polyAe = lt1_lemin ?? lt1_nadir ?? lt1_obla ?? xMin;
  let lt1_best = polyAe;
  let lt1_method =
    lt1_lemin !== null ? 'LEmin' :
    lt1_nadir !== null ? 'Baseline+0.3' :
    lt1_obla !== null ? 'OBLA 2.0' : 'fallback';


  // --- LT2 ---
  const lt2_obla = findSpeedAtLactateOrNull(coeffs, 4.0, xMin, xMax);
  const lt2_dmax = computeDmax(coeffsAsc, xScale, speeds, lactates, 0, speeds.length - 1);
  const modStartIdx = findModDmaxStart(lactates, restLac);
  const lt2_moddmax = computeDmax(coeffsAsc, xScale, speeds, lactates, modStartIdx, speeds.length - 1);
  const polyAn = lt2_moddmax ?? lt2_dmax ?? lt2_obla ?? xMax;
  let lt2_best = polyAn;
  let lt2_method =
    lt2_moddmax !== null ? 'Modified Dmax' :
    lt2_dmax !== null ? 'Dmax' :
    lt2_obla !== null ? 'OBLA 4.0' : 'fallback';

  // ===== Vangrail: monotone interpolatie op de RUWE meetpunten =====
  // De polynoom blijft de tekencurve; deze check corrigeert enkel onmogelijke
  // of onbetrouwbare drempelwaarden.
  const PACE_TOL_SEC = 8; // afwijking > ~8 s/km = polynoom niet te vertrouwen

  const interpAe =
    interpolateThreshold(nadirLac + 0.3, speeds, lactates) ??
    interpolateThreshold(2.0, speeds, lactates);
  let lt1_interpolated = false;
  // Bij de aerobe drempel mag een DALENDE curve de fit niet diskwalificeren: LEmin
  // ligt per definitie in het gebied waar het lactaat nog daalt of vlak ligt.
  // De vangrail grijpt hier dus alleen in als de fit geen bruikbare waarde gaf.
  const aeFitUnreliable =
    polyAe < xMin || polyAe > xMax ||
    (lt1_lemin === null && lt1_nadir === null &&
      paceDiffSecPerKm(polyAe, interpAe ?? polyAe) > PACE_TOL_SEC);

  if (interpAe !== null && aeFitUnreliable) {
    lt1_best = interpAe;
    lt1_method = 'Interpolation';
    lt1_interpolated = true;
    warnings.push({
      severity: 'info',
      code: 'THRESHOLD_INTERPOLATED',
      message: `Aerobe drempel is bepaald via interpolatie tussen de gemeten trappen (${interpAe.toFixed(1)} km/h) in plaats van de curvefit (${polyAe.toFixed(1)} km/h) — de fit was niet betrouwbaar (niet-monotoon of te grote afwijking).`,
    });
  }

  const interpAn = interpolateThreshold(4.0, speeds, lactates);
  let lt2_interpolated = false;
  if (interpAn === null) {
    warnings.push({
      severity: 'warning',
      code: 'OBLA_NOT_REACHED',
      message: `Het maximaal gemeten lactaat blijft onder 4.0 mmol/L — de anaerobe drempel kan niet betrouwbaar bepaald worden. De getoonde waarde is een schatting; verleng de test met een zwaardere trap.`,
    });
  } else if (
    isNonMonotonicNear(coeffsAsc, xScale, polyAn, xMin, xMax) ||
    polyAn < xMin || polyAn > xMax ||
    (lt2_moddmax === null && lt2_dmax === null && paceDiffSecPerKm(polyAn, interpAn) > PACE_TOL_SEC)
  ) {
    lt2_best = interpAn;
    lt2_method = 'Interpolation';
    lt2_interpolated = true;
    warnings.push({
      severity: 'info',
      code: 'THRESHOLD_INTERPOLATED',
      message: `Anaerobe drempel is bepaald via interpolatie tussen de gemeten trappen (${interpAn.toFixed(1)} km/h) in plaats van de curvefit (${polyAn.toFixed(1)} km/h) — de fit was niet betrouwbaar (niet-monotoon of te grote afwijking).`,
    });
  }

  // Harde volgorde-check: LT2 moet sneller zijn dan LT1 — herstel eerst, waarschuw pas als herstel faalt
  if (lt2_best <= lt1_best) {
    if (interpAn !== null && interpAn > lt1_best) {
      lt2_best = interpAn;
      lt2_method = 'Interpolation';
      lt2_interpolated = true;
      warnings.push({
        severity: 'info',
        code: 'THRESHOLD_INTERPOLATED',
        message: `Anaerobe drempel is hersteld via interpolatie tussen de gemeten trappen (${interpAn.toFixed(1)} km/h) — de curvefit gaf een waarde onder de aerobe drempel.`,
      });
    } else {
      warnings.push({
        severity: 'warning',
        code: 'THRESHOLD_ORDER',
        message: `Anaerobe drempel (${lt2_best.toFixed(1)} km/h) ligt niet boven de aerobe drempel (${lt1_best.toFixed(1)} km/h) — fysiologisch onmogelijk. Controleer de lactaatwaarden van deze test.`,
      });
    }
  }



  // HR/Watt op drempels
  const lt1_hr = interpolateAt(lt1_best, speeds, hrs, true);
  const lt1_watt = interpolateAt(lt1_best, speeds, watts, true);
  const lt2_hr = interpolateAt(lt2_best, speeds, hrs, true);
  const lt2_watt = interpolateAt(lt2_best, speeds, watts, true);

  // Cross-check verhouding LT1/LT2 (literatuur: 0.70-0.85)
  if (lt1_best > 0 && lt2_best > 0 && lt2_best > lt1_best) {
    const ratio = lt1_best / lt2_best;
    if (ratio < 0.62) {
      warnings.push({
        severity: 'warning',
        code: 'LT_GAP_LARGE',
        message: `Ongewoon groot verschil tussen de drempels (aerobe drempel op ${Math.round(ratio * 100)}% van de anaerobe). Controleer de lactaatwaarden van de eerste trappen.`,
      });
    }
  }

  return {
    coeffs, r2, speeds, lactates, hrs, watts, restLac, minActiveLac, modStartIdx,
    lt1: { obla: lt1_obla, bsln: lt1_bsln, loglog: lt1_loglog, best: lt1_best, method: lt1_method, hr: lt1_hr, watt: lt1_watt, interpolated: lt1_interpolated, interp: interpAe },
    lt2: { obla: lt2_obla, dmax: lt2_dmax, moddmax: lt2_moddmax, best: lt2_best, method: lt2_method, hr: lt2_hr, watt: lt2_watt, interpolated: lt2_interpolated, interp: interpAn, oblaReached: interpAn !== null },

    curveType,
    algorithmVersion: 3,
    quality: { r2, rmse, fitQuality: r2 >= 0.95 ? 'good' : r2 >= 0.85 ? 'moderate' : 'poor' },
    warnings,

  };
}

// ============ ZONES ============

export function getZones(results: CalculationResults): ZoneData[] {
  const lt1s = results.lt1.best;
  // Defensieve guard: bij drempelomkering (THRESHOLD_ORDER) mag lt2 nooit onder lt1 liggen,
  // anders krijgen zones een negatieve breedte.
  const lt2s = Math.max(results.lt2.best, lt1s);
  const maxSpeed = Math.max(results.speeds[results.speeds.length - 1], lt2s);

  const minZoneWidth = 0.3;
  let zone3Top = lt2s * 0.95;
  if (zone3Top - lt1s < minZoneWidth) zone3Top = lt1s + minZoneWidth;
  zone3Top = Math.min(zone3Top, lt2s - minZoneWidth * 0.5);
  // Clamp binnen [lt1s, lt2s] zodat Zone 3 en Zone 4 nooit negatief worden.
  zone3Top = Math.min(Math.max(zone3Top, lt1s), lt2s);

  const zones: ZoneData[] = [
    { name: 'Zone 1', label: 'Herstel',              color: '#60a5fa', from: 0,         to: lt1s * 0.85, desc: 'Zeer licht, actief herstel' },
    { name: 'Zone 2', label: 'Aeroob (Endurance)',   color: '#34d399', from: lt1s*0.85, to: lt1s,        desc: 'Duurloop, vetverbranding, basis' },
    { name: 'Zone 3', label: 'Tempo',                color: '#fbbf24', from: lt1s,      to: zone3Top,    desc: 'Stevig tempo, marathon/HM-tempo' },
    { name: 'Zone 4', label: 'Drempel',              color: '#f97316', from: zone3Top,  to: lt2s,        desc: 'Rond anaerobe drempel, 10K-tempo' },
    // Zone 5 cap op maxSpeed (geen *1.1 extrapolatie meer) — voorkomt dalende HR in Z5.
    { name: 'Zone 5', label: 'VO₂max',               color: '#ef4444', from: lt2s,      to: maxSpeed,    desc: 'Intervallen, maximale inspanning' },
  ];

  // Laatste vangnet: geen enkele zone mag een negatieve breedte hebben.
  return zones.map(z => ({ ...z, to: Math.max(z.to, z.from) }));
}


// ============ BACKWARDS COMPAT EXPORT ============
// Bestaande imports gebruikten polyFit3 — we behouden de naam, maar nu via fit-route.
export function polyFit3(xs: number[], ys: number[]): number[] {
  const f = polyFitNorm(xs, ys, Math.min(3, xs.length - 1));
  return denormalizeToCubic(f.coeffs, f.xScale);
}
