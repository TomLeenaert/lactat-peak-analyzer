import { useRef, useState, useMemo } from 'react';
import {
  Trash2, Plus, Image as ImageIcon, AlertTriangle, Check, Loader2,
  Zap, Settings2, FileJson, Keyboard, X, ArrowUp, Paperclip, MessageSquarePlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { calculate, formatPace, polyEval, type StepData } from '@/lib/lactate-math';
import LactateChart from '@/components/LactateChart';
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

// ── small helpers ────────────────────────────────────────────
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const getNumber = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) { const v = row[k]; if (typeof v === 'number') return v; }
  return 0;
};
const getString = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) { const v = row[k]; if (typeof v === 'string' && v) return v; }
  return undefined;
};
const findFirstArray = (row: Record<string, unknown>): unknown[] => {
  for (const v of Object.values(row)) if (Array.isArray(v)) return v;
  return [];
};
const calcSpeed = (dM: number, tS: number) => (!dM || !tS || tS <= 0 ? 0 : (dM / 1000) / (tS / 3600));

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
  const tableRef = useRef<HTMLTableElement>(null);
  const [parsing, setParsing] = useState(false);
  const [needsValidation, setNeedsValidation] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [pastedFileName, setPastedFileName] = useState<string | null>(null);
  const [protocolOpen, setProtocolOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLang();

  // ── live preview calculation ──────────────────────────────
  const livePreview = useMemo(() => {
    const filled = testData.filter(r => r.lactate > 0 && r.speed > 0);
    if (filled.length < 3) return null;
    const result = calculate(filled, parseFloat(restingLactate) || 0);
    return typeof result === 'string' ? null : result;
  }, [testData, restingLactate]);

  // ── row helpers ───────────────────────────────────────────
  const updateRow = (idx: number, patch: Partial<StepData>) => {
    const next = [...testData];
    next[idx] = { ...next[idx], ...patch };
    setTestData(next);
  };
  const updateTime = (idx: number, min: number, sec: number) => {
    const totalSecs = (min || 0) * 60 + (sec || 0);
    const row = testData[idx];
    updateRow(idx, { time: totalSecs, speed: calcSpeed(row.distance || dist, totalSecs) });
  };
  const updateStepDistanceFor = (idx: number, val: string) => {
    const newDist = parseFloat(val) || 0;
    const row = testData[idx];
    updateRow(idx, { distance: newDist, speed: row.time && row.time > 0 ? calcSpeed(newDist, row.time) : row.speed });
  };
  const addRow = () => setTestData([...testData, { speed: 0, lactate: 0, hr: 0, watt: 0, distance: dist, time: 0 }]);
  const removeRow = (i: number) => setTestData(testData.filter((_, idx) => idx !== i));

  // ── JSON ─────────────────────────────────────────────────
  const processJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsedJson: unknown = JSON.parse(ev.target?.result as string);
        const json = isRecord(parsedJson) ? parsedJson : {};
        const rawSteps = Array.isArray(parsedJson)
          ? parsedJson
          : (json.steps || json.data || json.stappen || json.testen || json.results || json.resultaten || json.inspanningstesten || json.rows || json.metingen || findFirstArray(json));
        const steps = Array.isArray(rawSteps) ? rawSteps : [];
        if (!steps.length) { toast({ title: t('common.error'), description: t('data.noStepsFound'), variant: 'destructive' }); return; }
        const rows = steps.filter(isRecord);
        const imported: StepData[] = rows.map((row) => {
          const distance = getNumber(row, 'distance', 'afstand') || dist;
          const time = getNumber(row, 'time', 'tijd');
          const speed = getNumber(row, 'speed', 'snelheid') || (time > 0 ? (distance / 1000) / (time / 3600) : 0);
          return { speed, lactate: getNumber(row, 'lactate', 'lactaat'), hr: getNumber(row, 'hr', 'hartslag', 'heartrate'), watt: getNumber(row, 'watt', 'watts', 'power'), distance, time };
        });
        if (!imported.length) { toast({ title: t('common.error'), description: t('data.noUsableSteps'), variant: 'destructive' }); return; }
        const athlete = getString(json, 'athlete', 'atleet');
        const date = getString(json, 'date', 'datum');
        const resting = getString(json, 'restingLactate', 'rustlactaat') || String(getNumber(json, 'restingLactate', 'rustlactaat') || '');
        const distance = getString(json, 'stepDistance', 'afstand') || String(getNumber(json, 'stepDistance', 'afstand') || '');
        if (athlete) setAthleteName(athlete);
        if (date) setTestDate(date);
        if (resting) setRestingLactate(resting);
        if (distance) setStepDistance(distance);
        setTestData(imported);
        toast({ title: t('data.imported'), description: `${imported.length} ${t('data.stepsLoaded')}` });
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

  // ── Image ────────────────────────────────────────────────
  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  const mapAiSteps = (data: any): StepData[] => {
    const rawSteps: Array<Record<string, unknown>> = Array.isArray(data?.steps) ? data.steps : [];
    return rawSteps.map((row) => {
      const distance = (typeof row.distance === 'number' && row.distance > 0) ? row.distance : dist;
      const time = typeof row.time_sec === 'number' && row.time_sec > 0 ? row.time_sec : 0;
      const speed = (typeof row.speed === 'number' && row.speed > 0) ? row.speed : (time > 0 ? (distance / 1000) / (time / 3600) : 0);
      return { speed, lactate: typeof row.lactate === 'number' ? row.lactate : 0, hr: typeof row.hr === 'number' ? row.hr : 0, watt: 0, distance, time };
    });
  };
  const parseImageFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) { toast({ title: 'Bestand te groot', description: 'Maximaal 8 MB.', variant: 'destructive' }); return; }
    setParsing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { data, error } = await supabase.functions.invoke('parse-test-image', { body: { image: dataUrl } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const imported = mapAiSteps(data);
      if (!imported.length) { toast({ title: 'Niets herkend', description: 'Geen tredes gevonden in de afbeelding.', variant: 'destructive' }); return; }
      const rl = data?.resting_lactate;
      if (typeof rl === 'number' && rl > 0) setRestingLactate(String(rl));
      setTestData(imported);
      setNeedsValidation(true);
      setPastedImage(null); setPastedFileName(null); setPasteText(''); setShowPaste(false);
      toast({ title: 'Afbeelding ingelezen', description: `${imported.length} tredes herkend — controleer en pas aan waar nodig.` });
    } catch (err) {
      toast({ title: 'Inlezen mislukt', description: (err as Error).message || 'Onbekende fout', variant: 'destructive' });
    } finally { setParsing(false); }
  };
  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await parseImageFile(file);
  };
  const handleComposerPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file' && it.type.startsWith('image/')) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          const dataUrl = await fileToDataUrl(file);
          setPastedImage(dataUrl);
          setPastedFileName(file.name || 'screenshot.png');
          return;
        }
      }
    }
  };
  const handleComposerSubmit = async () => {
    if (pastedImage) {
      const res = await fetch(pastedImage);
      const blob = await res.blob();
      const file = new File([blob], pastedFileName || 'pasted.png', { type: blob.type || 'image/png' });
      await parseImageFile(file);
      return;
    }
    const txt = pasteText.trim();
    if (!txt) { toast({ title: 'Niets om in te lezen', description: 'Plak een screenshot of tekst, of voeg een bestand toe.', variant: 'destructive' }); return; }
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-test-image', { body: { text: txt } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const imported = mapAiSteps(data);
      if (!imported.length) { toast({ title: 'Niets herkend', description: 'Geen tredes gevonden in de tekst.', variant: 'destructive' }); return; }
      const rl = data?.resting_lactate;
      if (typeof rl === 'number' && rl > 0) setRestingLactate(String(rl));
      setTestData(imported);
      setNeedsValidation(true);
      setShowPaste(false);
      setPasteText('');
      toast({ title: 'Tekst ingelezen', description: `${imported.length} tredes herkend — controleer en pas aan waar nodig.` });
    } catch (err) {
      toast({ title: 'Inlezen mislukt', description: (err as Error).message || 'Onbekende fout', variant: 'destructive' });
    } finally { setParsing(false); }
  };

  // ── derived ──────────────────────────────────────────────
  const filledCount = testData.filter(r => r.lactate > 0).length;
  const maxLactate = Math.max(0, ...testData.map(r => r.lactate || 0));
  const peakHR = Math.max(0, ...testData.map(r => r.hr || 0));

  // ── styles ───────────────────────────────────────────────
  const cellInput: React.CSSProperties = {
    width: '100%',
    height: '38px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '6px',
    padding: '0 8px',
    color: 'var(--wb-text)',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontVariantNumeric: 'tabular-nums',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'right',
    outline: 'none',
  };

  // Globale afstand wijzigt alle tredes mee
  const handleGlobalDistanceChange = (val: string) => {
    setStepDistance(val);
    const newDist = parseFloat(val) || 0;
    if (newDist > 0) {
      setTestData(testData.map(r => ({
        ...r,
        distance: newDist,
        speed: r.time && r.time > 0 ? calcSpeed(newDist, r.time) : r.speed,
      })));
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageImport} />

      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        marginBottom: '14px',
      }}>
        {/* Import toggle */}
        <button
          onClick={() => setShowPaste(v => !v)}
          className="wb-focus wb-transition"
          aria-expanded={showPaste}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px',
            background: showPaste ? 'rgba(99,102,241,0.10)' : 'var(--wb-surface)',
            border: `1px solid ${showPaste ? 'var(--wb-indigo)' : 'var(--wb-border)'}`,
            color: 'var(--wb-text)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          <MessageSquarePlus size={14} /> Importeren via chat
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="wb-focus wb-transition"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 12px', borderRadius: '8px',
            background: 'var(--wb-surface)', border: '1px solid var(--wb-border)',
            color: 'var(--wb-text-dim)', fontSize: '12.5px', cursor: 'pointer',
          }}
          title="JSON-bestand importeren"
        >
          <FileJson size={13} /> JSON
        </button>

        {/* Protocol drawer */}
        {protocol && setProtocol && (
          <Sheet open={protocolOpen} onOpenChange={setProtocolOpen}>
            <SheetTrigger asChild>
              <button className="wb-focus wb-transition" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px',
                background: 'var(--wb-surface)', border: '1px solid var(--wb-border)',
                color: 'var(--wb-text-dim)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}>
                <Settings2 size={14} /> Protocol instellingen
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-[520px] overflow-y-auto">
              <SheetHeader className="mb-4"><SheetTitle>Protocol instellingen</SheetTitle></SheetHeader>
              <ProtocolBar
                protocol={protocol}
                setProtocol={setProtocol}
                testData={testData}
                setTestData={setTestData}
                setStepDistance={setStepDistance}
                setStepIncrement={setStepIncrement}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Resting lactate */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', borderRadius: '8px',
          background: 'var(--wb-surface)', border: '1px solid var(--wb-border)',
        }}>
          <label style={{ fontSize: '11.5px', color: 'var(--wb-text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Rust
          </label>
          <input
            type="number" inputMode="decimal" step="0.1" min="0"
            value={restingLactate}
            onChange={(e) => setRestingLactate(e.target.value)}
            placeholder="—"
            className="font-mono-num wb-focus"
            style={{
              width: '52px', height: '24px',
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--wb-text)', fontSize: '13px', fontWeight: 600,
              textAlign: 'right',
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--wb-text-mute)' }}>mmol/L</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Keyboard hint */}
        <div className="hidden lg:flex" style={{
          alignItems: 'center', gap: '6px',
          fontSize: '11.5px', color: 'var(--wb-text-mute)',
        }}>
          <Keyboard size={12} />
          <kbd style={kbdStyle}>Tab</kbd> volgende cel
          <kbd style={kbdStyle}>Enter</kbd> nieuwe rij
        </div>
      </div>

      {/* Chat-style import composer */}
      {showPaste && (
        <div style={{
          marginBottom: '14px',
          padding: '12px',
          background: 'var(--wb-surface)',
          border: '1px solid var(--wb-border)',
          borderRadius: '14px',
          display: 'flex', flexDirection: 'column', gap: '10px',
          boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px -16px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--wb-text-mute)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquarePlus size={13} />
            Plak hier een screenshot van je papieren meting (Ctrl/Cmd+V), typ of plak tekst, of klik op <Paperclip size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> om een bestand toe te voegen.
          </div>

          {/* Attached image preview */}
          {pastedImage && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px', borderRadius: '10px',
              background: 'var(--wb-bg)', border: '1px solid var(--wb-border)',
            }}>
              <img src={pastedImage} alt="Bijlage"
                style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--wb-border)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', color: 'var(--wb-text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pastedFileName || 'screenshot.png'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--wb-text-mute)' }}>Klaar om in te lezen</div>
              </div>
              <button onClick={() => { setPastedImage(null); setPastedFileName(null); }}
                className="wb-focus wb-transition"
                aria-label="Bijlage verwijderen"
                style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: 'transparent', border: '1px solid var(--wb-border)',
                  color: 'var(--wb-text-dim)', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Composer textarea + actions row */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            background: 'var(--wb-bg)', border: '1px solid var(--wb-border)',
            borderRadius: '12px', padding: '10px',
          }}>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={handleComposerPaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleComposerSubmit();
                }
              }}
              placeholder={pastedImage
                ? 'Optionele extra context bij je screenshot…'
                : 'Plak hier een screenshot, of typ/plak je testgegevens…\nbv.  1,2 km   7:36   1,7 mmol   141 bpm'}
              rows={5}
              className="font-mono-num wb-focus"
              style={{
                width: '100%', fontSize: '13px', padding: '4px',
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--wb-text)', resize: 'none',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={parsing}
                className="wb-focus wb-transition"
                aria-label="Bestand toevoegen"
                title="Foto / screenshot toevoegen"
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--wb-surface)', border: '1px solid var(--wb-border)',
                  color: 'var(--wb-text-dim)', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <Paperclip size={15} />
              </button>
              <div style={{ flex: 1, fontSize: '11px', color: 'var(--wb-text-mute)' }}>
                <kbd style={kbdStyle}>Ctrl</kbd>/<kbd style={kbdStyle}>⌘</kbd>+<kbd style={kbdStyle}>V</kbd> om screenshot te plakken · <kbd style={kbdStyle}>Ctrl</kbd>+<kbd style={kbdStyle}>Enter</kbd> om te versturen
              </div>
              <button
                onClick={() => { setPasteText(''); setPastedImage(null); setPastedFileName(null); setShowPaste(false); }}
                disabled={parsing}
                className="wb-focus wb-transition"
                style={{ ...secondaryBtn, padding: '7px 12px' }}
              >Annuleren</button>
              <button
                onClick={handleComposerSubmit}
                disabled={parsing || (!pasteText.trim() && !pastedImage)}
                className="wb-focus wb-transition"
                aria-label="Versturen"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  height: '32px', padding: '0 12px', borderRadius: '8px',
                  background: 'var(--wb-indigo)', color: '#fff',
                  border: '1px solid var(--wb-indigo-dim)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  opacity: (parsing || (!pasteText.trim() && !pastedImage)) ? 0.5 : 1,
                }}
              >
                {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp size={15} />}
                {parsing ? 'Inlezen…' : 'Versturen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation banner */}
      {needsValidation && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '11px 14px', marginBottom: '14px',
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: '12px',
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--wb-amber)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '13px', color: 'var(--wb-text)' }}>
            <strong style={{ color: 'var(--wb-amber)' }}>Controle vereist.</strong> Loop alle tredes na en pas aan waar nodig vóór de berekening.
          </div>
          <button onClick={() => setNeedsValidation(false)} className="wb-focus wb-transition"
            style={{ ...secondaryBtn, color: 'var(--wb-amber)', borderColor: 'rgba(245,158,11,0.4)', padding: '5px 10px', fontSize: '12px' }}>
            <Check className="h-3.5 w-3.5" /> Gecontroleerd
          </button>
        </div>
      )}

      {/* ── Workbench: two-column layout ───────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '16px',
      }} className="lg:grid-cols-[55%_45%]">

        {/* LEFT — spreadsheet */}
        <div style={{
          background: 'var(--wb-surface)',
          border: '1px solid var(--wb-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderBottom: '1px solid var(--wb-border)',
          }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--wb-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Stappen — {testData.length}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--wb-text-mute)' }}>
              {filledCount}/{testData.length} ingevuld
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table ref={tableRef} style={{
              width: '100%', borderCollapse: 'collapse', fontSize: '13px',
            }}>
              <thead>
                <tr style={{ background: 'var(--wb-bg)' }}>
                  {['#', 'Afstand', 'Tijd', 'Lactaat', 'HR', 'Tempo', 'Snelh.', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '9px 8px', textAlign: i === 0 ? 'center' : 'right',
                      fontSize: '10.5px', fontWeight: 700,
                      color: 'var(--wb-text-mute)', textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid var(--wb-border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testData.map((row, i) => {
                  const hasLactate = row.lactate > 0;
                  const hasHR = row.hr > 0;
                  const hasTime = (row.time || 0) > 0;
                  const allFilled = hasLactate && hasHR && hasTime;
                  const isFinal = i === testData.length - 1 && testData.length > 1 && protocol?.allOutEnabled;
                  const minVal = row.time ? Math.floor(row.time / 60) : 0;
                  const secVal = row.time ? Math.round(row.time % 60) : 0;

                  return (
                    <tr key={i}
                      className="wb-transition"
                      style={{
                        borderBottom: '1px solid var(--wb-border)',
                        borderLeft: isFinal ? '2px solid var(--wb-amber)' : '2px solid transparent',
                        background: isFinal ? 'rgba(245,158,11,0.03)' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (!isFinal) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                      onMouseLeave={(e) => { if (!isFinal) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* # */}
                      <td style={{ padding: '6px 8px', textAlign: 'center', width: '36px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '22px', height: '22px', borderRadius: '6px',
                          background: allFilled ? 'rgba(52,211,153,0.12)' : 'var(--wb-bg)',
                          border: `1px solid ${allFilled ? 'rgba(52,211,153,0.35)' : 'var(--wb-border-2)'}`,
                          color: allFilled ? 'var(--wb-emerald)' : 'var(--wb-text-mute)',
                          fontSize: '11px', fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {isFinal ? <Zap size={11} color="var(--wb-amber)" /> : allFilled ? <Check size={12} /> : i + 1}
                        </div>
                      </td>

                      {/* Distance */}
                      <td style={{ padding: '4px 4px', width: '90px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="number" inputMode="numeric"
                            value={row.distance ?? ''}
                            onChange={(e) => updateStepDistanceFor(i, e.target.value)}
                            placeholder={String(dist)}
                            aria-label={`Trede ${i + 1} afstand`}
                            style={cellInput}
                            onFocus={cellInputFocus} onBlur={cellInputBlur}
                          />
                          <span style={unitStyle}>m</span>
                        </div>
                      </td>

                      {/* Time mm:ss */}
                      <td style={{ padding: '4px 4px', width: '110px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <input
                            type="number" inputMode="numeric" min="0" max="99"
                            value={minVal || ''}
                            onChange={(e) => updateTime(i, parseInt(e.target.value) || 0, secVal)}
                            placeholder="mm"
                            aria-label={`Trede ${i + 1} minuten`}
                            style={{ ...cellInput, textAlign: 'center', padding: '0 4px' }}
                            onFocus={cellInputFocus} onBlur={cellInputBlur}
                          />
                          <span style={{ color: 'var(--wb-text-mute)', fontWeight: 700 }}>:</span>
                          <input
                            type="number" inputMode="numeric" min="0" max="59"
                            value={secVal || ''}
                            onChange={(e) => updateTime(i, minVal, parseInt(e.target.value) || 0)}
                            placeholder="ss"
                            aria-label={`Trede ${i + 1} seconden`}
                            style={{ ...cellInput, textAlign: 'center', padding: '0 4px' }}
                            onFocus={cellInputFocus} onBlur={cellInputBlur}
                          />
                        </div>
                      </td>

                      {/* Lactate */}
                      <td style={{ padding: '4px 4px', width: '88px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="number" inputMode="decimal" step="0.1" min="0" max="25"
                            value={row.lactate || ''}
                            onChange={(e) => updateRow(i, { lactate: parseFloat(e.target.value) || 0 })}
                            placeholder="—"
                            aria-label={`Trede ${i + 1} lactaat`}
                            style={cellInput}
                            onFocus={cellInputFocus} onBlur={cellInputBlur}
                          />
                        </div>
                      </td>

                      {/* HR */}
                      <td style={{ padding: '4px 4px', width: '72px' }}>
                        <input
                          type="number" inputMode="numeric" min="0" max="220"
                          value={row.hr || ''}
                          onChange={(e) => updateRow(i, { hr: parseInt(e.target.value) || 0 })}
                          placeholder="—"
                          aria-label={`Trede ${i + 1} hartslag`}
                          style={cellInput}
                          onFocus={cellInputFocus} onBlur={cellInputBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && i === testData.length - 1) {
                              e.preventDefault();
                              addRow();
                            }
                          }}
                        />
                      </td>

                      {/* Pace (auto) */}
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <span className="font-mono-num" style={autoCellStyle(row.speed > 0)}>
                          {row.speed > 0 ? formatPace(row.speed) : '—'}
                        </span>
                      </td>

                      {/* Speed (auto) */}
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <span className="font-mono-num" style={autoCellStyle(row.speed > 0)}>
                          {row.speed > 0 ? row.speed.toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '6px 6px', textAlign: 'center', width: '34px' }}>
                        <button
                          onClick={() => removeRow(i)}
                          aria-label={`Verwijder trede ${i + 1}`}
                          className="wb-focus wb-transition"
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px',
                            color: 'var(--wb-text-mute)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgb(248,113,113)'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--wb-text-mute)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--wb-border)' }}>
            <button onClick={addRow} className="wb-focus wb-transition" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '7px',
              background: 'transparent', border: '1px solid var(--wb-border-2)',
              color: 'var(--wb-text-dim)', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer',
            }}>
              <Plus size={13} /> Trede toevoegen
            </button>
          </div>
        </div>

        {/* RIGHT — sticky live preview */}
        <div style={{ position: 'sticky', top: '16px', alignSelf: 'start' }}>
          <div style={{
            background: 'var(--wb-surface)',
            border: '1px solid var(--wb-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderBottom: '1px solid var(--wb-border)',
            }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--wb-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live voorbeeld
              </span>
              <button
                onClick={onCalculate}
                disabled={needsValidation || filledCount < 3}
                className="wb-focus wb-transition"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '8px',
                  background: (needsValidation || filledCount < 3) ? 'var(--wb-surface-2)' : 'var(--wb-indigo)',
                  border: '1px solid ' + ((needsValidation || filledCount < 3) ? 'var(--wb-border-2)' : 'var(--wb-indigo-dim)'),
                  color: (needsValidation || filledCount < 3) ? 'var(--wb-text-mute)' : '#fff',
                  fontSize: '12.5px', fontWeight: 600,
                  cursor: (needsValidation || filledCount < 3) ? 'not-allowed' : 'pointer',
                  boxShadow: (needsValidation || filledCount < 3) ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                aria-label="Genereer rapport"
              >
                Genereer rapport
              </button>
            </div>

            {/* Metric tiles */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px', background: 'var(--wb-border)',
              borderBottom: '1px solid var(--wb-border)',
            }}>
              <Tile label="LT1" value={livePreview ? formatPace(livePreview.lt1.best) : '—'} sub={livePreview ? '/km' : ''} color="var(--wb-emerald)" />
              <Tile label="LT2" value={livePreview ? formatPace(livePreview.lt2.best) : '—'} sub={livePreview ? '/km' : ''} color="var(--wb-amber)" />
              <Tile label="Max Lac" value={maxLactate > 0 ? maxLactate.toFixed(1) : '—'} sub={maxLactate > 0 ? 'mmol/L' : ''} color="var(--wb-text)" />
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1px', background: 'var(--wb-border)',
              borderBottom: '1px solid var(--wb-border)',
            }}>
              <Tile label="Piek HR" value={peakHR > 0 ? String(peakHR) : '—'} sub={peakHR > 0 ? 'bpm' : ''} color="var(--wb-text)" />
              <Tile
                label="Drempel lac."
                value={livePreview && livePreview.coeffs ? polyEval(livePreview.coeffs, livePreview.lt2.best).toFixed(1) : '—'}
                sub={livePreview ? 'mmol/L' : ''}
                color="var(--wb-text)"
              />
            </div>

            {/* Chart */}
            <div style={{ padding: '10px 8px 4px' }}>
              {livePreview ? (
                <div className="wb-tick"><LactateChart results={livePreview} /></div>
              ) : (
                <div style={{
                  height: '280px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '6px',
                  color: 'var(--wb-text-mute)', fontSize: '12.5px',
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--wb-text-dim)' }}>Curve verschijnt hier</div>
                  <div>Minstens 3 tredes met snelheid + lactaat nodig</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ── small visual helpers ──────────────────────────────────
const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  background: 'var(--wb-surface)',
  border: '1px solid var(--wb-border-2)',
  borderRadius: '4px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '10.5px',
  color: 'var(--wb-text-dim)',
  margin: '0 2px',
};
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'var(--wb-indigo)', color: '#fff',
  border: '1px solid var(--wb-indigo-dim)',
  borderRadius: '8px',
  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
};
const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'transparent', color: 'var(--wb-text-dim)',
  border: '1px solid var(--wb-border-2)',
  borderRadius: '8px',
  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
};
const unitStyle: React.CSSProperties = {
  fontSize: '10.5px', color: 'var(--wb-text-mute)',
  paddingRight: '6px', fontWeight: 600,
};
const autoCellStyle = (active: boolean): React.CSSProperties => ({
  fontSize: '12.5px',
  fontWeight: 500,
  color: active ? 'var(--wb-text)' : 'var(--wb-text-mute)',
  opacity: active ? 1 : 0.4,
});

const Tile = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <div style={{
    background: 'var(--wb-surface)',
    padding: '10px 12px',
  }}>
    <div style={{
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--wb-text-mute)',
      marginBottom: '4px',
    }}>{label}</div>
    <div className="font-mono-num" style={{
      fontSize: '20px', fontWeight: 600, color, lineHeight: 1.1,
    }}>{value}</div>
    {sub && (
      <div style={{ fontSize: '10.5px', color: 'var(--wb-text-mute)', marginTop: '2px' }}>{sub}</div>
    )}
  </div>
);

export default DataInputTab;
