import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProtocolTab from '@/components/ProtocolTab';
import DataInputTab from '@/components/DataInputTab';
import ResultsTab from '@/components/ResultsTab';
import ZonesTab from '@/components/ZonesTab';
import ScienceTab from '@/components/ScienceTab';
import { calculate, type StepData, type CalculationResults } from '@/lib/lactate-math';
import { type ProtocolSettings, DEFAULT_PROTOCOL } from '@/lib/protocol-types';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
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
    if (protocol.allOutEnabled) {
      steps.push({ speed: 0, lactate: 0, hr: 0, watt: 0 });
    }
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
      <div className="mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-[900px]">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">🔬 Lactaat Inspanningstest</h1>
          <p className="text-sm sm:text-lg text-muted-foreground mt-1">Protocol, berekening & trainingszones</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex h-auto gap-0.5 bg-muted p-1">
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
      </div>
    </div>
  );
};

export default Index;
