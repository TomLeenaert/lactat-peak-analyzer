import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ProtocolSettings } from '@/lib/protocol-types';
import { formatPace, formatPace400 } from '@/lib/lactate-math';
import PaceInput, { PaceIncrementInput } from './PaceInput';
import { useLang } from '@/contexts/LanguageContext';

interface ProtocolTabProps {
  protocol: ProtocolSettings;
  setProtocol: (p: ProtocolSettings) => void;
  onGenerateSteps: () => void;
  onNext?: () => void;
}

const S = {
  card: {
    background: '#131313',
    border: '1px solid #262626',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '12px',
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: '14px',
    fontFamily: 'Inter, sans-serif',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  } as React.CSSProperties,
  stepNum: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 700,
    color: '#bd9dff',
    letterSpacing: '0.5px',
    minWidth: '22px',
    marginTop: '2px',
    flexShrink: 0,
  } as React.CSSProperties,
};

const ProtocolStep = ({ num, title, desc }: { num: string; title: string; desc: string }) => (
  <div style={S.stepRow}>
    <span style={S.stepNum}>{num}</span>
    <div>
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>{title}</p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{desc}</p>
    </div>
  </div>
);

const ProtocolTab = ({ protocol, setProtocol, onGenerateSteps, onNext }: ProtocolTabProps) => {
  const { t, lang } = useLang();

  const update = (field: keyof ProtocolSettings, value: number | boolean) => {
    setProtocol({ ...protocol, [field]: value });
  };

  const previewSpeeds: number[] = [];
  let currentSpeed = protocol.startSpeed;
  for (let i = 0; i < protocol.numberOfSteps; i++) {
    previewSpeeds.push(currentSpeed);
    const currentPaceMin = 60 / currentSpeed;
    const nextPaceMin = currentPaceMin - protocol.paceIncrementSec / 60;
    if (nextPaceMin <= 0) break;
    currentSpeed = 60 / nextPaceMin;
  }

  const warmupDesc = lang === 'nl'
    ? `Lichte jog op 60-65% HFmax (~${formatPace(8)} /km). Bouw op tot licht bezweet. Eindig met 2–3 korte versnellingen (10s).`
    : `Light jog at 60-65% HRmax (~${formatPace(8)} /km). Build up to a light sweat. Finish with 2–3 short accelerations (10s).`;

  const stepsDesc = lang === 'nl'
    ? `Loop ${protocol.stepDistance}m per stap. Start op ${formatPace(protocol.startSpeed)} /km, verhoog het tempo met ${protocol.paceIncrementSec}s per stap. Na elke stap: 30s pauze voor bloedafname.`
    : `Run ${protocol.stepDistance}m per step. Start at ${formatPace(protocol.startSpeed)} /km, increase pace by ${protocol.paceIncrementSec}s per step. After each step: 30s pause for blood sample.`;

  const allOutDesc = lang === 'nl'
    ? `Na de laatste reguliere stap: maximale inspanning over ${protocol.allOutDistance}m. Meet hartslag en lactaat direct na afloop en na 1 min rust.`
    : `After the last regular step: maximum effort over ${protocol.allOutDistance}m. Measure heart rate and lactate immediately after and after 1 min rest.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Protocol setup */}
      <div style={S.card}>
        <p style={S.sectionLabel}>{t('protocol.setup')}</p>

        <div style={{ background: 'rgba(189,157,255,0.06)', border: '1px solid rgba(189,157,255,0.15)', borderRadius: '6px', padding: '12px 14px', marginBottom: '18px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            <span style={{ color: '#bd9dff', fontWeight: 600 }}>Protocol:</span> {t('protocol.info')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          <div>
            <Label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('protocol.startPace')}</Label>
            <PaceInput speedKmh={protocol.startSpeed} onChange={v => update('startSpeed', v)} />
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>{t('protocol.firstStep')}</p>
          </div>
          <div>
            <Label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('protocol.increment')}</Label>
            <PaceIncrementInput seconds={protocol.paceIncrementSec} onChange={v => update('paceIncrementSec', v)} />
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>{t('protocol.fasterPerStep')}</p>
          </div>
          <div>
            <Label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('protocol.stepDistance')}</Label>
            <Input
              type="number" step="100" min={400} max={3000}
              value={protocol.stepDistance}
              onChange={e => update('stepDistance', parseInt(e.target.value) || 1600)}
              style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
            />
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>{t('protocol.typical')}</p>
          </div>
        </div>

        {/* All-out */}
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: protocol.allOutEnabled ? '14px' : '0' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{t('protocol.allOut')}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{t('protocol.allOutDesc')}</p>
            </div>
            <Switch checked={protocol.allOutEnabled} onCheckedChange={v => update('allOutEnabled', v)} />
          </div>
          {protocol.allOutEnabled && (
            <div>
              <Label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('protocol.allOutDistance')}</Label>
              <Input
                type="number" step="100"
                value={protocol.allOutDistance}
                onChange={e => update('allOutDistance', parseInt(e.target.value) || 800)}
                placeholder="bv. 800"
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '14px', marginBottom: '18px' }}>
          <p style={S.sectionLabel}>{t('protocol.preview')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {previewSpeeds.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '4px', padding: '10px 12px',
              }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '3px',
                  background: 'rgba(189,157,255,0.1)', color: '#bd9dff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>{formatPace(s)} /km</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{formatPace400(s)} /400m</span>
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{protocol.stepDistance}m</span>
              </div>
            ))}
            {protocol.allOutEnabled && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,116,64,0.05)', border: '1px solid rgba(255,116,64,0.2)',
                borderRadius: '4px', padding: '10px 12px',
              }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '3px',
                  background: 'rgba(255,116,64,0.15)', color: '#ff7440',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, flexShrink: 0,
                }}>MAX</span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: '13px', color: '#ff7440' }}>All-out</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,116,64,0.5)', fontFamily: 'monospace' }}>{protocol.allOutDistance}m</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onGenerateSteps}
          style={{
            width: '100%', padding: '14px', borderRadius: '6px', border: 'none',
            background: 'linear-gradient(135deg, #8b4aff 0%, #bd9dff 100%)',
            color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          {t('protocol.generate')}
        </button>
      </div>

      {/* Test protocol guidelines */}
      <div style={S.card}>
        <p style={S.sectionLabel}>{t('protocol.preparation')}</p>
        <ProtocolStep num="01" title={t('protocol.prep1title')} desc={t('protocol.prep1desc')} />
        <ProtocolStep num="02" title={t('protocol.prep2title')} desc={t('protocol.prep2desc')} />
        <ProtocolStep num="03" title={t('protocol.prep3title')} desc={t('protocol.prep3desc')} />

        <p style={{ ...S.sectionLabel, marginTop: '20px' }}>{t('protocol.testProcedure')}</p>
        <ProtocolStep num="01" title={t('protocol.restMeasure')} desc={t('protocol.restDesc')} />
        <ProtocolStep num="02" title={t('protocol.warmup')} desc={warmupDesc} />
        <ProtocolStep num="03" title={`${t('data.step')} — ${protocol.stepDistance}m`} desc={stepsDesc} />
        <ProtocolStep num="04" title={t('protocol.bloodSample')} desc={t('protocol.bloodDesc')} />
        {protocol.allOutEnabled && (
          <ProtocolStep num="05" title={`All-out: ${protocol.allOutDistance}m`} desc={allOutDesc} />
        )}
        <ProtocolStep num={protocol.allOutEnabled ? '06' : '05'} title={t('protocol.cooldown')} desc={t('protocol.cooldownDesc')} />
      </div>

      {/* Next step button */}
      {onNext && (
        <button
          onClick={onNext}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #6644ff 0%, #8b4aff 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'Space Grotesk, monospace',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            marginTop: '16px',
          }}
        >
          {t('common.next')} →
        </button>
      )}
    </div>
  );
};

export default ProtocolTab;
