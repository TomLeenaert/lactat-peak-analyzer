import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';
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
  const [stepDuration, setStepDuration] = useState('5');
  const [stepIncrement, setStepIncrement] = useState('1');
  const [results, setResults] = useState<CalculationResults | null>(null);

  const onGenerateSteps = useCallback(() => {
    const steps: StepData[] = Array.from({ length: protocol.numberOfSteps }, (_, i) => ({
      speed: protocol.startSpeed + i * protocol.stepIncrement,
      lactate: 0,
      hr: 0,
      watt: 0,
    }));
    if (protocol.allOutEnabled) {
      // Add all-out row with speed 0 (to be filled by user)
      steps.push({ speed: 0, lactate: 0, hr: 0, watt: 0 });
    }
    setTestData(steps);
    setStepDuration(String(protocol.stepDuration));
    setStepIncrement(String(protocol.stepIncrement));
    setActiveTab('data');
    toast({ title: 'Stappen gegenereerd', description: `${protocol.numberOfSteps} stappen${protocol.allOutEnabled ? ' + all-out' : ''} klaargezet in Data Invoer.` });
  }, [protocol, toast]);

  const onCalculate = useCallback(() => {
    const result = calculate(testData, parseFloat(restingLactate) || 0);
    if (typeof result === 'string') {
      toast({ title: 'Fout', description: result, variant: 'destructive' });
      return;
    }
    setResults(result);
    setActiveTab('results');
    toast({ title: 'Berekening voltooid', description: 'Bekijk de resultaten en trainingszones.' });
  }, [testData, restingLactate, toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[900px] mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">🔬 Lactaat Inspanningstest</h1>
          <p className="text-lg text-muted-foreground mt-1">Volledig protocol, berekening & trainingszones</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
            <TabsTrigger value="protocol" className="flex-1 min-w-[100px]">📋 Protocol</TabsTrigger>
            <TabsTrigger value="data" className="flex-1 min-w-[100px]">📊 Data Invoer</TabsTrigger>
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
      </div>
    </div>
  );
};

export default Index;
