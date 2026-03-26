import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ProtocolTab from '@/components/ProtocolTab';
import DataInputTab from '@/components/DataInputTab';
import AnalyzeTab from '@/components/AnalyzeTab';
import AppNav from '@/components/AppNav';
import StepNav from '@/components/StepNav';
import { calculate, type StepData, type CalculationResults } from '@/lib/lactate-math';
import { type ProtocolSettings, DEFAULT_PROTOCOL } from '@/lib/protocol-types';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const AthleteTest = () => {
  const { id: athleteId, testId } = useParams<{ id: string; testId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState('protocol');
  const [protocol, setProtocol] = useState<ProtocolSettings>(DEFAULT_PROTOCOL);
  const [testData, setTestData] = useState<StepData[]>(
    Array.from({ length: 6 }, () => ({ speed: 0, lactate: 0, hr: 0, watt: 0 }))
  );
  const [athleteName, setAthleteName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [restingLactate, setRestingLactate] = useState('');
  const [stepDistance, setStepDistance] = useState('1600');
  const [stepIncrement, setStepIncrement] = useState('1');
  const [results, setResults] = useState<CalculationResults | null>(null);

  const { data: existingTest } = useQuery({
    queryKey: ['test', testId],
    queryFn: async () => {
      const { data, error } = await supabase.from('test_results').select('*').eq('id', testId!).single();
      if (error) throw error;
      const steps = data.steps_json as unknown as StepData[];
      if (steps) setTestData(steps);
      if (data.protocol_json) setProtocol(data.protocol_json as unknown as ProtocolSettings);
      setTestDate(data.test_date);

      if (steps && steps.filter(r => r.speed > 0 && r.lactate > 0).length >= 4) {
        const calcResult = calculate(steps, 0);
        if (typeof calcResult !== 'string') {
          setResults(calcResult);
          setActiveTab('analyze');
        }
      } else if (data.results_json && Object.keys(data.results_json as object).length > 0) {
        setResults(data.results_json as unknown as CalculationResults);
        setActiveTab('analyze');
      }
      return data;
    },
    enabled: !!testId,
  });

  const { data: athlete } = useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase.from('athletes').select('name').eq('id', athleteId!).single();
      if (error) throw error;
      setAthleteName(data.name);
      return data;
    },
    enabled: !!athleteId,
  });

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

  const saveTest = useMutation({
    mutationFn: async () => {
      const payload = {
        athlete_id: athleteId!,
        test_date: testDate,
        protocol_json: protocol as unknown as Record<string, unknown>,
        steps_json: testData as unknown as Record<string, unknown>[],
        results_json: results as unknown as Record<string, unknown>,
      };
      if (testId) {
        const { error } = await supabase.from('test_results').update(payload as any).eq('id', testId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('test_results').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests', athleteId] });
      toast({ title: t('test.testSaved') });
      navigate(`/athlete/${athleteId}`);
    },
    onError: (err: Error) => toast({ title: t('common.error'), description: err.message, variant: 'destructive' }),
  });

  const saveButton = results ? (
    <Button
      onClick={() => saveTest.mutate()}
      disabled={saveTest.isPending}
      size="sm"
      style={{ background: '#6644ff', border: 'none', color: '#fff', fontSize: '13px' }}
    >
      <Save className="h-3.5 w-3.5 mr-1.5" />
      {saveTest.isPending ? t('common.saving') : t('common.save')}
    </Button>
  ) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppNav
        backTo={`/athlete/${athleteId}`}
        backLabel={t('test.allAthletes')}
        title={`${testId ? t('test.viewTest') : t('test.newTest')}${athlete?.name ? ` — ${athlete.name}` : ''}`}
        rightContent={saveButton}
      />

      <main className="max-w-[900px] mx-auto px-4 py-2 pb-6">
        <StepNav activeTab={activeTab} onTabChange={setActiveTab} hasResults={!!results} />

        {activeTab === 'protocol' && (
          <ProtocolTab protocol={protocol} setProtocol={setProtocol} onGenerateSteps={onGenerateSteps} onNext={() => setActiveTab('data')} />
        )}
        {activeTab === 'data' && (
          <DataInputTab
            testData={testData} setTestData={setTestData}
            athleteName={athleteName} setAthleteName={setAthleteName}
            testDate={testDate} setTestDate={setTestDate}
            restingLactate={restingLactate} setRestingLactate={setRestingLactate}
            stepDistance={stepDistance} setStepDistance={setStepDistance}
            stepIncrement={stepIncrement} setStepIncrement={setStepIncrement}
            onCalculate={onCalculate}
          />
        )}
        {activeTab === 'analyze' && (
          <AnalyzeTab results={results} testId={testId} athleteName={athleteName} testDate={testDate} />
        )}
      </main>
    </div>
  );
};

export default AthleteTest;
