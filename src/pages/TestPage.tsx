import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ProtocolTab from '@/components/ProtocolTab';
import DataInputTab from '@/components/DataInputTab';
import ResultsTab from '@/components/ResultsTab';
import ZonesTab from '@/components/ZonesTab';
import ScienceTab from '@/components/ScienceTab';
import { calculate, type StepData, type CalculationResults } from '@/lib/lactate-math';
import { type ProtocolSettings, DEFAULT_PROTOCOL } from '@/lib/protocol-types';
import { useToast } from '@/hooks/use-toast';

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
  const isQuick = type === 'quick';

  const defaultProtocol = isQuick ? QUICK_PROTOCOL : DEFAULT_PROTOCOL;

  const [activeTab, setActiveTab] = useState('protocol');
  const [protocol, setProtocol] = useState<ProtocolSettings>(defaultProtocol);
  const [testData, setTestData] = useState<StepData[]>(
    Array.from({ length: defaultProtocol.numberOfSteps }, () => ({ speed: 0, lactate: 0, hr: 0, watt: 0 }))
  );
  const [athleteName, setAthleteName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [restingLactate, setRestingLactate] = useState('');
  const [stepDuration, setStepDuration] = useState(String(defaultProtocol.stepDuration));
  const [stepIncrement, setStepIncrement] = useState(String(defaultProtocol.stepIncrement));
  const [results, setResults] = useState<CalculationResults | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">
            {isQuick ? '⚡ Veldtest' : '🔬 Volledige inspanningstest'}
          </h1>
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

export default TestPage;
