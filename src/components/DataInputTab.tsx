import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPace, type StepData } from '@/lib/lactate-math';
import PaceInput from './PaceInput';
import { Trash2, Plus } from 'lucide-react';

interface DataInputTabProps {
  testData: StepData[];
  setTestData: (data: StepData[]) => void;
  athleteName: string;
  setAthleteName: (v: string) => void;
  testDate: string;
  setTestDate: (v: string) => void;
  restingLactate: string;
  setRestingLactate: (v: string) => void;
  stepDistance: string;
  setStepDistance: (v: string) => void;
  stepIncrement: string;
  setStepIncrement: (v: string) => void;
  onCalculate: () => void;
}

const EXAMPLE_DATA: StepData[] = [
  { speed: 9, lactate: 0.9, hr: 128, watt: 180 },
  { speed: 10, lactate: 1.0, hr: 138, watt: 210 },
  { speed: 11, lactate: 1.2, hr: 148, watt: 240 },
  { speed: 12, lactate: 1.5, hr: 155, watt: 270 },
  { speed: 13, lactate: 2.1, hr: 163, watt: 300 },
  { speed: 14, lactate: 3.0, hr: 171, watt: 330 },
  { speed: 15, lactate: 4.5, hr: 178, watt: 360 },
  { speed: 16, lactate: 7.2, hr: 186, watt: 390 },
];

const TEST_DATA: StepData[] = [
  { speed: 13.19, lactate: 1.8, hr: 140, watt: 260 },
  { speed: 13.69, lactate: 1.7, hr: 146, watt: 275 },
  { speed: 14.12, lactate: 1.3, hr: 152, watt: 290 },
  { speed: 14.88, lactate: 2.7, hr: 160, watt: 310 },
  { speed: 15.06, lactate: 2.3, hr: 164, watt: 320 },
  { speed: 15.72, lactate: 3.8, hr: 167, watt: 340 },
  { speed: 16.29, lactate: 5.8, hr: 176, watt: 360 },
];

const DataInputTab = ({
  testData, setTestData,
  athleteName, setAthleteName,
  testDate, setTestDate,
  restingLactate, setRestingLactate,
  stepDistance, setStepDistance,
  stepIncrement, setStepIncrement,
  onCalculate,
}: DataInputTabProps) => {

  const loadExample = () => {
    setAthleteName('Voorbeeld Atleet');
    setTestDate('2026-03-08');
    setRestingLactate('1.0');
    setStepDistance('1600');
    setStepIncrement('1');
    setTestData([...EXAMPLE_DATA]);
  };

  const loadTestData = () => {
    setAthleteName('Testatleet 1600m');
    setTestDate('2026-03-08');
    setRestingLactate('1.3');
    setStepDistance('1600');
    setStepIncrement('0.5');
    setTestData([...TEST_DATA]);
  };

  const clearData = () => {
    setAthleteName('');
    setTestDate(new Date().toISOString().split('T')[0]);
    setRestingLactate('');
    setStepDistance('1600');
    setStepIncrement('1');
    setTestData(Array.from({ length: 6 }, () => ({ speed: 0, lactate: 0, hr: 0, watt: 0 })));
  };

  const updateRow = (i: number, field: keyof StepData, val: string) => {
    const newData = [...testData];
    newData[i] = { ...newData[i], [field]: parseFloat(val) || 0 };
    setTestData(newData);
  };

  const addRow = () => {
    const lastSpeed = testData.length > 0 ? testData[testData.length - 1].speed : 0;
    const inc = parseFloat(stepIncrement) || 1;
    setTestData([...testData, { speed: lastSpeed > 0 ? lastSpeed + inc : 0, lactate: 0, hr: 0, watt: 0 }]);
  };

  const removeRow = (i: number) => {
    setTestData(testData.filter((_, idx) => idx !== i));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-lg">Testgegevens invoeren</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={loadExample}>📥 Voorbeeld</Button>
            <Button variant="secondary" size="sm" onClick={loadTestData}>🧪 Testdata</Button>
            <Button variant="destructive" size="sm" onClick={clearData}>🗑️ Wissen</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meta fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Naam atleet</Label>
            <Input value={athleteName} onChange={e => setAthleteName(e.target.value)} placeholder="Naam" />
          </div>
          <div>
            <Label className="text-xs">Datum</Label>
            <Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Rustlactaat</Label>
            <Input type="number" step="0.1" value={restingLactate} onChange={e => setRestingLactate(e.target.value)} placeholder="1.0" />
          </div>
          <div>
            <Label className="text-xs">Afstand (m)</Label>
            <Input type="number" step="100" value={stepDistance} onChange={e => setStepDistance(e.target.value)} min={400} max={3000} />
          </div>
          <div>
            <Label className="text-xs">Increment</Label>
            <Input type="number" step="0.5" value={stepIncrement} onChange={e => setStepIncrement(e.target.value)} />
          </div>
        </div>

        {/* Step data - mobile card layout */}
        <h4 className="text-base font-semibold pt-2">Stapgegevens</h4>
        <div className="space-y-3">
          {testData.map((row, i) => (
            <div key={i} className="border border-border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-primary">Stap {i + 1}</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeRow(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Tempo</Label>
                  <PaceInput speedKmh={row.speed} onChange={v => updateRow(i, 'speed', String(v))} className="w-full" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Lactaat</Label>
                  <Input type="number" step="0.1" className="font-mono" value={row.lactate || ''} onChange={e => updateRow(i, 'lactate', e.target.value)} placeholder="mmol/L" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hartslag</Label>
                  <Input type="number" className="font-mono" value={row.hr || ''} onChange={e => updateRow(i, 'hr', e.target.value)} placeholder="bpm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Watt</Label>
                  <Input type="number" className="font-mono" value={row.watt || ''} onChange={e => updateRow(i, 'watt', e.target.value)} placeholder="W" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={addRow} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Stap toevoegen
        </Button>
        <Button className="w-full" onClick={onCalculate}>🧮 Berekenen</Button>
      </CardContent>
    </Card>
  );
};

export default DataInputTab;
