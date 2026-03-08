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
import { calculate, type StepData, type CalculationResults } from '@/lib/lactate-math';
import { type ProtocolSettings, DEFAULT_PROTOCOL } from '@/lib/protocol-types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

const AthleteTest = () => {
  const { id: athleteId, testId } = useParams<{ id: string; testId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      if (data.steps_json) setTestData(data.steps_json as unknown as StepData[]);
      if (data.protocol_json) setProtocol(data.protocol_json as unknown as ProtocolSettings);
      if (data.results_json) {
        setResults(data.results_json as unknown as CalculationResults);
        setActiveTab('results');
      }
      setTestDate(data.test_date);
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
    const steps: StepData[] = Array.from({ length: protocol.numberOfSteps }, (_, i) => ({
      speed: protocol.startSpeed + i * protocol.stepIncrement,
      lactate: 0, hr: 0, watt: 0,
    }));
    if (protocol.allOutEnabled) steps.push({ speed: 0, lactate: 0, hr: 0, watt: 0 });
    setTestData(steps);
    setStepDuration(String(protocol.stepDuration));
    setStepIncrement(String(protocol.stepIncrement));
    setActiveTab('data');
    toast({ title: 'Stappen gegenereerd', description: `${protocol.numberOfSteps} stappen klaargezet.` });
  }, [protocol, toast]);

  const onCalculate = useCallback(() => {
    const result = calculate(testData, parseFloat(restingLactate) || 0);
    if (typeof result === 'string') {
      toast({ title: 'Fout', description: result, variant: 'destructive' });
      return;
    }
    setResults(result);
    setActiveTab('results');
    toast({ title: 'Berekening voltooid' });
  }, [testData, restingLactate, toast]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/athlete/${athleteId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {testId ? 'Test bekijken' : 'Nieuwe test'} — {athlete?.name || ''}
            </h1>
          </div>
          {results && (
            <Button onClick={() => saveTest.mutate()} disabled={saveTest.isPending}>
              <Save className="h-4 w-4 mr-2" />{saveTest.isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
            <TabsTrigger value="protocol" className="flex-1 min-w-[100px]">📋 Protocol</TabsTrigger>
            <TabsTrigger value="data" className="flex-1 min-w-[100px]">📊 Data</TabsTrigger>
            <TabsTrigger value="results" className="flex-1 min-w-[100px]">🎯 Resultaten</TabsTrigger>
            <TabsTrigger value="zones" className="flex-1 min-w-[100px]">🏃 Zones</TabsTrigger>
            <TabsTrigger value="science" className="flex-1 min-w-[100px]">📚 Wetenschap</TabsTrigger>
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
                stepDuration={stepDuration} setStepDuration={setStepDuration}
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
