// ============================================================
// LacTest - Lactate Math Validation Script
// Tests 25 athlete profiles from recreational to elite
// ============================================================

// ---- MATH (copied from lactate-math.ts) --------------------

function transpose(M) {
  const rows = M.length, cols = M[0].length;
  const T = [];
  for (let j = 0; j < cols; j++) {
    T.push([]);
    for (let i = 0; i < rows; i++) T[j].push(M[i][j]);
  }
  return T;
}
function matMulFull(A, B) {
  const m = A.length, n = A[0].length, p = B[0].length;
  const C = Array.from({ length: m }, () => Array(p).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < p; j++)
      for (let k = 0; k < n; k++) C[i][j] += A[i][k] * B[k][j];
  return C;
}
function matVecMul(A, v) {
  return A.map(row => row.reduce((s, a, i) => s + a * v[i], 0));
}
function solveLinear4(A, b) {
  const n = 4;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
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
function polyFit3(xs, ys) {
  const n = xs.length;
  const X = [];
  for (let i = 0; i < n; i++) X.push([xs[i] ** 3, xs[i] ** 2, xs[i], 1]);
  const XT = transpose(X);
  const A = matMulFull(XT, X);
  const B = matVecMul(XT, ys);
  return solveLinear4(A, B);
}
function polyEval(coeffs, x) {
  const [a, b, c, d] = coeffs;
  return a * x ** 3 + b * x ** 2 + c * x + d;
}
function rSquared(xs, ys, coeffs) {
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = xs.reduce((s, x, i) => s + (ys[i] - polyEval(coeffs, x)) ** 2, 0);
  return 1 - ssRes / ssTot;
}
function findSpeedAtLactate(coeffs, targetLac, xMin, xMax) {
  for (let iter = 0; iter < 100; iter++) {
    const mid = (xMin + xMax) / 2;
    const val = polyEval(coeffs, mid);
    if (Math.abs(val - targetLac) < 0.001) return mid;
    if (val < targetLac) xMin = mid; else xMax = mid;
  }
  return (xMin + xMax) / 2;
}
function linRegError(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i]-mx)*(ys[i]-my); den += (xs[i]-mx)**2; }
  const slope = den > 0 ? num / den : 0;
  const intercept = my - slope * mx;
  return xs.reduce((s, x, i) => s + (ys[i] - slope * x - intercept) ** 2, 0);
}

function calculate(testData, restingLactate) {
  const valid = testData.filter(r => r.speed > 0 && r.lactate > 0);
  if (valid.length < 4) return 'ERROR: minder dan 4 punten';
  const speeds = valid.map(r => r.speed);
  const lactates = valid.map(r => r.lactate);
  const restLac = restingLactate || lactates[0];
  const coeffs = polyFit3(speeds, lactates);
  const r2 = rSquared(speeds, lactates, coeffs);
  const xMin = speeds[0], xMax = speeds[speeds.length - 1];

  // LT1: OBLA 2.0
  let lt1_obla = null;
  if (polyEval(coeffs, xMin) < 2.0 && polyEval(coeffs, xMax) > 2.0)
    lt1_obla = findSpeedAtLactate(coeffs, 2.0, xMin, xMax);

  // LT1: Baseline + 0.5
  const minActiveLac = Math.min(...lactates.slice(0, 3));
  const bslnTarget = minActiveLac + 0.5;
  let lt1_bsln = null;
  if (polyEval(coeffs, xMin) < bslnTarget && polyEval(coeffs, xMax) > bslnTarget)
    lt1_bsln = findSpeedAtLactate(coeffs, bslnTarget, xMin, xMax);

  // LT1: Log-Log
  let lt1_loglog = null;
  try {
    const logSpeeds = speeds.map(s => Math.log(s));
    const logLactates = lactates.map(l => Math.log(Math.max(l, 0.1)));
    let bestError = Infinity, bestSplit = 2;
    for (let split = 2; split < logSpeeds.length - 1; split++) {
      const e = linRegError(logSpeeds.slice(0, split+1), logLactates.slice(0, split+1))
              + linRegError(logSpeeds.slice(split), logLactates.slice(split));
      if (e < bestError) { bestError = e; bestSplit = split; }
    }
    lt1_loglog = speeds[bestSplit];
  } catch(_) {}

  const lt1_best = lt1_bsln || lt1_loglog || lt1_obla || xMin;

  // LT2: OBLA 4.0
  let lt2_obla = null;
  if (polyEval(coeffs, xMin) < 4.0 && polyEval(coeffs, xMax) > 4.0)
    lt2_obla = findSpeedAtLactate(coeffs, 4.0, xMin, xMax);

  // LT2: Dmax
  const slopeAB = (lactates[lactates.length-1] - lactates[0]) / (speeds[speeds.length-1] - speeds[0]);
  const qa = 3*coeffs[0], qb = 2*coeffs[1], qc = coeffs[2] - slopeAB;
  const disc = qb**2 - 4*qa*qc;
  let lt2_dmax = null;
  if (disc >= 0 && qa !== 0) {
    const r1 = (-qb + Math.sqrt(disc))/(2*qa), r2v = (-qb - Math.sqrt(disc))/(2*qa);
    const cands = [r1, r2v].filter(r => r >= xMin && r <= xMax);
    if (cands.length > 0) lt2_dmax = Math.max(...cands);
  }

  // LT2: Modified Dmax
  let lt2_moddmax = null, modStartIdx = 0;
  const bslnPoints = lactates.filter(l => l < restLac + 1.0);
  if (bslnPoints.length >= 3) {
    const bslnMean = bslnPoints.reduce((a,b)=>a+b,0)/bslnPoints.length;
    const bslnSD = Math.sqrt(bslnPoints.reduce((s,l)=>s+(l-bslnMean)**2,0)/bslnPoints.length);
    const trigger = bslnMean + Math.max(2*bslnSD, 0.2);
    for (let i = 1; i < lactates.length; i++) {
      if (lactates[i] > trigger) { modStartIdx = Math.max(0, i-1); break; }
    }
  } else {
    for (let i = 1; i < lactates.length; i++) {
      if (lactates[i] - lactates[i-1] > 0.4) { modStartIdx = Math.max(0, i-1); break; }
    }
  }
  const modStartSpeed = speeds[modStartIdx], modStartLac = lactates[modStartIdx];
  const slopeMod = (lactates[lactates.length-1]-modStartLac)/(speeds[speeds.length-1]-modStartSpeed);
  const qam=3*coeffs[0], qbm=2*coeffs[1], qcm=coeffs[2]-slopeMod;
  const discm = qbm**2 - 4*qam*qcm;
  if (discm >= 0 && qam !== 0) {
    const r1m=(-qbm+Math.sqrt(discm))/(2*qam), r2m=(-qbm-Math.sqrt(discm))/(2*qam);
    const cm = [r1m, r2m].filter(r => r >= modStartSpeed && r <= xMax);
    if (cm.length > 0) lt2_moddmax = Math.max(...cm);
  }

  const lt2_best = lt2_moddmax || lt2_dmax || lt2_obla || xMax;

  return { coeffs, r2, speeds, lactates, restLac, lt1: { obla: lt1_obla, bsln: lt1_bsln, loglog: lt1_loglog, best: lt1_best }, lt2: { obla: lt2_obla, dmax: lt2_dmax, moddmax: lt2_moddmax, best: lt2_best } };
}

function formatPace(kmh) {
  if (!kmh || kmh <= 0) return '-';
  const minPerKm = 60 / kmh;
  let mins = Math.floor(minPerKm), secs = Math.round((minPerKm-mins)*60);
  if (secs === 60) { mins++; secs = 0; }
  return `${mins}:${secs.toString().padStart(2,'0')} /km`;
}

// ---- TEST DATA: 25 ATHLETE PROFILES ----------------------------
// Format: { label, type, restLac, steps: [{speed (km/h), lactate, hr}] }
// All data is physiologically realistic / based on published studies

const profiles = [
  // ====== RUNNERS (speed in km/h) ======
  {
    label: "R01 - Sedentaire beginners loper",
    type: "run",
    restLac: 1.2,
    steps: [
      {speed:6.0, lactate:1.2, hr:118},
      {speed:7.0, lactate:1.3, hr:127},
      {speed:8.0, lactate:1.5, hr:136},
      {speed:9.0, lactate:2.1, hr:148},
      {speed:10.0, lactate:3.2, hr:162},
      {speed:11.0, lactate:5.8, hr:176},
    ]
  },
  {
    label: "R02 - Recreatief loper (3x/week, 5K ~35min)",
    type: "run",
    restLac: 1.0,
    steps: [
      {speed:7.0, lactate:1.1, hr:122},
      {speed:8.0, lactate:1.2, hr:131},
      {speed:9.0, lactate:1.4, hr:141},
      {speed:10.0, lactate:1.8, hr:152},
      {speed:11.0, lactate:2.9, hr:163},
      {speed:12.0, lactate:4.8, hr:175},
      {speed:13.0, lactate:7.2, hr:184},
    ]
  },
  {
    label: "R03 - Recreatief loper (5K ~28min)",
    type: "run",
    restLac: 1.0,
    steps: [
      {speed:8.0, lactate:1.0, hr:118},
      {speed:9.0, lactate:1.1, hr:127},
      {speed:10.0, lactate:1.3, hr:136},
      {speed:11.0, lactate:1.6, hr:146},
      {speed:12.0, lactate:2.4, hr:158},
      {speed:13.0, lactate:3.9, hr:169},
      {speed:14.0, lactate:6.1, hr:180},
    ]
  },
  {
    label: "R04 - Clublopers (10K ~50min)",
    type: "run",
    restLac: 0.9,
    steps: [
      {speed:8.0, lactate:0.9, hr:115},
      {speed:9.5, lactate:1.0, hr:124},
      {speed:11.0, lactate:1.2, hr:134},
      {speed:12.5, lactate:1.8, hr:146},
      {speed:13.5, lactate:2.6, hr:156},
      {speed:14.5, lactate:4.1, hr:167},
      {speed:15.5, lactate:6.5, hr:178},
    ]
  },
  {
    label: "R05 - Clublopers (10K ~45min)",
    type: "run",
    restLac: 0.9,
    steps: [
      {speed:9.0, lactate:0.9, hr:112},
      {speed:10.5, lactate:1.0, hr:121},
      {speed:12.0, lactate:1.1, hr:130},
      {speed:13.5, lactate:1.5, hr:142},
      {speed:14.5, lactate:2.2, hr:153},
      {speed:15.5, lactate:3.8, hr:165},
      {speed:16.5, lactate:6.2, hr:176},
    ]
  },
  {
    label: "R06 - Gevorderde loper (10K ~42min)",
    type: "run",
    restLac: 0.8,
    steps: [
      {speed:10.0, lactate:0.9, hr:110},
      {speed:11.5, lactate:1.0, hr:119},
      {speed:13.0, lactate:1.2, hr:129},
      {speed:14.0, lactate:1.6, hr:139},
      {speed:15.0, lactate:2.3, hr:150},
      {speed:16.0, lactate:3.7, hr:162},
      {speed:17.0, lactate:6.0, hr:174},
    ]
  },
  {
    label: "R07 - Competitieve loper (10K ~38min)",
    type: "run",
    restLac: 0.8,
    steps: [
      {speed:10.0, lactate:0.8, hr:105},
      {speed:12.0, lactate:0.9, hr:115},
      {speed:13.5, lactate:1.0, hr:125},
      {speed:14.5, lactate:1.3, hr:135},
      {speed:15.5, lactate:1.8, hr:147},
      {speed:16.5, lactate:3.1, hr:159},
      {speed:17.5, lactate:5.4, hr:171},
      {speed:18.0, lactate:7.5, hr:179},
    ]
  },
  {
    label: "R08 - Sterke clublopers (10K ~35min)",
    type: "run",
    restLac: 0.8,
    steps: [
      {speed:11.0, lactate:0.8, hr:103},
      {speed:13.0, lactate:0.9, hr:113},
      {speed:14.5, lactate:1.0, hr:123},
      {speed:15.5, lactate:1.4, hr:133},
      {speed:16.5, lactate:2.0, hr:145},
      {speed:17.5, lactate:3.4, hr:157},
      {speed:18.5, lactate:5.8, hr:169},
    ]
  },
  {
    label: "R09 - Amateur elite (10K ~32min)",
    type: "run",
    restLac: 0.7,
    steps: [
      {speed:12.0, lactate:0.7, hr:100},
      {speed:14.0, lactate:0.8, hr:110},
      {speed:15.5, lactate:0.9, hr:120},
      {speed:16.5, lactate:1.2, hr:130},
      {speed:17.5, lactate:1.7, hr:142},
      {speed:18.5, lactate:2.9, hr:154},
      {speed:19.5, lactate:5.0, hr:167},
      {speed:20.5, lactate:8.1, hr:178},
    ]
  },
  {
    label: "R10 - Professionele loper (10K ~29min)",
    type: "run",
    restLac: 0.7,
    steps: [
      {speed:14.0, lactate:0.7, hr:98},
      {speed:15.5, lactate:0.8, hr:107},
      {speed:17.0, lactate:0.9, hr:117},
      {speed:18.0, lactate:1.1, hr:127},
      {speed:19.0, lactate:1.6, hr:139},
      {speed:20.0, lactate:2.8, hr:151},
      {speed:21.0, lactate:4.6, hr:163},
      {speed:22.0, lactate:7.2, hr:174},
    ]
  },
  {
    label: "R11 - Elite marathonloper (sub 2:15)",
    type: "run",
    restLac: 0.7,
    steps: [
      {speed:14.0, lactate:0.7, hr:96},
      {speed:16.0, lactate:0.8, hr:106},
      {speed:17.5, lactate:1.0, hr:116},
      {speed:18.5, lactate:1.4, hr:127},
      {speed:19.5, lactate:2.1, hr:138},
      {speed:20.5, lactate:3.2, hr:149},
      {speed:21.5, lactate:5.1, hr:161},
      {speed:22.5, lactate:8.4, hr:173},
    ]
  },
  {
    label: "R12 - Vrouw recreatief (5K ~32min)",
    type: "run",
    restLac: 1.0,
    steps: [
      {speed:6.5, lactate:1.0, hr:120},
      {speed:7.5, lactate:1.1, hr:130},
      {speed:8.5, lactate:1.3, hr:140},
      {speed:9.5, lactate:1.9, hr:152},
      {speed:10.5, lactate:3.1, hr:164},
      {speed:11.5, lactate:5.6, hr:175},
    ]
  },
  {
    label: "R13 - Vrouw competitief (10K ~40min)",
    type: "run",
    restLac: 0.8,
    steps: [
      {speed:9.0, lactate:0.8, hr:108},
      {speed:10.5, lactate:0.9, hr:118},
      {speed:12.0, lactate:1.1, hr:128},
      {speed:13.0, lactate:1.5, hr:139},
      {speed:14.0, lactate:2.4, hr:151},
      {speed:15.0, lactate:4.0, hr:163},
      {speed:16.0, lactate:6.8, hr:175},
    ]
  },
  {
    label: "R14 - Triatleet (lange afstand)",
    type: "run",
    restLac: 0.9,
    steps: [
      {speed:9.0, lactate:0.9, hr:112},
      {speed:10.5, lactate:1.0, hr:122},
      {speed:12.0, lactate:1.2, hr:132},
      {speed:13.0, lactate:1.7, hr:143},
      {speed:14.0, lactate:2.6, hr:155},
      {speed:15.0, lactate:4.2, hr:166},
    ]
  },
  {
    label: "R15 - Master loper 50+ (10K ~52min)",
    type: "run",
    restLac: 1.1,
    steps: [
      {speed:7.0, lactate:1.1, hr:115},
      {speed:8.0, lactate:1.2, hr:125},
      {speed:9.0, lactate:1.5, hr:135},
      {speed:10.0, lactate:2.3, hr:147},
      {speed:11.0, lactate:3.8, hr:158},
      {speed:12.0, lactate:6.5, hr:169},
    ]
  },

  // ====== CYCLISTS (speed in km/h) ======
  {
    label: "C01 - Recreatief fietser (Cat 4)",
    type: "bike",
    restLac: 1.0,
    steps: [
      {speed:22, lactate:1.1, hr:118},
      {speed:25, lactate:1.2, hr:128},
      {speed:28, lactate:1.5, hr:138},
      {speed:31, lactate:2.2, hr:150},
      {speed:34, lactate:3.8, hr:163},
      {speed:37, lactate:6.5, hr:175},
    ]
  },
  {
    label: "C02 - Clubfietser (Cat 3)",
    type: "bike",
    restLac: 0.9,
    steps: [
      {speed:24, lactate:0.9, hr:112},
      {speed:27, lactate:1.0, hr:122},
      {speed:30, lactate:1.2, hr:132},
      {speed:33, lactate:1.7, hr:143},
      {speed:36, lactate:2.8, hr:155},
      {speed:39, lactate:4.9, hr:167},
      {speed:42, lactate:7.8, hr:178},
    ]
  },
  {
    label: "C03 - Gevorderde fietser (Cat 2)",
    type: "bike",
    restLac: 0.8,
    steps: [
      {speed:28, lactate:0.8, hr:108},
      {speed:31, lactate:0.9, hr:118},
      {speed:34, lactate:1.1, hr:128},
      {speed:37, lactate:1.5, hr:139},
      {speed:40, lactate:2.4, hr:151},
      {speed:43, lactate:4.1, hr:163},
      {speed:46, lactate:7.0, hr:174},
    ]
  },
  {
    label: "C04 - Competitieve wielrenner (Cat 1)",
    type: "bike",
    restLac: 0.8,
    steps: [
      {speed:30, lactate:0.8, hr:105},
      {speed:33, lactate:0.8, hr:114},
      {speed:36, lactate:0.9, hr:124},
      {speed:39, lactate:1.2, hr:134},
      {speed:42, lactate:1.8, hr:145},
      {speed:45, lactate:3.0, hr:157},
      {speed:48, lactate:5.2, hr:169},
      {speed:51, lactate:8.5, hr:179},
    ]
  },
  {
    label: "C05 - Elite wielrenner (Pro)",
    type: "bike",
    restLac: 0.7,
    steps: [
      {speed:33, lactate:0.7, hr:100},
      {speed:36, lactate:0.8, hr:109},
      {speed:39, lactate:0.8, hr:119},
      {speed:42, lactate:1.0, hr:129},
      {speed:45, lactate:1.4, hr:140},
      {speed:48, lactate:2.3, hr:152},
      {speed:51, lactate:3.9, hr:163},
      {speed:54, lactate:6.8, hr:175},
    ]
  },
  {
    label: "C06 - MTB rijder (sportief)",
    type: "bike",
    restLac: 0.9,
    steps: [
      {speed:20, lactate:0.9, hr:115},
      {speed:23, lactate:1.0, hr:125},
      {speed:26, lactate:1.3, hr:135},
      {speed:29, lactate:2.0, hr:147},
      {speed:32, lactate:3.5, hr:159},
      {speed:35, lactate:6.2, hr:171},
    ]
  },
  {
    label: "C07 - Vrouw fietser (competitief)",
    type: "bike",
    restLac: 0.9,
    steps: [
      {speed:24, lactate:0.9, hr:112},
      {speed:27, lactate:1.0, hr:122},
      {speed:30, lactate:1.2, hr:132},
      {speed:33, lactate:1.8, hr:144},
      {speed:36, lactate:3.0, hr:156},
      {speed:39, lactate:5.3, hr:168},
    ]
  },

  // ====== EDGE CASES ======
  {
    label: "E01 - Vlakke curve (goed getrainde aeroob atleet)",
    type: "run",
    restLac: 0.8,
    steps: [
      {speed:10.0, lactate:0.8, hr:105},
      {speed:12.0, lactate:0.9, hr:115},
      {speed:14.0, lactate:1.0, hr:126},
      {speed:15.5, lactate:1.2, hr:136},
      {speed:17.0, lactate:1.6, hr:147},
      {speed:18.5, lactate:2.5, hr:159},
      {speed:20.0, lactate:4.5, hr:172},
    ]
  },
  {
    label: "E02 - Stijle curve (deconditioning na blessure)",
    type: "run",
    restLac: 1.3,
    steps: [
      {speed:7.0, lactate:1.4, hr:125},
      {speed:8.5, lactate:2.1, hr:140},
      {speed:10.0, lactate:3.8, hr:158},
      {speed:11.5, lactate:6.5, hr:172},
      {speed:13.0, lactate:9.8, hr:183},
    ]
  },
  {
    label: "E03 - Minimum 4 punten (edge case)",
    type: "run",
    restLac: 1.0,
    steps: [
      {speed:9.0,  lactate:1.0, hr:120},
      {speed:11.0, lactate:1.5, hr:135},
      {speed:13.0, lactate:3.0, hr:155},
      {speed:15.0, lactate:6.5, hr:172},
    ]
  },
];

// ---- VALIDATE & REPORT ------------------------------------------

function check(condition, msg) {
  return condition ? `✅ ${msg}` : `❌ ${msg}`;
}

let passCount = 0, failCount = 0, warnCount = 0;
const results = [];

console.log('\n' + '='.repeat(72));
console.log(' LACTEST — VALIDATIERAPPORT LACTAATBEREKENINGEN');
console.log(' ' + new Date().toLocaleDateString('nl-BE', {day:'2-digit',month:'long',year:'numeric'}));
console.log('='.repeat(72));

for (const profile of profiles) {
  const steps = profile.steps.map(s => ({ speed: s.speed, lactate: s.lactate, hr: s.hr, watt: 0 }));
  const res = calculate(steps, profile.restLac);

  if (typeof res === 'string') {
    console.log(`\n⚠️  ${profile.label}: ${res}`);
    warnCount++;
    continue;
  }

  const maxSpeed = res.speeds[res.speeds.length - 1];
  const lt1 = res.lt1.best;
  const lt2 = res.lt2.best;
  const lt1pct = (lt1 / maxSpeed * 100).toFixed(1);
  const lt2pct = (lt2 / maxSpeed * 100).toFixed(1);

  // Validaties
  const v_order = lt1 < lt2;
  const v_lt1pct = lt1pct >= 50 && lt1pct <= 85;
  const v_lt2pct = lt2pct >= 70 && lt2pct <= 97;
  const v_gap = (lt2 - lt1) > 0.5; // minstens 0.5 km/h verschil
  const v_r2 = res.r2 >= 0.90;

  const allOk = v_order && v_lt1pct && v_lt2pct && v_gap && v_r2;
  if (allOk) passCount++; else failCount++;

  const typeStr = profile.type === 'run' ? '🏃' : '🚴';
  console.log(`\n${typeStr} ${profile.label}`);
  console.log(`   Stappen  : ${res.speeds.length} | Max: ${maxSpeed} km/h | R²: ${res.r2.toFixed(3)}`);
  console.log(`   LT1 (Aeroob)  : ${lt1.toFixed(2)} km/h (${lt1pct}% van max) ${profile.type==='run' ? '= '+formatPace(lt1) : ''}`);
  console.log(`     ├ bsln+0.5  : ${res.lt1.bsln ? res.lt1.bsln.toFixed(2)+' km/h' : 'niet gevonden'}`);
  console.log(`     ├ log-log   : ${res.lt1.loglog ? res.lt1.loglog.toFixed(2)+' km/h' : 'niet gevonden'}`);
  console.log(`     └ OBLA 2.0  : ${res.lt1.obla ? res.lt1.obla.toFixed(2)+' km/h' : 'niet gevonden'}`);
  console.log(`   LT2 (Anaeroob): ${lt2.toFixed(2)} km/h (${lt2pct}% van max) ${profile.type==='run' ? '= '+formatPace(lt2) : ''}`);
  console.log(`     ├ ModDmax   : ${res.lt2.moddmax ? res.lt2.moddmax.toFixed(2)+' km/h' : 'niet gevonden'}`);
  console.log(`     ├ Dmax      : ${res.lt2.dmax ? res.lt2.dmax.toFixed(2)+' km/h' : 'niet gevonden'}`);
  console.log(`     └ OBLA 4.0  : ${res.lt2.obla ? res.lt2.obla.toFixed(2)+' km/h' : 'niet gevonden'}`);
  console.log(`   ${check(v_order,'LT1 < LT2')}  ${check(v_lt1pct,'LT1% fysiologisch (50-85%)')}  ${check(v_lt2pct,'LT2% fysiologisch (70-97%)')}  ${check(v_gap,'Gap LT1↔LT2 > 0.5km/h')}  ${check(v_r2,'R² ≥ 0.90')}`);

  results.push({ label: profile.label, lt1, lt2, lt1pct: +lt1pct, lt2pct: +lt2pct, r2: res.r2, allOk });
}

console.log('\n' + '='.repeat(72));
console.log(' SAMENVATTING');
console.log('='.repeat(72));
console.log(`\n Totaal profielen : ${profiles.length}`);
console.log(` ✅ Volledig OK    : ${passCount}`);
console.log(` ❌ Gefaald        : ${failCount}`);
console.log(` ⚠️  Overgeslagen   : ${warnCount}`);

const okPct = (passCount / (passCount + failCount) * 100).toFixed(0);
console.log(`\n Score: ${okPct}% van de profielen voldoen aan alle fysiologische criteria`);

if (failCount > 0) {
  console.log('\n Gefaalde profielen:');
  results.filter(r => !r.allOk).forEach(r => {
    console.log(`   - ${r.label}`);
    console.log(`     LT1=${r.lt1.toFixed(2)}km/h (${r.lt1pct}%), LT2=${r.lt2.toFixed(2)}km/h (${r.lt2pct}%), R²=${r.r2.toFixed(3)}`);
  });
}

console.log('\n' + '='.repeat(72) + '\n');
