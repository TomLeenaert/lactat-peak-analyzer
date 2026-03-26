import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ResultsTab from '@/components/ResultsTab';
import ZonesTab from '@/components/ZonesTab';
import { DEMO_RESULTS, DEMO_STEPS } from '@/lib/demo-data';

type Step = 'protocol' | 'data' | 'analyze';

const STEPS = [
  { key: 'protocol' as const, label: 'GET SET.' },
  { key: 'data' as const, label: 'TEST.' },
  { key: 'analyze' as const, label: 'ANALYZE.' },
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

const StepProtocol = () => {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#6644ff,#00c9a7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            S
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Atleet</div>
            <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700 }}>Sarah Vermeulen</div>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Protocol configuratie</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {proto.map(p => (
            <div key={p.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
            }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{p.label}</span>
              <span style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{p.value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '10px 14px', background: 'rgba(0,201,167,0.1)', border: '1px solid rgba(0,201,167,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✓</span>
          <span style={{ fontSize: '13px', color: 'rgba(0,201,167,0.9)', fontWeight: 600 }}>8 teststappen klaar — start de veldtest</span>
        </div>
      </DemoCard>
    </div>
  );
};

const StepData = () => (
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
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
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
      <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(0,201,167,0.1)', border: '1px solid rgba(0,201,167,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>✓</span>
        <span style={{ fontSize: '13px', color: 'rgba(0,201,167,0.9)', fontWeight: 600 }}>Alle data ingegeven — drempels berekend</span>
      </div>
    </DemoCard>
  </div>
);

const StepResults = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <ResultsTab results={DEMO_RESULTS} />
    <ZonesTab results={DEMO_RESULTS} />
  </div>
);

const LandingDemo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('protocol');

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
          Klik door de stappen en ontdek de volledige flow — van protocol tot drempelanalyse.
        </p>
      </div>

      {/* StepNav-style navigation */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        marginBottom: '32px',
        width: '100%',
      }}>
        {/* Connecting line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'linear-gradient(90deg, #00fdc1, #6644ff)',
          transform: 'translateY(-50%)',
          zIndex: 0,
        }} />

        {STEPS.map(({ key, label }) => {
          const isActive = step === key;
          return (
            <button
              key={key}
              onClick={() => setStep(key)}
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '10px 24px',
                borderRadius: '999px',
                border: isActive ? '2px solid #6644ff' : '2px solid rgba(102,68,255,0.3)',
                background: isActive ? '#6644ff' : '#1a1a2e',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 20px rgba(102,68,255,0.5)' : 'none',
                WebkitTapHighlightColor: 'transparent',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{ minHeight: '320px' }}>
        {step === 'protocol' && <StepProtocol />}
        {step === 'data' && <StepData />}
        {step === 'analyze' && <StepResults />}
      </div>

      {/* CTA at bottom */}
      {step === 'analyze' && (
        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '12px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: 700,
              background: 'linear-gradient(135deg,#00c9a7,#00a88c)', border: 'none',
              color: '#fff', cursor: 'pointer',
            }}
          >
            Probeer zelf gratis →
          </button>
        </div>
      )}
    </div>
  );
};

export default LandingDemo;
