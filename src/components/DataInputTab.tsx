import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPace, type StepData } from '@/lib/lactate-math';
import { Trash2, Plus, Upload, ChevronLeft, ChevronRight, Check, Timer, Droplets, Heart } from 'lucide-react';
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
type SubField = 'time_min' | 'time_sec' | 'lactate' | 'hr';

const SUB_FIELDS: SubField[] = ['time_min', 'time_sec', 'lactate', 'hr'];

const FIELD_META: Record<SubField, { label: string; unit: string; color: string; maxValue: number; decimalPlaces: number; icon: React.ReactNode }> = {
  time_min: { label: 'Minuten', unit: 'min', color: '#00fdc1', maxValue: 59, decimalPlaces: 0, icon: <Timer size={16} /> },
  time_sec: { label: 'Seconden', unit: 'sec', color: '#00fdc1', maxValue: 59, decimalPlaces: 0, icon: <Timer size={16} /> },
  lactate:  { label: 'Lactaat', unit: 'mmol/L', color: '#6644ff', maxValue: 25, decimalPlaces: 1, icon: <Droplets size={16} /> },
  hr:       { label: 'Hartslag', unit: 'bpm', color: '#ff6b2b', maxValue: 220, decimalPlaces: 0, icon: <Heart size={16} /> },
};

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

  // Wizard state
  const [wizardActive, setWizardActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentField, setCurrentField] = useState<SubField>('time_min');
  const [numPadValue, setNumPadValue] = useState('');

  // ── Wizard helpers ─────────────────────────────────────────────────────
  const getFieldValue = useCallback((step: number, field: SubField): string => {
    const row = testData[step];
    if (!row) return '';
    if (field === 'time_min') {
      const secs = row.time || 0;
      return secs > 0 ? String(Math.floor(secs / 60)) : '';
    }
    if (field === 'time_sec') {
      const secs = row.time || 0;
      return secs > 0 ? String(Math.round(secs % 60)) : '';
    }
    if (field === 'lactate') return row.lactate > 0 ? String(row.lactate) : '';
    if (field === 'hr') return row.hr > 0 ? String(row.hr) : '';
    return '';
  }, [testData]);

  const openWizard = useCallback((step: number) => {
    setCurrentStep(step);
    setCurrentField('time_min');
    setNumPadValue(getFieldValue(step, 'time_min'));
    setWizardActive(true);
  }, [getFieldValue]);

  const saveCurrentField = useCallback(() => {
    const val = parseFloat(numPadValue) || 0;
    const newData = [...testData];
    const row = { ...newData[currentStep] };

    if (currentField === 'time_min') {
      const oldSecs = row.time || 0;
      const oldSec = Math.round(oldSecs % 60);
      const totalSecs = val * 60 + oldSec;
      row.time = totalSecs;
      row.speed = calcSpeed(row.distance || dist, totalSecs);
    } else if (currentField === 'time_sec') {
      const oldSecs = row.time || 0;
      const oldMin = Math.floor(oldSecs / 60);
      const totalSecs = oldMin * 60 + val;
      row.time = totalSecs;
      row.speed = calcSpeed(row.distance || dist, totalSecs);
    } else if (currentField === 'lactate') {
      row.lactate = val;
    } else if (currentField === 'hr') {
      row.hr = val;
    }

    newData[currentStep] = row;
    setTestData(newData);
    return newData;
  }, [numPadValue, testData, currentStep, currentField, dist, setTestData]);

  const confirmAndAdvance = useCallback(() => {
    const newData = saveCurrentField();
    const fieldIdx = SUB_FIELDS.indexOf(currentField);

    if (fieldIdx < SUB_FIELDS.length - 1) {
      // Next sub-field within same step
      const nextField = SUB_FIELDS[fieldIdx + 1];
      setCurrentField(nextField);
      // Load value for next field from updated data
      const row = newData[currentStep];
      if (nextField === 'time_sec') {
        const secs = row.time || 0;
        setNumPadValue(secs > 0 ? String(Math.round(secs % 60)) : '');
      } else if (nextField === 'lactate') {
        setNumPadValue(row.lactate > 0 ? String(row.lactate) : '');
      } else if (nextField === 'hr') {
        setNumPadValue(row.hr > 0 ? String(row.hr) : '');
      }
    } else {
      // Move to next step
      const nextStep = currentStep + 1;
      if (nextStep < testData.length) {
        setCurrentStep(nextStep);
        setCurrentField('time_min');
        const nextRow = newData[nextStep];
        const secs = nextRow.time || 0;
        setNumPadValue(secs > 0 ? String(Math.floor(secs / 60)) : '');
      } else {
        // All steps done
        setWizardActive(false);
        toast({ title: 'Alle stappen ingevuld! 🎉' });
      }
    }
  }, [saveCurrentField, currentField, currentStep, testData.length, toast]);

  const dismissWizard = useCallback(() => {
    saveCurrentField();
    setWizardActive(false);
  }, [saveCurrentField]);

  const goToPrevField = useCallback(() => {
    saveCurrentField();
    const fieldIdx = SUB_FIELDS.indexOf(currentField);
    if (fieldIdx > 0) {
      const prevField = SUB_FIELDS[fieldIdx - 1];
      setCurrentField(prevField);
      setNumPadValue(getFieldValue(currentStep, prevField));
    } else if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setCurrentField('hr');
      setNumPadValue(getFieldValue(prevStep, 'hr'));
    }
  }, [saveCurrentField, currentField, currentStep, getFieldValue]);

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

  const addRow = () => {
    setTestData([...testData, { speed: 0, lactate: 0, hr: 0, watt: 0, distance: dist, time: 0 }]);
  };

  const removeRow = (i: number) => {
    setTestData(testData.filter((_, idx) => idx !== i));
  };

  // ── Helpers ────────────────────────────────────────────────────────────
  const filledCount = testData.filter(r => r.lactate > 0).length;
  const totalCount = testData.length;

  const secsToDisplay = (secs: number): string => {
    if (!secs || secs <= 0) return '—';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Current position in overall flow
  const canGoPrev = currentStep > 0 || SUB_FIELDS.indexOf(currentField) > 0;
  const isLastField = currentStep === testData.length - 1 && currentField === 'hr';

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

          {/* Step overview cards */}
          <h4 className="text-base font-semibold pt-2">Stapgegevens</h4>
          <div className="space-y-2">
            {testData.map((row, i) => {
              const hasLactate = row.lactate > 0;
              const hasHR = row.hr > 0;
              const hasTime = (row.time || 0) > 0;
              const rowDist = row.distance || dist;

              return (
                <div
                  key={i}
                  onClick={() => openWizard(i)}
                  style={{
                    border: hasLactate ? '1px solid rgba(102,68,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    background: hasLactate ? 'rgba(102,68,255,0.05)' : 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.2s',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Step number */}
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: hasLactate ? 'rgba(102,68,255,0.25)' : 'rgba(255,255,255,0.06)',
                        border: hasLactate ? '1px solid rgba(102,68,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700,
                        color: hasLactate ? '#a090ff' : 'rgba(255,255,255,0.4)',
                        flexShrink: 0,
                      }}>
                        {hasLactate ? '✓' : i + 1}
                      </div>

                      {/* Data summary */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {row.speed > 0 ? (
                            <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>
                              {formatPace(row.speed)} /km
                            </span>
                          ) : (
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Stap {i + 1} · {rowDist}m</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                          {hasTime && (
                            <span style={{ color: '#00fdc1', fontWeight: 600, fontFamily: 'monospace' }}>
                              ⏱ {secsToDisplay(row.time || 0)}
                            </span>
                          )}
                          {hasLactate && (
                            <span style={{ color: '#a090ff', fontWeight: 600, fontFamily: 'monospace' }}>
                              🩸 {row.lactate}
                            </span>
                          )}
                          {hasHR && (
                            <span style={{ color: '#ff6b2b', fontWeight: 600, fontFamily: 'monospace' }}>
                              💓 {row.hr}
                            </span>
                          )}
                          {!hasTime && !hasLactate && !hasHR && (
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Tik om in te vullen</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0"
                      onClick={(e) => { e.stopPropagation(); removeRow(i); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

      {/* ── Wizard NumPad overlay ──────────────────────────────────────────── */}
      {wizardActive && (
        <>
          {/* Backdrop */}
          <div
            onClick={dismissWizard}
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
            padding: '16px 20px 40px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{
              width: '40px', height: '4px', borderRadius: '2px',
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 16px',
            }} />

            {/* Step + field indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <button
                onClick={goToPrevField}
                disabled={!canGoPrev}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: !canGoPrev ? 'rgba(255,255,255,0.2)' : '#fff',
                  cursor: !canGoPrev ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                  Stap {currentStep + 1}
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}> / {testData.length}</span>
                </span>
                {testData[currentStep]?.speed > 0 && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {formatPace(testData[currentStep].speed)} /km
                  </div>
                )}
              </div>

              <button
                onClick={confirmAndAdvance}
                disabled={isLastField}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: isLastField ? 'rgba(255,255,255,0.2)' : '#fff',
                  cursor: isLastField ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Sub-field progress dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '16px',
            }}>
              {SUB_FIELDS.map((f) => {
                const isActive = f === currentField;
                const meta = FIELD_META[f];
                return (
                  <button
                    key={f}
                    onClick={() => {
                      saveCurrentField();
                      setCurrentField(f);
                      setNumPadValue(getFieldValue(currentStep, f));
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? `${meta.color}20` : 'rgba(255,255,255,0.03)',
                      border: isActive ? `1.5px solid ${meta.color}60` : '1px solid rgba(255,255,255,0.06)',
                      color: isActive ? meta.color : 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <NumPad
              value={numPadValue}
              onChange={setNumPadValue}
              label={FIELD_META[currentField].label}
              unit={FIELD_META[currentField].unit}
              color={FIELD_META[currentField].color}
              maxValue={FIELD_META[currentField].maxValue}
              decimalPlaces={FIELD_META[currentField].decimalPlaces}
            />

            {/* Confirm button */}
            <button
              onClick={confirmAndAdvance}
              style={{
                marginTop: '12px',
                width: '100%',
                height: '60px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${FIELD_META[currentField].color}, ${FIELD_META[currentField].color}cc)`,
                border: 'none',
                color: currentField === 'time_min' || currentField === 'time_sec' ? '#000' : '#fff',
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
              {isLastField
                ? 'Afronden'
                : currentField === 'hr'
                  ? `Volgende stap →`
                  : 'Volgende →'}
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default DataInputTab;
