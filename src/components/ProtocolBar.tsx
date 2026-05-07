import { useState, useEffect } from 'react';
import { ChevronDown, Info, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import PaceInput, { PaceIncrementInput } from './PaceInput';
import { type ProtocolSettings, DEFAULT_PROTOCOL } from '@/lib/protocol-types';
import { formatPace } from '@/lib/lactate-math';
import { useLang } from '@/contexts/LanguageContext';
import type { StepData } from '@/lib/lactate-math';

const HELP_LS_KEY = 'mylactest.protocolHelpSeen';

export interface ProtocolTemplate {
  key: string;
  labelNl: string;
  labelEn: string;
  protocol: ProtocolSettings;
}

const TEMPLATES: ProtocolTemplate[] = [
  {
    key: 'field-1200',
    labelNl: 'Veldtest standaard (6×1200m + all-out)',
    labelEn: 'Field test standard (6×1200m + all-out)',
    protocol: { startSpeed: 10, stepIncrement: 1, paceIncrementSec: 30, stepDistance: 1200, numberOfSteps: 6, allOutEnabled: true, allOutDistance: 600, allOutDuration: 180 },
  },
  {
    key: 'field-short',
    labelNl: 'Veldtest kort (4×1200m)',
    labelEn: 'Field test short (4×1200m)',
    protocol: { startSpeed: 10, stepIncrement: 1.5, paceIncrementSec: 30, stepDistance: 1200, numberOfSteps: 4, allOutEnabled: false, allOutDistance: 800, allOutDuration: 180 },
  },
  {
    key: 'lab-1600',
    labelNl: 'Labtest (6×1600m)',
    labelEn: 'Lab test (6×1600m)',
    protocol: DEFAULT_PROTOCOL,
  },
];

interface ProtocolBarProps {
  protocol: ProtocolSettings;
  setProtocol: (p: ProtocolSettings) => void;
  testData: StepData[];
  setTestData: (d: StepData[]) => void;
  setStepDistance: (v: string) => void;
  setStepIncrement: (v: string) => void;
}

const generateSteps = (p: ProtocolSettings): StepData[] => {
  const steps: StepData[] = [];
  let currentSpeed = p.startSpeed;
  for (let i = 0; i < p.numberOfSteps; i++) {
    steps.push({ speed: currentSpeed, lactate: 0, hr: 0, watt: 0, distance: p.stepDistance, time: 0 });
    const currentPaceMin = 60 / currentSpeed;
    const nextPaceMin = currentPaceMin - p.paceIncrementSec / 60;
    if (nextPaceMin <= 0) break;
    currentSpeed = 60 / nextPaceMin;
  }
  if (p.allOutEnabled) {
    steps.push({ speed: 0, lactate: 0, hr: 0, watt: 0, distance: p.allOutDistance, time: 0 });
  }
  return steps;
};

const ProtocolBar = ({ protocol, setProtocol, testData, setTestData, setStepDistance, setStepIncrement }: ProtocolBarProps) => {
  const { lang, t } = useLang();
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Open help by default first time only
  useEffect(() => {
    try {
      if (!localStorage.getItem(HELP_LS_KEY)) {
        setHelpOpen(true);
        localStorage.setItem(HELP_LS_KEY, '1');
      }
    } catch { /* ignore */ }
  }, []);

  const update = (field: keyof ProtocolSettings, value: number | boolean) => {
    setProtocol({ ...protocol, [field]: value });
  };

  const applyTemplate = (key: string) => {
    const tpl = TEMPLATES.find(x => x.key === key);
    if (!tpl) return;
    setProtocol(tpl.protocol);
    const steps = generateSteps(tpl.protocol);
    setTestData(steps);
    setStepDistance(String(tpl.protocol.stepDistance));
    setStepIncrement(String(tpl.protocol.stepIncrement));
  };

  const resetSteps = () => {
    const hasFilledData = testData.some(r => r.lactate > 0 || r.hr > 0 || (r.time || 0) > 0);
    if (hasFilledData) {
      const msg = lang === 'nl'
        ? 'Stappen resetten? Reeds ingevulde data gaat verloren.'
        : 'Reset steps? All filled data will be lost.';
      if (!window.confirm(msg)) return;
    }
    const steps = generateSteps(protocol);
    setTestData(steps);
    setStepDistance(String(protocol.stepDistance));
    setStepIncrement(String(protocol.stepIncrement));
  };

  const labelTemplate = lang === 'nl' ? 'Template' : 'Template';
  const labelStart = lang === 'nl' ? 'Start' : 'Start';
  const labelStep = lang === 'nl' ? 'Increment' : 'Step';
  const labelDist = lang === 'nl' ? 'Afstand' : 'Distance';
  const labelAllOut = lang === 'nl' ? 'All-out laatste stap' : 'All-out final step';
  const labelReset = lang === 'nl' ? 'Reset stappen' : 'Reset steps';
  const labelHelp = lang === 'nl' ? 'Hoe werkt dit?' : 'How does this work?';
  const labelSettings = lang === 'nl' ? 'Protocol instellingen' : 'Protocol settings';

  return (
    <div style={{
      background: '#131313',
      border: '1px solid #262626',
      borderRadius: '12px',
      padding: '12px 14px',
      marginBottom: '12px',
    }}>
      {/* Compact summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <select
          onChange={e => applyTemplate(e.target.value)}
          defaultValue=""
          style={{
            background: '#1a1a1a', border: '1px solid #333', color: '#fff',
            borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', maxWidth: '100%',
          }}
        >
          <option value="" disabled>{labelTemplate}…</option>
          {TEMPLATES.map(tpl => (
            <option key={tpl.key} value={tpl.key}>{lang === 'nl' ? tpl.labelNl : tpl.labelEn}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{labelStart}:</span>
          <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>{formatPace(protocol.startSpeed)}/km</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{labelStep}:</span>
          <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>−{protocol.paceIncrementSec}s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{labelDist}:</span>
          <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>{protocol.stepDistance}m</span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={resetSteps}
          title={labelReset}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '6px 10px',
            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <RotateCcw size={12} /> {labelReset}
        </button>
        <button
          onClick={() => setSettingsOpen(o => !o)}
          style={{
            background: settingsOpen ? 'rgba(102,68,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: settingsOpen ? '1px solid rgba(102,68,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: settingsOpen ? '#bd9dff' : 'rgba(255,255,255,0.7)',
            borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          {labelSettings} <ChevronDown size={12} style={{ transform: settingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        <button
          onClick={() => setHelpOpen(o => !o)}
          style={{
            background: helpOpen ? 'rgba(0,253,193,0.1)' : 'rgba(255,255,255,0.05)',
            border: helpOpen ? '1px solid rgba(0,253,193,0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: helpOpen ? '#00fdc1' : 'rgba(255,255,255,0.7)',
            borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <Info size={12} /> {labelHelp}
        </button>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div style={{
          marginTop: '14px', paddingTop: '14px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px',
        }}>
          <div>
            <Label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('protocol.startPace')}</Label>
            <PaceInput speedKmh={protocol.startSpeed} onChange={v => update('startSpeed', v)} />
          </div>
          <div>
            <Label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('protocol.increment')}</Label>
            <PaceIncrementInput seconds={protocol.paceIncrementSec} onChange={v => update('paceIncrementSec', v)} />
          </div>
          <div>
            <Label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('protocol.stepDistance')}</Label>
            <Input
              type="number" step="100" min={400} max={3000}
              value={protocol.stepDistance}
              onChange={e => update('stepDistance', parseInt(e.target.value) || 1200)}
              style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '18px' }}>
            <Switch checked={protocol.allOutEnabled} onCheckedChange={v => update('allOutEnabled', v)} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{labelAllOut}</span>
          </div>
        </div>
      )}

      {/* Help / education panel */}
      <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
        <CollapsibleContent>
          <div style={{
            marginTop: '14px', paddingTop: '14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '12px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)',
          }}>
            <HelpContent />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const HelpContent = () => {
  const { t, lang } = useLang();
  const items = lang === 'nl' ? [
    { num: '01', title: t('protocol.prep1title'), desc: t('protocol.prep1desc') },
    { num: '02', title: t('protocol.prep2title'), desc: t('protocol.prep2desc') },
    { num: '03', title: t('protocol.prep3title'), desc: t('protocol.prep3desc') },
    { num: '04', title: t('protocol.restMeasure'), desc: t('protocol.restDesc') },
    { num: '05', title: t('protocol.warmup'), desc: 'Lichte jog op 60-65% HFmax. Bouw op tot licht bezweet. Eindig met 2–3 korte versnellingen (10s).' },
    { num: '06', title: t('protocol.bloodSample'), desc: t('protocol.bloodDesc') },
    { num: '07', title: t('protocol.cooldown'), desc: t('protocol.cooldownDesc') },
  ] : [
    { num: '01', title: t('protocol.prep1title'), desc: t('protocol.prep1desc') },
    { num: '02', title: t('protocol.prep2title'), desc: t('protocol.prep2desc') },
    { num: '03', title: t('protocol.prep3title'), desc: t('protocol.prep3desc') },
    { num: '04', title: t('protocol.restMeasure'), desc: t('protocol.restDesc') },
    { num: '05', title: t('protocol.warmup'), desc: 'Light jog at 60-65% HRmax. Build up to a light sweat. Finish with 2–3 short accelerations (10s).' },
    { num: '06', title: t('protocol.bloodSample'), desc: t('protocol.bloodDesc') },
    { num: '07', title: t('protocol.cooldown'), desc: t('protocol.cooldownDesc') },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
      {items.map(it => (
        <div key={it.num} style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '8px', padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#bd9dff', fontFamily: 'monospace' }}>{it.num}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{it.title}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>{it.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default ProtocolBar;
