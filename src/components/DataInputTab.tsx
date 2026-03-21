import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPace, type StepData } from '@/lib/lactate-math';
import { Trash2, Plus, Upload, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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

type ImportRow = Record<string, unknown>;
type EntryField = 'lactate' | 'hr';

interface ActiveEntry {
  row: number;
  field: EntryField;
}

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

const secsToTimeStr = (secs: number): string => {
  if (!secs || secs <= 0) return '';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const timeStrToSecs = (str: string): number => {
  const parts = str.replace(',', ':').replace('.', ':').split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0]) || 0;
    const s = parseInt(parts[1]) || 0;
    return m * 60 + s;
  }
  if (parts.length === 1) {
    const val = parseInt(parts[0]) || 0;
    if (val > 100) return Math.floor(val / 100) * 60 + (val % 100);
    return val * 60;
  }
  return 0;
};

const calcSpeed = (distanceM: number, timeSec: number): number => {
  if (!distanceM || !timeSec || timeSec <= 0) return 0;
  return (distanceM / 1000) / (timeSec / 3600);
};

const FIELD_CONFIG: Record<EntryField, { label: string; unit: string; color: string; maxValue: number; decimalPlaces: number }> = {
  lactate: { label: 'Lactaat', unit: 'mmol/L', color: '#6644ff', maxValue: 25, decimalPlaces: 1 },
  hr:      { label: 'Hartslag', unit: 'bpm',    color: '#ff6b2b', maxValue: 220, decimalPlaces: 0 },
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
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null);
  const [numPadValue, setNumPadValue] = useState('');

  // ── NumPad helpers ───────────────────────────────────────────────────────
  const openNumPad = (row: number, field: EntryField) => {
    const current = field === 'lactate'
      ? (testData[row].lactate ? String(testData[row].lactate) : '')
      : (testData[row].hr ? String(testData[row].hr) : '');
    setNumPadValue(current);
    setActiveEntry({ row, field });
  };

  const confirmNumPad = () => {
    if (!activeEntry) return;
    const val = parseFloat(numPadValue) || 0;
    const newData = [...testData];
    newData[activeEntry.row] = { ...newData[activeEntry.row], [activeEntry.field]: val };
    setTestData(newData);

    // auto-advance: lactate → hr → next step lactate
    const { row, field } = activeEntry;
    if (field === 'lactate') {
      setNumPadValue(newData[row].hr ? String(newData[row].hr) : '');
      setActiveEntry({ row, field: 'hr' });
    } else {
      // try next step
      const nextRow = row + 1;
      if (nextRow < testData.length) {
        setNumPadValue(newData[nextRow].lactate ? String(newData[nextRow].lactate) : '');
        setActiveEntry({ row: nextRow, field: 'lactate' });
      } else {
        setActiveEntry(null);
      }
    }
  };

  const dismissNumPad = () => {
    if (!activeEntry) return;
    // save current value before dismissing
    const val = parseFloat(numPadValue) || 0;
    if (val > 0) {
      const newData = [...testData];
      newData[activeEntry.row] = { ...newData[activeEntry.row], [activeEntry.field]: val };
      setTestData(newData);
    }
    setActiveEntry(null);
  };

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
          return {
            speed,
            lactate: getNumber(row, 'lactate', 'lactaat'),
            hr: getNumber(row, 'hr', 'hartslag', 'heartrate'),
            watt: getNumber(row, 'watt', 'watts', 'power'),
            distance,
            time,
          };
        });
        if (importedSteps.length === 0) {
          toast({ title: 'Fout', description: 'Geen bruikbare stappen gevonden in JSON bestand.', variant: 'destructive' });
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
        toast({ title: 'Geïmporteerd', description: `${importedSteps.length} stappen geladen uit JSON.` });
      } catch {
        toast({ title: 'Fout', description: 'Ongeldig JSON bestand.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) {
      processJsonFile(file);
    } else {
      toast({ title: 'Fout', description: 'Alleen JSON bestanden worden ondersteund.', variant: 'destructive' });
    }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processJsonFile(file);
    e.target.value = '';
  };

  const clearData = () => {
    setAthleteName('');
    setTestDate(new Date().toISOString().split('T')[0]);
    setRestingLactate('');
    setStepDistance('1600');
    setStepIncrement('1');
    setTestData(Array.from({ length: 6 }, () => ({ speed: 0, lactate: 0, hr: 0, watt: 0, distance: 1600, time: 0 })));
  };

  const updateRowTime = (i: number, timeStr: string) => {
    const newData = [...testData];
    const secs = timeStrToSecs(timeStr);
    const rowDist = newData[i].distance || dist;
    newData[i] = { ...newData[i], time: secs, speed: calcSpeed(rowDist, secs) };
    setTestData(newData);
  };

  const updateRow = (i: number, field: keyof StepData, val: string) => {
    const newData = [...testData];
    newData[i] = { ...newData[i], [field]: parseFloat(val) || 0 };
    setTestData(newData);
  };

  const addRow = () => {
    setTestData([...testData, { speed: 0, lactate: 0, hr: 0, watt: 0, distance: dist, time: 0 }]);
  };

  const removeRow = (i: number) => {
    setTestData(testData.filter((_, idx) => idx !== i));
  };

  // ── Completion count ─────────────────────────────────────────────────────
  const filledCount = testData.filter(r => r.lactate > 0).length;
  const totalCount = testData.length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-lg">Testgegevens invoeren</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1" /> JSON
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />
              <Button variant="destructive" size="sm" onClick={clearData}>🗑️ Wissen</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone — desktop only */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`hidden sm:flex border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors flex-col items-center justify-center ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'}`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Sleep een JSON bestand hierheen of klik om te uploaden
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">.json</p>
          </div>

          {/* Meta fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Naam atleet</Label>
              <Input className="h-11" value={athleteName} onChange={e => setAthleteName(e.target.value)} placeholder="Naam" />
            </div>
            <div>
              <Label className="text-xs">Datum</Label>
              <Input className="h-11" type="date" value={testDate} onChange={e => setTestDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Rustlactaat</Label>
              <Input className="h-11" type="number" step="0.1" value={restingLactate} onChange={e => setRestingLactate(e.target.value)} placeholder="1.0" />
            </div>
            <div>
              <Label className="text-xs">Afstand (m)</Label>
              <Input className="h-11" type="number" step="100" value={stepDistance} onChange={e => setStepDistance(e.target.value)} min={400} max={3000} />
            </div>
            <div>
              <Label className="text-xs">Increment</Label>
              <Input className="h-11" type="number" step="0.5" value={stepIncrement} onChange={e => setStepIncrement(e.target.value)} />
            </div>
          </div>

          {/* Progress indicator */}
          {filledCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(102,68,255,0.08)',
              border: '1px solid rgba(102,68,255,0.2)',
              borderRadius: '10px',
            }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                <div style={{
                  height: '100%',
                  width: `${(filledCount / totalCount) * 100}%`,
                  background: '#6644ff',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#a090ff', whiteSpace: 'nowrap' }}>
                {filledCount}/{totalCount} stappen
              </span>
            </div>
          )}

          {/* Step cards */}
          <h4 className="text-base font-semibold pt-2">Stapgegevens</h4>
          <div className="space-y-2">
            {testData.map((row, i) => {
              const rowDist = row.distance || dist;
              const hasLactate = row.lactate > 0;
              const hasHR = row.hr > 0;

              return (
                <div
                  key={i}
                  style={{
                    border: hasLactate ? '1px solid rgba(102,68,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px',
                    padding: '12px',
                    background: hasLactate ? 'rgba(102,68,255,0.05)' : 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: hasLactate ? 'rgba(102,68,255,0.25)' : 'rgba(255,255,255,0.06)',
                        border: hasLactate ? '1px solid rgba(102,68,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700,
                        color: hasLactate ? '#a090ff' : 'rgba(255,255,255,0.4)',
                        flexShrink: 0,
                      }}>
                        {hasLactate ? '✓' : i + 1}
                      </div>
                      {row.speed > 0 ? (
                        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: '#fff' }}>
                          {formatPace(row.speed)} /km
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>{rowDist}m</span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeRow(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Tijd (text input — mm:ss) */}
                  <div style={{ marginBottom: '8px' }}>
                    <Label className="text-xs text-muted-foreground">⏱ Tijd (mm:ss)</Label>
                    <Input
                      className="font-mono text-base h-11"
                      value={secsToTimeStr(row.time || 0)}
                      onChange={e => updateRowTime(i, e.target.value)}
                      placeholder="5:30"
                      inputMode="numeric"
                    />
                  </div>

                  {/* Lactaat + HR — tap to open NumPad on mobile */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Lactaat button */}
                    <button
                      onClick={() => openNumPad(i, 'lactate')}
                      style={{
                        height: '64px',
                        borderRadius: '12px',
                        border: hasLactate ? '1px solid rgba(102,68,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        background: hasLactate ? 'rgba(102,68,255,0.1)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#6644ff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        🩸 Lactaat
                      </span>
                      <span style={{
                        fontSize: hasLactate ? '22px' : '15px',
                        fontWeight: 800,
                        color: hasLactate ? '#fff' : 'rgba(255,255,255,0.2)',
                        fontFamily: 'monospace',
                      }}>
                        {hasLactate ? `${row.lactate}` : 'tikken'}
                      </span>
                      {hasLactate && (
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>mmol/L</span>
                      )}
                    </button>

                    {/* HR button */}
                    <button
                      onClick={() => openNumPad(i, 'hr')}
                      style={{
                        height: '64px',
                        borderRadius: '12px',
                        border: hasHR ? '1px solid rgba(255,107,43,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        background: hasHR ? 'rgba(255,107,43,0.08)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#ff6b2b', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        💓 Hartslag
                      </span>
                      <span style={{
                        fontSize: hasHR ? '22px' : '15px',
                        fontWeight: 800,
                        color: hasHR ? '#fff' : 'rgba(255,255,255,0.2)',
                        fontFamily: 'monospace',
                      }}>
                        {hasHR ? `${row.hr}` : 'tikken'}
                      </span>
                      {hasHR && (
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>bpm</span>
                      )}
                    </button>
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

      {/* NumPad bottom sheet overlay */}
      {activeEntry && (
        <>
          {/* Backdrop */}
          <div
            onClick={dismissNumPad}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 100,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 101,
            background: '#0e0f15',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px 24px 0 0',
            padding: '20px 20px 40px',
          }}>
            {/* Handle */}
            <div style={{
              width: '40px', height: '4px', borderRadius: '2px',
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 20px',
            }} />

            {/* Step indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <button
                onClick={() => {
                  if (activeEntry.row > 0) {
                    setNumPadValue(activeEntry.field === 'lactate'
                      ? (testData[activeEntry.row - 1].lactate ? String(testData[activeEntry.row - 1].lactate) : '')
                      : (testData[activeEntry.row - 1].hr ? String(testData[activeEntry.row - 1].hr) : ''));
                    setActiveEntry({ row: activeEntry.row - 1, field: activeEntry.field });
                  }
                }}
                disabled={activeEntry.row === 0}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: activeEntry.row === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                  cursor: activeEntry.row === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                Stap {activeEntry.row + 1} van {testData.length}
                {testData[activeEntry.row].speed > 0 && (
                  <span style={{ marginLeft: '8px', color: 'rgba(255,255,255,0.3)' }}>
                    · {formatPace(testData[activeEntry.row].speed)} /km
                  </span>
                )}
              </span>

              <button
                onClick={() => {
                  if (activeEntry.row < testData.length - 1) {
                    setNumPadValue(activeEntry.field === 'lactate'
                      ? (testData[activeEntry.row + 1].lactate ? String(testData[activeEntry.row + 1].lactate) : '')
                      : (testData[activeEntry.row + 1].hr ? String(testData[activeEntry.row + 1].hr) : ''));
                    setActiveEntry({ row: activeEntry.row + 1, field: activeEntry.field });
                  }
                }}
                disabled={activeEntry.row === testData.length - 1}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: activeEntry.row === testData.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                  cursor: activeEntry.row === testData.length - 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <NumPad
              value={numPadValue}
              onChange={setNumPadValue}
              label={FIELD_CONFIG[activeEntry.field].label}
              unit={FIELD_CONFIG[activeEntry.field].unit}
              color={FIELD_CONFIG[activeEntry.field].color}
              maxValue={FIELD_CONFIG[activeEntry.field].maxValue}
              decimalPlaces={FIELD_CONFIG[activeEntry.field].decimalPlaces}
            />

            {/* Confirm button */}
            <button
              onClick={confirmNumPad}
              style={{
                marginTop: '12px',
                width: '100%',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6644ff, #8866ff)',
                border: 'none',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Check size={20} />
              {activeEntry.row < testData.length - 1 ? 'Opslaan & volgende' : 'Opslaan'}
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default DataInputTab;
