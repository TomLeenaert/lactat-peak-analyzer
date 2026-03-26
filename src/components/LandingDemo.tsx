import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ResultsTab from '@/components/ResultsTab';
import ZonesTab from '@/components/ZonesTab';
import { DEMO_RESULTS, DEMO_STEPS } from '@/lib/demo-data';

type Step = 0 | 1 | 2 | 3;

const STEPS_META = [
  { num: 1, label: 'Atleet aanmaken' },
  { num: 2, label: 'Protocol instellen' },
  { num: 3, label: 'Data ingeven' },
  { num: 4, label: 'Resultaten' },
];

const PACE_ROWS = DEMO_STEPS.map(s => {
  const secPerKm = 3600 / s.speed;
  const m = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60).toString().padStart(2, '0');
  return { pace: `${m}:${sec} /km`, lactate: s.lactate.toFixed(1), hr: s.hr };
});

const DemoCard = ({ children }: { children: ReactNode }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '14px', padding: '24px',
  }}>
    {children}
  </div>
);

const StepAthlete = ({ active }: { active: boolean }) => {
  const [chars, setChars] = useState(0);
  const [showSport, setShowSport] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [done, setDone] = useState(false);
  const name = 'Sarah Vermeulen';
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!active) { setChars(0); setShowSport(false); setShowGoal(false); setDone(false); return; }
    const t = timers.current;
    let i = 0;
    const type = () => {
      if (i < name.length) {
        setChars(++i);
        t.push(window.setTimeout(type, 60));
      } else {
        t.push(window.setTimeout(() => setShowSport(true), 400));
        t.push(window.setTimeout(() => setShowGoal(true), 900));
        t.push(window.setTimeout(() => setDone(true), 1400));
      }
    };
    t.push(window.setTimeout(type, 600));
    return () => t.forEach(clearTimeout);
  }, [active]);

  const field = (label: string, value: ReactNode, show = true) => (
    <div style={{ marginBottom: '16px', opacity: show ? 1 : 0, transition: 'opacity .4s' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: '#fff', fontWeight: 500 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <DemoCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#6644ff,#00c9a7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {chars > 0 ? name[0] : ''}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Naam atleet</div>
            <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700, minHeight: '26px' }}>
              {name.slice(0, chars)}<span style={{ opacity: chars < name.length ? 1 : 0, transition: 'opacity .1s' }}>|</span>
            </div>
          </div>
        </div>
        {field('Sport', 'Lopen – 10 km / halve marathon', showSport)}
        {field('Doel', 'Periodieke drempelopvolging', showGoal)}
        {done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '10px 14px', background: 'rgba(0,201,167,0.1)', border: '1px solid rgba(0,201,167,0.25)', borderRadius: '8px' }}>
            <span style={{ fontSize: '16px' }}>✓</span>
            <span style={{ fontSize: '13px', color: 'rgba(0,201,167,0.9)', fontWeight: 600 }}>Atleet aangemaakt</span>
          </div>
        )}
      </DemoCard>
    </div>
  );
};

const StepProtocol = ({ active }: { active: boolean }) => {
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [showBtn, setShowBtn] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!active) { setShow1(false); setShow2(false); setShow3(false); setShowBtn(false); setConfirmed(false); return; }
    const t = timers.current;
    t.push(window.setTimeout(() => setShow1(true), 400));
    t.push(window.setTimeout(() => setShow2(true), 900));
    t.push(window.setTimeout(() => setShow3(true), 1400));
    t.push(window.setTimeout(() => setShowBtn(true), 1900));
    t.push(window.setTimeout(() => setConfirmed(true), 2600));
    return () => t.forEach(clearTimeout);
  }, [active]);

  const proto = [
    { label: 'Sport', value: 'Lopen' },
    { label: 'Afstand per stap', value: '1.600 m' },
    { label: 'Startsnelheid', value: '9 km/u' },
    { label: 'Stapgrootte', value: '+1 km/u' },
    { label: 'Aantal stappen', value: '8 stappen' },
  ];

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <DemoCard>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>Protocol configuratie</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {proto.map((p, i) => (
            <div key={p.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
              opacity: i < 2 ? (show1 ? 1 : 0) : i < 4 ? (show2 ? 1 : 0) : (show3 ? 1 : 0),
              transition: 'opacity .4s',
            }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{p.label}</span>
              <span style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{p.value}</span>
            </div>
          ))}
        </div>
        {showBtn && !confirmed && (
          <div style={{ marginTop: '20px', padding: '10px 14px', background: 'rgba(102,68,255,0.15)', border: '1px solid rgba(102,68,255,0.3)', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: '#a090ff', fontWeight: 600 }}>
            Protocol genereren...
          </div>
        )}
        {confirmed && (
          <div style={{ marginTop: '20px', padding: '10px 14px', background: 'rgba(0,201,167,0.1)', border: '1px solid rgba(0,201,167,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✓</span>
            <span style={{ fontSize: '13px', color: 'rgba(0,201,167,0.9)', fontWeight: 600 }}>8 teststappen klaar — start de veldtest</span>
          </div>
        )}
      </DemoCard>
    </div>
  );
};

const StepData = ({ active }: { active: boolean }) => {
  const [rowsVisible, setRowsVisible] = useState(0);
  const [showCalc, setShowCalc] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!active) { setRowsVisible(0); setShowCalc(false); return; }
    const t = timers.current;
    PACE_ROWS.forEach((_, i) => {
      t.push(window.setTimeout(() => setRowsVisible(i + 1), 400 + i * 380));
    });
    t.push(window.setTimeout(() => setShowCalc(true), 400 + PACE_ROWS.length * 380 + 400));
    return () => t.forEach(clearTimeout);
  }, [active]);

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <DemoCard>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Veldtest data — Sarah Vermeulen</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['Stap', 'Tempo', 'Lactaat (mmol/L)', 'Hartslag (bpm)'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '11px', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PACE_ROWS.map((row, i) => (
              <tr key={i} style={{
                opacity: i < rowsVisible ? 1 : 0,
                transform: i < rowsVisible ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity .3s, transform .3s',
                background: i === rowsVisible - 1 ? 'rgba(102,68,255,0.08)' : 'transparent',
              }}>
                <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{i + 1}</td>
                <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.pace}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: parseFloat(row.lactate) >= 4 ? '#ff7043' : parseFloat(row.lactate) >= 2 ? '#ffa726' : '#00c9a7', fontWeight: 600 }}>{row.lactate}</span>
                </td>
                <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.hr}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showCalc && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(0,201,167,0.1)', border: '1px solid rgba(0,201,167,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✓</span>
            <span style={{ fontSize: '13px', color: 'rgba(0,201,167,0.9)', fontWeight: 600 }}>Alle data ingegeven — drempels worden berekend...</span>
          </div>
        )}
      </DemoCard>
    </div>
  );
};

const StepResults = ({ active }: { active: boolean }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) { setShow(false); return; }
    const t = window.setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div style={{ opacity: show ? 1 : 0, transition: 'opacity .5s', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ResultsTab results={DEMO_RESULTS} />
      <ZonesTab results={DEMO_RESULTS} />
    </div>
  );
};

const LandingDemo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);

  const panels = [
    <StepAthlete key={0} active={step === 0} />,
    <StepProtocol key={1} active={step === 1} />,
    <StepData key={2} active={step === 2} />,
    <StepResults key={3} active={step === 3} />,
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(102,68,255,0.12)', border: '1px solid rgba(102,68,255,0.25)',
          borderRadius: '20px', padding: '5px 14px', marginBottom: '20px',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6644ff', boxShadow: '0 0 8px #6644ff' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#a090ff' }}>Interactieve demo — geen login nodig</span>
        </div>
        <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: '12px' }}>
          Zo werkt MyLactest in de praktijk
        </h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
          Van atleet aanmaken tot volledige drempelanalyse — dit is de echte tool met echte berekeningen.
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', gap: '0' }}>
        {STEPS_META.map((s, i) => {
          const active = step === i;
          const done = step > i;
          return (
            <button key={i} onClick={() => setStep(i as Step)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative',
            }}>
              {i < STEPS_META.length - 1 && (
                <div style={{
                  position: 'absolute', top: '17px', left: 'calc(50% + 17px)',
                  width: 'calc(100% - 34px)', height: '2px',
                  background: done ? '#6644ff' : 'rgba(255,255,255,0.1)',
                  transition: 'background .4s',
                }} />
              )}
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                border: `2px solid ${active ? '#6644ff' : done ? '#6644ff' : 'rgba(255,255,255,0.15)'}`,
                background: done ? '#6644ff' : active ? 'rgba(102,68,255,0.2)' : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700,
                color: active || done ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all .3s', flexShrink: 0, zIndex: 1,
              }}>
                {done ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', transition: 'color .3s' }}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{ minHeight: '320px' }}>
        {panels[step]}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px' }}>
        <button
          onClick={() => setStep(s => Math.max(s - 1, 0) as Step)}
          disabled={step === 0}
          style={{
            padding: '10px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: step === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
            cursor: step === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Vorige
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {STEPS_META.map((_, i) => (
            <div key={i} onClick={() => setStep(i as Step)} style={{
              width: step === i ? '24px' : '8px', height: '8px', borderRadius: '4px',
              background: step === i ? '#6644ff' : step > i ? 'rgba(102,68,255,0.5)' : 'rgba(255,255,255,0.15)',
              transition: 'all .3s', cursor: 'pointer',
            }} />
          ))}
        </div>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => Math.min(s + 1, 3) as Step)}
            style={{
              padding: '11px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700,
              background: 'linear-gradient(135deg,#6644ff,#8866ff)', border: 'none',
              color: '#fff', cursor: 'pointer', boxShadow: '0 4px 20px rgba(102,68,255,0.35)',
            }}
          >
            Volgende stap →
          </button>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '10px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg,#00c9a7,#00a88c)', border: 'none',
              color: '#fff', cursor: 'pointer',
            }}
          >
            Probeer zelf →
          </button>
        )}
      </div>
    </div>
  );
};

export default LandingDemo;