import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ProtocolTab from '@/components/ProtocolTab';
import DataInputTab from '@/components/DataInputTab';
import ResultsTab from '@/components/ResultsTab';
import ZonesTab from '@/components/ZonesTab';
import ScienceTab from '@/components/ScienceTab';
import AppNav from '@/components/AppNav';
import { calculate, type StepData, type CalculationResults } from '@/lib/lactate-math';
import { type ProtocolSettings, DEFAULT_PROTOCOL } from '@/lib/protocol-types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Save } from 'lucide-react';

const AthleteTest = () => {
  const { id: athleteId, testId } = useParams<{ id: string; testId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Load existing test if viewing
  const { data: existingTest } = useQuery({
    queryKey: ['test', testId],
    queryFn: async () => {
      const { data, error } = await supabase.from('test_results').select('*').eq('id', testId!).single();
      if (error) throw error;
      // Restore state from saved data
      const steps = data.steps_json as unknown as StepData[];
      if (steps) setTestData(steps);
      if (data.protocol_json) setProtocol(data.protocol_json as unknown as ProtocolSettings);
      setTestDate(data.test_date);

      // Auto-calculate from steps if we have data
      if (steps && steps.filter(r => r.speed > 0 && r.lactate > 0).length >= 4) {
        const calcResult = calculate(steps, 0);
        if (typeof calcResult !== 'string') {
          setResults(calcResult);
          setActiveTab('results');
        }
      } else if (data.results_json && Object.keys(data.results_json as object).length > 0) {
        setResults(data.results_json as unknown as CalculationResults);
        setActiveTab('results');
      }
      return data;
    },
    enabled: !!testId,
  });

  // Fetch athlete name
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
    toast({ title: 'Stappen gegenereerd', description: `${steps.length} stappen klaargezet.` });
  }, [protocol, toast]);

  const onCalculate = useCallback(async () => {
    // Bestaande test bekijken: geen token verbruiken
    if (!testId) {
      // Verbruik 1 token via RPC
      const { data: tokenUsed, error } = await supabase.rpc('use_token');
      if (error) {
        toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        return;
      }
      if (!tokenUsed) {
        toast({
          title: 'Geen tokens meer',
          description: 'Je hebt geen analysetokens meer. Contacteer Tom om tokens bij te kopen.',
          variant: 'destructive',
        });
        return;
      }
      // Token verbruikt — refresh de balance in AppNav
      queryClient.invalidateQueries({ queryKey: ['profile-nav'] });
    }

    const result = calculate(testData, parseFloat(restingLactate) || 0);
    if (typeof result === 'string') {
      toast({ title: 'Fout', description: result, variant: 'destructive' });
      return;
    }
    setResults(result);
    setActiveTab('results');
    toast({ title: 'Berekening voltooid' });
  }, [testData, restingLactate, testId, toast, queryClient]);

  // Save test results
  const saveTest = useMutation({
    mutationFn: async () => {
      const payload = {
        athlete_id: athleteId!,
        test_date: testDate,
        protocol_json: protocol as any,
        steps_json: testData as any,
        results_json: results as any,
      };
      if (testId) {
        const { error } = await supabase.from('test_results').update(payload).eq('id', testId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('test_results').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests', athleteId] });
      toast({ title: 'Test opgeslagen' });
      navigate(`/athlete/${athleteId}`);
    },
    onError: (err: any) => toast({ title: 'Fout', description: err.message, variant: 'destructive' }),
  });

  const saveButton = results ? (
    <Button
      onClick={() => saveTest.mutate()}
      disabled={saveTest.isPending}
      size="sm"
      style={{ background: '#6644ff', border: 'none', color: '#fff', fontSize: '13px' }}
    >
      <Save className="h-3.5 w-3.5 mr-1.5" />
      {saveTest.isPending ? 'Opslaan...' : 'Opslaan'}
    </Button>
  ) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppNav
        backTo={`/athlete/${athleteId}`}
        backLabel="Alle atleten"
        title={`${testId ? 'Test bekijken' : 'Nieuwe test'}${athlete?.name ? ` — ${athlete.name}` : ''}`}
        rightContent={saveButton}
      />

      <main className="max-w-[900px] mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5 h-auto bg-muted p-1">
            <TabsTrigger value="protocol" className="text-xs sm:text-sm px-1 py-2">
              <span className="sm:hidden">📋</span>
              <span className="hidden sm:inline">📋 Protocol</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs sm:text-sm px-1 py-2">
              <span className="sm:hidden">📊</span>
              <span className="hidden sm:inline">📊 Data</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="text-xs sm:text-sm px-1 py-2">
              <span className="sm:hidden">🎯</span>
              <span className="hidden sm:inline">🎯 Resultaten</span>
            </TabsTrigger>
            <TabsTrigger value="zones" className="text-xs sm:text-sm px-1 py-2">
              <span className="sm:hidden">🏃</span>
              <span className="hidden sm:inline">🏃 Zones</span>
            </TabsTrigger>
            <TabsTrigger value="science" className="text-xs sm:text-sm px-1 py-2">
              <span className="sm:hidden">📚</span>
              <span className="hidden sm:inline">📚 Wetenschap</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="protocol">
              <ProtocolTab protocol={protocol} setProtocol={setProtocol} onGenerateSteps={onGenerateSteps} />
            </TabsContent>
            <TabsContent value="data">
              <DataInputTab
                testData={testData} setTestData={setTestData}
                athleteName={athleteName} setAthleteName={setAthleteName}
                testDate={testDate} setTestDate={setTestDate}
                restingLactate={restingLactate} setRestingLactate={setRestingLactate}
                stepDistance={stepDistance} setStepDistance={setStepDistance}
                stepIncrement={stepIncrement} setStepIncrement={setStepIncrement}
                onCalculate={onCalculate}
              />
            </TabsContent>
            <TabsContent value="results"><ResultsTab results={results} /></TabsContent>
            <TabsContent value="zones"><ZonesTab results={results} /></TabsContent>
            <TabsContent value="science"><ScienceTab /></TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default AthleteTest;
