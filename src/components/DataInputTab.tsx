import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPace, type StepData } from '@/lib/lactate-math';
import { Trash2, Plus, Timer, Droplets, Heart, Image as ImageIcon, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import ProtocolBar from '@/components/ProtocolBar';
import type { ProtocolSettings } from '@/lib/protocol-types';

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
  protocol?: ProtocolSettings;
  setProtocol?: (p: ProtocolSettings) => void;
}

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
  restingLactate, setRestingLactate,
  stepDistance, setStepDistance,
  setStepIncrement,
  setAthleteName, setTestDate,
  onCalculate,
  protocol, setProtocol,
}: DataInputTabProps) => {
  const dist = parseFloat(stepDistance) || 1600;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [needsValidation, setNeedsValidation] = useState(false);
  const { toast } = useToast();
  const { t } = useLang();

  // ── Update helpers ─────────────────────────────────────────────────────
  const updateRow = (idx: number, patch: Partial<StepData>) => {
    const next = [...testData];
    next[idx] = { ...next[idx], ...patch };
    setTestData(next);
  };

  const updateTime = (idx: number, min: number, sec: number) => {
    const totalSecs = (min || 0) * 60 + (sec || 0);
    const row = testData[idx];
    updateRow(idx, {
      time: totalSecs,
      speed: calcSpeed(row.distance || dist, totalSecs),
    });
  };

  const updateStepDistanceFor = (idx: number, val: string) => {
    const newDist = parseFloat(val) || 0;
    const row = testData[idx];
    updateRow(idx, {
      distance: newDist,
      speed: row.time && row.time > 0 ? calcSpeed(newDist, row.time) : row.speed,
    });
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
          toast({ title: t('common.error'), description: t('data.noStepsFound'), variant: 'destructive' });
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
          toast({ title: t('common.error'), description: t('data.noUsableSteps'), variant: 'destructive' });
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
        toast({ title: t('data.imported'), description: `${importedSteps.length} ${t('data.stepsLoaded')}` });
      } catch {
        toast({ title: t('common.error'), description: t('data.invalidJson'), variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processJsonFile(file);
    e.target.value = '';
  };

  // ── Image / screenshot import via Lovable AI (vision) ─────────────────
  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: 'Bestand te groot', description: 'Maximaal 8 MB.', variant: 'destructive' });
      return;
    }
    setParsing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { data, error } = await supabase.functions.invoke('parse-test-image', { body: { image: dataUrl } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const rawSteps: Array<Record<string, unknown>> = Array.isArray(data?.steps) ? data.steps : [];
      if (!rawSteps.length) {
        toast({ title: 'Niets herkend', description: 'Geen tredes gevonden in de afbeelding.', variant: 'destructive' });
        return;
      }

      const importedSteps: StepData[] = rawSteps.map((row) => {
        const distance = (typeof row.distance === 'number' && row.distance > 0) ? row.distance : dist;
        const time = typeof row.time_sec === 'number' && row.time_sec > 0 ? row.time_sec : 0;
        const speed = (typeof row.speed === 'number' && row.speed > 0)
          ? row.speed
          : (time > 0 ? (distance / 1000) / (time / 3600) : 0);
        return {
          speed,
          lactate: typeof row.lactate === 'number' ? row.lactate : 0,
          hr: typeof row.hr === 'number' ? row.hr : 0,
          watt: 0,
          distance,
          time,
        };
      });

      const rl = data?.resting_lactate;
      if (typeof rl === 'number' && rl > 0) setRestingLactate(String(rl));

      setTestData(importedSteps);
      setNeedsValidation(true);
      toast({
        title: 'Afbeelding ingelezen',
        description: `${importedSteps.length} tredes herkend — controleer en pas aan waar nodig.`,
      });
    } catch (err) {
      toast({
        title: 'Inlezen mislukt',
        description: (err as Error).message || 'Onbekende fout',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const addRow = () => setTestData([...testData, { speed: 0, lactate: 0, hr: 0, watt: 0, distance: dist, time: 0 }]);
  const removeRow = (i: number) => setTestData(testData.filter((_, idx) => idx !== i));

  const filledCount = testData.filter(r => r.lactate > 0).length;

  // ── Inline cell input (desktop friendly) ──────────────────────────────
  const cellStyle: React.CSSProperties = {
    height: '38px',
    fontSize: '15px',
    fontFamily: 'monospace',
    fontWeight: 700,
    textAlign: 'center',
    padding: '0 6px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    width: '100%',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '4px',
  };

  return (
    <>
      {protocol && setProtocol && (
        <ProtocolBar
          protocol={protocol}
          setProtocol={setProtocol}
          testData={testData}
          setTestData={setTestData}
          setStepDistance={setStepDistance}
          setStepIncrement={setStepIncrement}
        />
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('data.stepData')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />

          {/* Rustlactaat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              Rustlactaat
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={restingLactate}
              onChange={(e) => setRestingLactate(e.target.value)}
              placeholder="optioneel"
              style={{ width: '110px', height: '32px', fontFamily: 'monospace', fontWeight: 600 }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>mmol/L</span>
          </div>

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
                {filledCount}/{testData.length} {t('data.steps')}
              </span>
            </div>
          )}

          {/* Step cards */}
          <h4 className="text-base font-semibold pt-2">{t('data.stepData')}</h4>
          <div className="space-y-3">
            {testData.map((row, i) => {
              const hasLactate = row.lactate > 0;
              const hasHR = row.hr > 0;
              const hasTime = (row.time || 0) > 0;
              const allFilled = hasLactate && hasHR && hasTime;
              const isFinal = i === testData.length - 1 && testData.length > 1;
              const minVal = row.time ? Math.floor(row.time / 60) : 0;
              const secVal = row.time ? Math.round(row.time % 60) : 0;

              return (
                <div key={i} style={{
                  border: isFinal
                    ? '2px solid rgba(255,107,43,0.55)'
                    : allFilled ? '1px solid rgba(0,253,193,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  background: isFinal
                    ? 'rgba(255,107,43,0.06)'
                    : allFilled ? 'rgba(0,253,193,0.03)' : 'rgba(255,255,255,0.02)',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: allFilled ? 'rgba(0,253,193,0.2)' : 'rgba(255,255,255,0.06)',
                        border: allFilled ? '1px solid rgba(0,253,193,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700,
                        color: allFilled ? '#00fdc1' : 'rgba(255,255,255,0.4)',
                      }}>
                        {allFilled ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        {isFinal ? '⚡ All-out' : `${t('data.step')} ${i + 1}`}
                      </span>

                      {/* afstand */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px', padding: '2px 6px',
                      }}>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={row.distance ?? ''}
                          onChange={(e) => updateStepDistanceFor(i, e.target.value)}
                          placeholder={String(dist)}
                          style={{
                            width: '62px', height: '24px', fontSize: '12px',
                            fontFamily: 'monospace', fontWeight: 700,
                            textAlign: 'right', padding: '0 4px',
                            background: 'transparent', border: 'none',
                            color: 'rgba(255,255,255,0.85)',
                          }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>m</span>
                      </div>

                      {row.speed > 0 && (
                        <span style={{
                          fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
                          color: '#00fdc1',
                          background: 'rgba(0,253,193,0.1)',
                          border: '1px solid rgba(0,253,193,0.25)',
                          borderRadius: '8px', padding: '2px 8px',
                        }}>
                          {formatPace(row.speed)}/km · {row.speed.toFixed(1)} km/h
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => removeRow(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Inline grid: tijd | lactaat | HR */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '8px' }}>
                    {/* Tijd */}
                    <div>
                      <div style={{ ...labelStyle, color: hasTime ? '#00fdc1' : 'rgba(255,255,255,0.4)' }}>
                        <Timer size={12} /> {t('data.time')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="99"
                          value={minVal || ''}
                          onChange={(e) => updateTime(i, parseInt(e.target.value) || 0, secVal)}
                          placeholder="mm"
                          style={cellStyle}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>:</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="59"
                          value={secVal || ''}
                          onChange={(e) => updateTime(i, minVal, parseInt(e.target.value) || 0)}
                          placeholder="ss"
                          style={cellStyle}
                        />
                      </div>
                    </div>

                    {/* Lactaat */}
                    <div>
                      <div style={{ ...labelStyle, color: hasLactate ? '#6644ff' : 'rgba(255,255,255,0.4)' }}>
                        <Droplets size={12} /> {t('data.lactate')}
                      </div>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        max="25"
                        value={row.lactate || ''}
                        onChange={(e) => updateRow(i, { lactate: parseFloat(e.target.value) || 0 })}
                        placeholder="mmol/L"
                        style={cellStyle}
                      />
                    </div>

                    {/* HR */}
                    <div>
                      <div style={{ ...labelStyle, color: hasHR ? '#ff6b2b' : 'rgba(255,255,255,0.4)' }}>
                        <Heart size={12} /> HR
                      </div>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="220"
                        value={row.hr || ''}
                        onChange={(e) => updateRow(i, { hr: parseInt(e.target.value) || 0 })}
                        placeholder="bpm"
                        style={cellStyle}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="secondary" size="sm" onClick={addRow} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> {t('data.addStep')}
          </Button>
          <Button className="w-full" onClick={onCalculate} style={{ background: 'linear-gradient(135deg, #6644ff, #8866ff)', border: 'none' }}>
            {t('data.calculate')}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default DataInputTab;
