import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPace, type StepData } from '@/lib/lactate-math';
import { Trash2, Plus, Upload, Check, Timer, Droplets, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NumPad from '@/components/NumPad';

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

type EditingField = 'time' | 'lactate' | 'hr';
type TimeSubField = 'min' | 'sec';

type ImportRow = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getNumber = (row: ImportRow, ...keys: string[]): number => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number') return value;
  }
  return 0;
};

const getString = (row: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
};

const findFirstArray = (row: Record<string, unknown>): unknown[] => {
  for (const value of Object.values(row)) {
    if (Array.isArray(value)) return value;
  }
  return [];
};

const calcSpeed = (distanceM: number, timeSec: number): number => {
  if (!distanceM || !timeSec || timeSec <= 0) return 0;
  return (distanceM / 1000) / (timeSec / 3600);
};

const secsToDisplay = (secs: number): string => {
  if (!secs || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const DataInputTab = ({
  testData, setTestData,
  athleteName, setAthleteName,
  testDate, setTestDate,
  restingLactate, setRestingLactate,
  stepDistance, setStepDistance,
  stepIncrement, setStepIncrement,
  onCalculate,
}: DataInputTabProps) => {
  const dist = parseFloat(stepDistance) || 1600;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  // Sheet state: which step & which field are we editing?
  const [editStep, setEditStep] = useState<number | null>(null);
  const [editField, setEditField] = useState<EditingField | null>(null);

  // For time editing: two values (min + sec)
  const [timeMin, setTimeMin] = useState('');
  const [timeSec, setTimeSec] = useState('');
  const [timeSubField, setTimeSubField] = useState<TimeSubField>('min');

  // For single-value fields
  const [numPadValue, setNumPadValue] = useState('');

  // ── Open field editor ──────────────────────────────────────────────────
  const openField = useCallback((stepIdx: number, field: EditingField) => {
    const row = testData[stepIdx];
    setEditStep(stepIdx);
    setEditField(field);

    if (field === 'time') {
      const secs = row.time || 0;
      setTimeMin(secs > 0 ? String(Math.floor(secs / 60)) : '');
      setTimeSec(secs > 0 ? String(Math.round(secs % 60)) : '');
      setTimeSubField('min');
    } else if (field === 'lactate') {
      setNumPadValue(row.lactate > 0 ? String(row.lactate) : '');
    } else if (field === 'hr') {
      setNumPadValue(row.hr > 0 ? String(row.hr) : '');
    }
  }, [testData]);

  // ── Confirm & close ────────────────────────────────────────────────────
  const confirmField = useCallback(() => {
    if (editStep === null || !editField) return;
    const newData = [...testData];
    const row = { ...newData[editStep] };

    if (editField === 'time') {
      const totalSecs = (parseInt(timeMin) || 0) * 60 + (parseInt(timeSec) || 0);
      row.time = totalSecs;
      row.speed = calcSpeed(row.distance || dist, totalSecs);
    } else if (editField === 'lactate') {
      row.lactate = parseFloat(numPadValue) || 0;
    } else if (editField === 'hr') {
      row.hr = parseInt(numPadValue) || 0;
    }

    newData[editStep] = row;
    setTestData(newData);
    setEditStep(null);
    setEditField(null);
  }, [editStep, editField, timeMin, timeSec, numPadValue, testData, dist, setTestData]);

  const dismiss = useCallback(() => {
    setEditStep(null);
    setEditField(null);
  }, []);

  // ── JSON import ──────────────────────────────────────────────────────────
  const processJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsedJson: unknown = JSON.parse(ev.target?.result as string);
        const json = isRecord(parsedJson) ? parsedJson : {};
        const rawSteps = Array.isArray(parsedJson)
          ? parsedJson
          : (json.steps || json.data || json.stappen || json.testen || json.results || json.resultaten || json.inspanningstesten || json.rows || json.metingen ||
             findFirstArray(json));
        const steps = Array.isArray(rawSteps) ? rawSteps : [];
        if (!steps.length) {
          toast({ title: 'Fout', description: 'Geen stappen gevonden in JSON bestand.', variant: 'destructive' });
          return;
        }
        const normalizedRows = steps.filter(isRecord);
        const importedSteps: StepData[] = normalizedRows.map((row) => {
          const distance = getNumber(row, 'distance', 'afstand') || dist;
          const time = getNumber(row, 'time', 'tijd');
          const speed = getNumber(row, 'speed', 'snelheid') || (time > 0 ? (distance / 1000) / (time / 3600) : 0);
          return { speed, lactate: getNumber(row, 'lactate', 'lactaat'), hr: getNumber(row, 'hr', 'hartslag', 'heartrate'), watt: getNumber(row, 'watt', 'watts', 'power'), distance, time };
        });
        if (importedSteps.length === 0) {
          toast({ title: 'Fout', description: 'Geen bruikbare stappen gevonden.', variant: 'destructive' });
          return;
        }
        const athlete = getString(json, 'athlete', 'atleet');
        const date = getString(json, 'date', 'datum');
        const resting = getString(json, 'restingLactate', 'rustlactaat') || String(getNumber(json, 'restingLactate', 'rustlactaat') || '');
        const distance = getString(json, 'stepDistance', 'afstand') || String(getNumber(json, 'stepDistance', 'afstand') || '');
        if (athlete) setAthleteName(athlete);
        if (date) setTestDate(date);
        if (resting) setRestingLactate(resting);
        if (distance) setStepDistance(distance);
        setTestData(importedSteps);
        toast({ title: 'Geïmporteerd', description: `${importedSteps.length} stappen geladen.` });
      } catch {
        toast({ title: 'Fout', description: 'Ongeldig JSON bestand.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) processJsonFile(file);
    else toast({ title: 'Fout', description: 'Alleen JSON bestanden.', variant: 'destructive' });
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processJsonFile(file);
    e.target.value = '';
  };

  const clearData = () => {
    setAthleteName(''); setTestDate(new Date().toISOString().split('T')[0]);
    setRestingLactate(''); setStepDistance('1600'); setStepIncrement('1');
    setTestData(Array.from({ length: 6 }, () => ({ speed: 0, lactate: 0, hr: 0, watt: 0, distance: 1600, time: 0 })));
  };

  const addRow = () => setTestData([...testData, { speed: 0, lactate: 0, hr: 0, watt: 0, distance: dist, time: 0 }]);
  const removeRow = (i: number) => setTestData(testData.filter((_, idx) => idx !== i));

  const filledCount = testData.filter(r => r.lactate > 0).length;

  // ── Field button component ─────────────────────────────────────────────
  const FieldButton = ({ stepIdx, field, icon, label, value, color, filled }: {
    stepIdx: number; field: EditingField; icon: React.ReactNode; label: string; value: string; color: string; filled: boolean;
  }) => (
    <button
      onClick={(e) => { e.stopPropagation(); openField(stepIdx, field); }}
      style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        padding: '10px 6px',
        borderRadius: '12px',
        background: filled ? `${color}12` : 'rgba(255,255,255,0.02)',
        border: filled ? `1.5px solid ${color}40` : '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ color: filled ? color : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {icon}
        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <span style={{
        fontSize: '16px', fontWeight: 700, fontFamily: 'monospace',
        color: filled ? '#fff' : 'rgba(255,255,255,0.15)',
      }}>
        {filled ? value : '—'}
      </span>
    </button>
  );

  // ── Sheet content by field type ────────────────────────────────────────
  const renderSheetContent = () => {
    if (editStep === null || !editField) return null;

    if (editField === 'time') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Toggle min/sec */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {(['min', 'sec'] as TimeSubField[]).map(sf => (
              <button
                key={sf}
                onClick={() => setTimeSubField(sf)}
                style={{
                  padding: '8px 24px', borderRadius: '999px', fontSize: '13px', fontWeight: 700,
                  background: timeSubField === sf ? '#00fdc120' : 'rgba(255,255,255,0.03)',
                  border: timeSubField === sf ? '1.5px solid #00fdc160' : '1px solid rgba(255,255,255,0.06)',
                  color: timeSubField === sf ? '#00fdc1' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {sf === 'min' ? 'MIN' : 'SEC'}
              </button>
            ))}
          </div>

          {/* Show both values above numpad */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px',
            padding: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.5)',
          }}>
            <span style={{ color: timeSubField === 'min' ? '#00fdc1' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '18px', fontFamily: 'monospace' }}>
              {timeMin || '0'}
            </span>
            <span>min</span>
            <span style={{ color: timeSubField === 'sec' ? '#00fdc1' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '18px', fontFamily: 'monospace' }}>
              {timeSec || '0'}
            </span>
            <span>sec</span>
          </div>

          <NumPad
            value={timeSubField === 'min' ? timeMin : timeSec}
            onChange={timeSubField === 'min' ? setTimeMin : setTimeSec}
            label={timeSubField === 'min' ? 'Minuten' : 'Seconden'}
            unit={timeSubField === 'min' ? 'min' : 'sec'}
            color="#00fdc1"
            maxValue={59}
            decimalPlaces={0}
          />
        </div>
      );
    }

    if (editField === 'lactate') {
      return (
        <NumPad value={numPadValue} onChange={setNumPadValue} label="Lactaat" unit="mmol/L" color="#6644ff" maxValue={25} decimalPlaces={1} />
      );
    }

    if (editField === 'hr') {
      return (
        <NumPad value={numPadValue} onChange={setNumPadValue} label="Hartslag" unit="bpm" color="#ff6b2b" maxValue={220} decimalPlaces={0} />
      );
    }

    return null;
  };

  const fieldColor = editField === 'time' ? '#00fdc1' : editField === 'lactate' ? '#6644ff' : '#ff6b2b';
  const fieldTextDark = editField === 'time';

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Stapgegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />

          {/* Progress */}
          {filledCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', background: 'rgba(102,68,255,0.08)',
              border: '1px solid rgba(102,68,255,0.2)', borderRadius: '10px',
            }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${(filledCount / testData.length) * 100}%`, background: '#6644ff', borderRadius: '2px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#a090ff', whiteSpace: 'nowrap' }}>
                {filledCount}/{testData.length} stappen
              </span>
            </div>
          )}

          {/* Step cards */}
          <h4 className="text-base font-semibold pt-2">Stapgegevens</h4>
          <div className="space-y-3">
            {testData.map((row, i) => {
              const hasLactate = row.lactate > 0;
              const hasHR = row.hr > 0;
              const hasTime = (row.time || 0) > 0;
              const allFilled = hasLactate && hasHR && hasTime;

              return (
                <div key={i} style={{
                  border: allFilled ? '1px solid rgba(0,253,193,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  background: allFilled ? 'rgba(0,253,193,0.03)' : 'rgba(255,255,255,0.02)',
                }}>
                  {/* Step header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: allFilled ? 'rgba(0,253,193,0.2)' : 'rgba(255,255,255,0.06)',
                        border: allFilled ? '1px solid rgba(0,253,193,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700,
                        color: allFilled ? '#00fdc1' : 'rgba(255,255,255,0.4)',
                      }}>
                        {allFilled ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        Stap {i + 1}
                      </span>
                      {row.speed > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '13px', fontWeight: 700, fontFamily: 'monospace',
                            color: '#00fdc1',
                            background: 'rgba(0,253,193,0.1)',
                            border: '1px solid rgba(0,253,193,0.25)',
                            borderRadius: '8px', padding: '2px 8px',
                          }}>
                            {formatPace(row.speed)}/km
                          </span>
                          <span style={{
                            fontSize: '12px', fontWeight: 500, fontFamily: 'monospace',
                            color: 'rgba(255,255,255,0.4)',
                          }}>
                            {secsToDisplay(row.time || 0)} /{(row.distance || dist) >= 1000 ? `${((row.distance || dist) / 1000).toFixed(1)}km` : `${row.distance || dist}m`}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => removeRow(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* 3 field buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <FieldButton
                      stepIdx={i} field="time"
                      icon={<Timer size={14} />} label="Tijd"
                      value={secsToDisplay(row.time || 0)}
                      color="#00fdc1" filled={hasTime}
                    />
                    <FieldButton
                      stepIdx={i} field="lactate"
                      icon={<Droplets size={14} />} label="Lactaat"
                      value={String(row.lactate)}
                      color="#6644ff" filled={hasLactate}
                    />
                    <FieldButton
                      stepIdx={i} field="hr"
                      icon={<Heart size={14} />} label="HR"
                      value={String(row.hr)}
                      color="#ff6b2b" filled={hasHR}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="secondary" size="sm" onClick={addRow} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Stap toevoegen
          </Button>
          <Button className="w-full" onClick={onCalculate} style={{ background: 'linear-gradient(135deg, #6644ff, #8866ff)', border: 'none' }}>
            🧮 Berekenen
          </Button>
        </CardContent>
      </Card>

      {/* ── Field editor sheet ──────────────────────────────────────────────── */}
      {editStep !== null && editField && (
        <>
          <div onClick={dismiss} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
            background: '#0e0f15', borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px 24px 0 0', padding: '16px 20px 40px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />

            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                Stap {editStep + 1}
                <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}> / {testData.length}</span>
              </span>
            </div>

            {renderSheetContent()}

            <button
              onClick={confirmField}
              style={{
                marginTop: '12px', width: '100%', height: '60px', borderRadius: '16px',
                background: `linear-gradient(135deg, ${fieldColor}, ${fieldColor}cc)`,
                border: 'none', color: fieldTextDark ? '#000' : '#fff',
                fontSize: '17px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Check size={20} />
              Bevestigen
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default DataInputTab;
