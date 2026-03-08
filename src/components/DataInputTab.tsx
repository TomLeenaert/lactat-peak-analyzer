import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPace, type StepData } from '@/lib/lactate-math';
import PaceInput from './PaceInput';

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

// Echte testdata: 1600m stappen, tempo → snelheid (km/h)
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
    setStepDuration('5');
    setStepIncrement('0.5');
    setTestData([...TEST_DATA]);
  };

  const clearData = () => {
    setAthleteName('');
    setTestDate(new Date().toISOString().split('T')[0]);
    setRestingLactate('');
    setStepDuration('5');
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
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle>Testgegevens invoeren</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={loadExample}>📥 Voorbeeld laden</Button>
            <Button variant="secondary" size="sm" onClick={loadTestData}>🧪 Testdata 1600m</Button>
            <Button variant="destructive" size="sm" onClick={clearData}>🗑️ Wissen</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Naam atleet</Label>
            <Input value={athleteName} onChange={e => setAthleteName(e.target.value)} placeholder="Naam" />
          </div>
          <div>
            <Label>Datum test</Label>
            <Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label>Rustlactaat (mmol/L)</Label>
            <Input type="number" step="0.1" value={restingLactate} onChange={e => setRestingLactate(e.target.value)} placeholder="bv. 1.0" />
          </div>
          <div>
            <Label>Stapduur (min)</Label>
            <Input type="number" value={stepDuration} onChange={e => setStepDuration(e.target.value)} min={3} max={8} />
          </div>
          <div>
            <Label>Stap-increment</Label>
            <Input type="number" step="0.5" value={stepIncrement} onChange={e => setStepIncrement(e.target.value)} />
          </div>
        </div>

        <h4 className="text-lg font-semibold mb-4">Stapgegevens</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Stap</TableHead>
                <TableHead>Tempo (min/km)</TableHead>
                <TableHead>Lactaat (mmol/L)</TableHead>
                <TableHead>Hartslag (bpm)</TableHead>
                <TableHead>Watt (W)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono">{i + 1}</TableCell>
                  <TableCell>
                    <PaceInput speedKmh={row.speed} onChange={v => updateRow(i, 'speed', String(v))} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" step="0.1" className="w-20 font-mono text-center" value={row.lactate || ''} onChange={e => updateRow(i, 'lactate', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" className="w-20 font-mono text-center" value={row.hr || ''} onChange={e => updateRow(i, 'hr', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" className="w-20 font-mono text-center" value={row.watt || ''} onChange={e => updateRow(i, 'watt', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => removeRow(i)}>✕</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={addRow}>+ Stap toevoegen</Button>
        </div>
        <Button className="w-full mt-4" onClick={onCalculate}>🧮 Berekenen</Button>
      </CardContent>
    </Card>
  );
};

export default DataInputTab;
