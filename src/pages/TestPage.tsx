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
    toast({ title: 'Stappen gegenereerd', description: `${steps.length} stappen klaargezet.` });
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
        <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold truncate">
            {isQuick ? '⚡ Veldtest' : '🔬 Inspanningstest'}
          </h1>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex h-auto gap-0.5 bg-muted p-1 overflow-x-auto">
            <TabsTrigger value="protocol" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">📋 Protocol</TabsTrigger>
            <TabsTrigger value="data" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">📊 Data</TabsTrigger>
            <TabsTrigger value="results" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">🎯 Resultaat</TabsTrigger>
            <TabsTrigger value="zones" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">🏃 Zones</TabsTrigger>
            <TabsTrigger value="science" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">📚 Info</TabsTrigger>
          </TabsList>

          <div className="mt-4 sm:mt-6">
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

export default TestPage;
