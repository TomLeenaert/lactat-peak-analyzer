import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import DataInputTab from '@/components/DataInputTab';
import AnalyzeTab from '@/components/AnalyzeTab';
import StepNav from '@/components/StepNav';
import { calculate, type StepData, type CalculationResults } from '@/lib/lactate-math';
import { type ProtocolSettings, DEFAULT_PROTOCOL } from '@/lib/protocol-types';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/contexts/LanguageContext';

const QUICK_PROTOCOL: ProtocolSettings = {
  startSpeed: 10,
  stepIncrement: 1.5,
  paceIncrementSec: 30,
  stepDistance: 1200,
  numberOfSteps: 4,
  allOutEnabled: false,
  allOutDistance: 800,
  allOutDuration: 180,
};

const TestPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLang();
  const isQuick = type === 'quick';

  const defaultProtocol = isQuick ? QUICK_PROTOCOL : DEFAULT_PROTOCOL;

  const [activeTab, setActiveTab] = useState('data');
  const [protocol, setProtocol] = useState<ProtocolSettings>(defaultProtocol);
  const [testData, setTestData] = useState<StepData[]>(
    Array.from({ length: defaultProtocol.numberOfSteps }, () => ({ speed: 0, lactate: 0, hr: 0, watt: 0 }))
  );
  const [athleteName, setAthleteName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [restingLactate, setRestingLactate] = useState('');
  const [stepDistance, setStepDistance] = useState(String(defaultProtocol.stepDistance));
  const [stepIncrement, setStepIncrement] = useState(String(defaultProtocol.stepIncrement));
  const [results, setResults] = useState<CalculationResults | null>(null);

  const onGenerateSteps = useCallback(() => {
    const steps: StepData[] = [];
    let currentSpeed = protocol.startSpeed;
    for (let i = 0; i < protocol.numberOfSteps; i++) {
      steps.push({ speed: currentSpeed, lactate: 0, hr: 0, watt: 0 });
      const currentPaceMin = 60 / currentSpeed;
      const nextPaceMin = currentPaceMin - protocol.paceIncrementSec / 60;
      if (nextPaceMin <= 0) break;
      currentSpeed = 60 / nextPaceMin;
    }
    if (protocol.allOutEnabled) steps.push({ speed: 0, lactate: 0, hr: 0, watt: 0 });
    setTestData(steps);
    setStepDistance(String(protocol.stepDistance));
    setStepIncrement(String(protocol.stepIncrement));
    setActiveTab('data');
    toast({ title: t('test.stepsGenerated'), description: `${steps.length} ${t('test.stepsReady')}` });
  }, [protocol, toast, t]);

  const onCalculate = useCallback(() => {
    const result = calculate(testData, parseFloat(restingLactate) || 0);
    if (typeof result === 'string') {
      toast({ title: t('common.error'), description: result, variant: 'destructive' });
      return;
    }
    setResults(result);
    setActiveTab('analyze');
    toast({ title: t('test.calculationDone') });
  }, [testData, restingLactate, toast, t]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--wb-bg)' }}>
      <header style={{
        background: 'var(--wb-surface)',
        borderBottom: '1px solid var(--wb-border)',
      }}>
        <div className="max-w-[1440px] mx-auto" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 20px',
        }}>
          <Button variant="ghost" size="icon" className="shrink-0 wb-focus" onClick={() => navigate('/')} aria-label="Terug">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <nav aria-label="Breadcrumb" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '13px', color: 'var(--wb-text-dim)', minWidth: 0,
          }}>
            <span style={{ color: 'var(--wb-text-mute)' }}>Alle atleten</span>
            <span style={{ color: 'var(--wb-text-mute)' }}>/</span>
            <span style={{ color: 'var(--wb-text)', fontWeight: 600 }}>{athleteName || 'Nieuwe atleet'}</span>
            <span style={{ color: 'var(--wb-text-mute)' }}>/</span>
            <span style={{ color: 'var(--wb-text)', fontWeight: 600 }}>{isQuick ? t('test.fieldTest') : t('test.labTest')}</span>
          </nav>

          <div style={{ flex: 1 }} />

          <StepNav activeTab={activeTab} onTabChange={setActiveTab} hasResults={!!results} />

          <button
            onClick={onCalculate}
            disabled={!testData.some(r => r.lactate > 0)}
            className="wb-focus wb-transition"
            aria-label="Opslaan en analyseren"
            title="Opslaan (Cmd+S)"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              background: 'var(--wb-indigo)', color: '#fff',
              border: '1px solid var(--wb-indigo-dim)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
              opacity: testData.some(r => r.lactate > 0) ? 1 : 0.5,
            }}
          >
            Opslaan
          </button>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto" style={{ padding: '16px 20px' }}>
        {(activeTab === 'data' || activeTab === 'protocol') && (
          <DataInputTab
            testData={testData} setTestData={setTestData}
            athleteName={athleteName} setAthleteName={setAthleteName}
            testDate={testDate} setTestDate={setTestDate}
            restingLactate={restingLactate} setRestingLactate={setRestingLactate}
            stepDistance={stepDistance} setStepDistance={setStepDistance}
            stepIncrement={stepIncrement} setStepIncrement={setStepIncrement}
            onCalculate={onCalculate}
            protocol={protocol} setProtocol={setProtocol}
          />
        )}
        {activeTab === 'analyze' && (
          <AnalyzeTab results={results} />
        )}
      </main>
    </div>
  );
};

export default TestPage;
