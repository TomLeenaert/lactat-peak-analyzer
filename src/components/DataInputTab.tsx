import { useRef, useState } from 'react';
import {
  Trash2, Plus, AlertTriangle, Check, Loader2,
  Zap, X, ArrowUp, Paperclip, FileJson, MessageSquarePlus,
  Clock, Droplet, Heart,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { formatPace, type StepData } from '@/lib/lactate-math';
import type { ProtocolSettings } from '@/lib/protocol-types';
import logoSrc from '@/assets/screen.png';


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
  // Ruwe (tekst) waarden per rij voor het lactaatveld, zodat "2," of "2." blijft staan tijdens typen
  const [lactateRaw, setLactateRaw] = useState<Record<number, { raw: string; num: number }>>({});
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([
    {
      role: 'assistant',
      content:
        'Hi 👋 Ik help je met deze test.\n\n' +
        '• Vul **tijd, lactaat en HR** per trap in (Tab/Enter om snel te navigeren).\n\n' +
        '• Stel **afstand per trap** bovenaan in (standaard 1600 m).\n\n' +
        '• OF **Plak een screenshot** of klik op 📎 — ik lees je papieren testblad automatisch in.',
    },
  ]);
  const [chatBusy, setChatBusy] = useState(false);
  const { toast } = useToast();
  const { t } = useLang();



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
      if (!imported.length) { toast({ title: 'Niets herkend', description: 'Geen trappen gevonden in de afbeelding.', variant: 'destructive' }); return; }
      const rl = data?.resting_lactate;
      if (typeof rl === 'number' && rl > 0) setRestingLactate(String(rl));
      setTestData(imported);
      setNeedsValidation(true);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Ik heb **${imported.length} trappen** ingelezen uit je afbeelding. **Controleer elke trap** (tijd, lactaat, HR, snelheid) en pas aan waar nodig. Klik daarna bovenaan op de knop **✓ Gecontroleerd** om door te gaan met de berekening.` }]);
      setPastedImage(null); setPastedFileName(null); setPasteText(''); setShowPaste(false);
      toast({ title: 'Afbeelding ingelezen', description: `${imported.length} trappen herkend — controleer en pas aan waar nodig.` });
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
  // Heuristiek: lijkt deze tekst op testdata (cijfers/eenheden) of is het een vraag?
  const looksLikeTestData = (txt: string) => {
    const lower = txt.toLowerCase();
    const hasUnit = /(mmol|bpm|km\/h|km|:\d{2})/.test(lower);
    const digits = (txt.match(/\d/g) || []).length;
    return hasUnit && digits >= 4;
  };

  const handleComposerSubmit = async () => {
    // 1) Afbeelding → altijd inlezen via parse-test-image
    if (pastedImage) {
      const res = await fetch(pastedImage);
      const blob = await res.blob();
      const file = new File([blob], pastedFileName || 'pasted.png', { type: blob.type || 'image/png' });
      await parseImageFile(file);
      return;
    }

    const txt = pasteText.trim();
    if (!txt) {
      toast({ title: 'Niets te versturen', description: 'Plak een screenshot, typ je testdata of stel een vraag.', variant: 'destructive' });
      return;
    }

    // 2) Lijkt op testdata? → inlezen
    if (looksLikeTestData(txt)) {
      setParsing(true);
      try {
        const { data, error } = await supabase.functions.invoke('parse-test-image', { body: { text: txt } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const imported = mapAiSteps(data);
        if (!imported.length) { toast({ title: 'Niets herkend', description: 'Geen trappen gevonden in de tekst.', variant: 'destructive' }); return; }
        const rl = data?.resting_lactate;
        if (typeof rl === 'number' && rl > 0) setRestingLactate(String(rl));
        setTestData(imported);
        setNeedsValidation(true);
        setChatMessages(prev => [...prev, { role: 'assistant', content: `Ik heb **${imported.length} trappen** ingelezen uit je tekst. **Controleer elke trap** en pas aan waar nodig. Klik daarna bovenaan op de knop **✓ Gecontroleerd** om door te gaan.` }]);
        setPasteText('');
        toast({ title: 'Tekst ingelezen', description: `${imported.length} trappen herkend — controleer en pas aan waar nodig.` });
      } catch (err) {
        toast({ title: 'Inlezen mislukt', description: (err as Error).message || 'Onbekende fout', variant: 'destructive' });
      } finally { setParsing(false); }
      return;
    }

    // 3) Anders → gesprek met de assistent
    const userMsg = { role: 'user' as const, content: txt };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setPasteText('');
    setChatBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('lactate-chat', {
        body: { messages: nextMessages.map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const reply: string = data?.reply || '…';
      setChatMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setChatMessages([...nextMessages, { role: 'assistant', content: `Sorry, er ging iets mis: ${(err as Error).message}` }]);
    } finally { setChatBusy(false); }
  };

  // ── derived ──────────────────────────────────────────────
  const filledCount = testData.filter(r => r.lactate > 0).length;

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
    fontSize: '16px',
    fontWeight: 500,
    textAlign: 'right',
    outline: 'none',
  };

  // Globale afstand wijzigt alle (niet-all-out) trappen mee
  const handleGlobalDistanceChange = (val: string) => {
    setStepDistance(val);
    const newDist = parseFloat(val) || 0;
    if (newDist > 0) {
      const lastIdx = testData.length - 1;
      setTestData(testData.map((r, idx) => {
        if (protocol?.allOutEnabled && idx === lastIdx) return r;
        return {
          ...r,
          distance: newDist,
          speed: r.time && r.time > 0 ? calcSpeed(newDist, r.time) : r.speed,
        };
      }));
    }
  };

  // All-out afstand wijzigt alleen de laatste trap
  const handleAllOutDistanceChange = (val: string) => {
    const newDist = parseFloat(val) || 0;
    if (setProtocol && protocol) setProtocol({ ...protocol, allOutDistance: newDist });
    const lastIdx = testData.length - 1;
    if (lastIdx < 0) return;
    setTestData(testData.map((r, idx) => {
      if (idx !== lastIdx) return r;
      return {
        ...r,
        distance: newDist,
        speed: r.time && r.time > 0 ? calcSpeed(newDist, r.time) : r.speed,
      };
    }));
  };

  return (
    <>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageImport} />
      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleJsonImport} />


      {/* Action bar — afstand + all-out afstand */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        marginBottom: '14px',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', borderRadius: '8px',
          background: 'var(--wb-surface)', border: '1px solid var(--wb-border)',
        }}>
          <label style={{ fontSize: '11.5px', color: 'var(--wb-text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Afstand / trap
          </label>
          <input
            type="number" inputMode="numeric" min="0"
            value={stepDistance}
            onChange={(e) => handleGlobalDistanceChange(e.target.value)}
            placeholder="1600"
            className="font-mono-num no-spin wb-focus"
            style={{
              width: '70px', height: '24px',
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--wb-text)', fontSize: '13px', fontWeight: 600,
              textAlign: 'right',
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--wb-text-mute)' }}>m</span>
        </div>

        {/* All-Out toggle + distance */}
        {protocol && setProtocol && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '6px 12px', borderRadius: '8px',
            background: protocol.allOutEnabled ? 'rgba(245,158,11,0.06)' : 'var(--wb-surface)',
            border: protocol.allOutEnabled ? '1px solid rgba(245,158,11,0.35)' : '1px solid var(--wb-border)',
          }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!protocol.allOutEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setProtocol({ ...protocol, allOutEnabled: enabled });
                  if (enabled) {
                    // append all-out row if missing
                    const lastIdx = testData.length - 1;
                    const last = testData[lastIdx];
                    const aoDist = protocol.allOutDistance || 600;
                    if (!last || last.distance !== aoDist) {
                      setTestData([...testData, { speed: 0, lactate: 0, hr: 0, watt: 0, distance: aoDist, time: 0 }]);
                    }
                  } else {
                    // remove last row if it's the all-out row
                    if (testData.length > 0) {
                      const lastIdx = testData.length - 1;
                      const last = testData[lastIdx];
                      if (last && last.distance !== (parseFloat(stepDistance) || 0)) {
                        setTestData(testData.slice(0, -1));
                      }
                    }
                  }
                }}
                style={{ accentColor: 'var(--wb-amber)' }}
              />
              <Zap size={13} style={{ color: protocol.allOutEnabled ? 'var(--wb-amber)' : 'var(--wb-text-mute)' }} />
              <span style={{ fontSize: '11.5px', color: protocol.allOutEnabled ? 'var(--wb-amber)' : 'var(--wb-text-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                All-Out
              </span>
            </label>
            {protocol.allOutEnabled && (
              <>
                <input
                  type="number" inputMode="numeric" min="0"
                  value={protocol.allOutDistance || ''}
                  onChange={(e) => handleAllOutDistanceChange(e.target.value)}
                  placeholder="800"
                  className="font-mono-num no-spin wb-focus"
                  style={{
                    width: '70px', height: '24px',
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--wb-text)', fontSize: '13px', fontWeight: 600,
                    textAlign: 'right',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--wb-text-mute)' }}>m</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Composer moved to right column — always visible */}

      {/* Validation banner moved into the chat panel for consistency */}

      {/* ── Workbench: two-column layout ───────────────────── */}
      <div
        className="grid w-full grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_560px]"
        style={{ maxWidth: 'none' }}
      >

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
              width: '100%', borderCollapse: 'collapse', fontSize: '15px', tableLayout: 'fixed',
            }}>
              <colgroup>
                <col style={{ width: '52px' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '40px' }} />
              </colgroup>
              <thead>
                <tr style={{ background: 'var(--wb-bg)' }}>
                  {[
                    { label: '#', icon: null, big: false },
                    { label: 'Tijd', icon: <Clock size={13} />, big: true },
                    { label: 'Lactaat', icon: <Droplet size={13} />, big: true },
                    { label: 'HR', icon: <Heart size={13} />, big: true },
                    { label: 'Tempo', icon: null, big: false },
                    { label: 'Snelh.', icon: null, big: false },
                    { label: '', icon: null, big: false },
                  ].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 10px',
                      textAlign: i === 0 ? 'center' : h.big ? 'left' : 'right',
                      fontSize: h.big ? '12.5px' : '11px',
                      fontWeight: 700,
                      color: h.big ? 'var(--wb-text)' : 'var(--wb-text-mute)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid var(--wb-border)',
                      opacity: h.big ? 1 : 0.7,
                    }}>
                      {h.icon ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--wb-indigo)', opacity: 0.9 }}>{h.icon}</span>
                          {h.label}
                        </span>
                      ) : h.label}
                    </th>
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

                  const bigInput: React.CSSProperties = {
                    ...cellInput,
                    height: '46px',
                    fontSize: '19px',
                    fontWeight: 600,
                    background: 'var(--wb-bg)',
                    border: '1px solid var(--wb-border-2)',
                    borderRadius: '8px',
                  };

                  return (
                    <tr key={i}
                      className="wb-transition"
                      style={{
                        borderBottom: '1px solid var(--wb-border)',
                        borderLeft: isFinal ? '2px solid var(--wb-amber)' : '2px solid transparent',
                        background: isFinal ? 'rgba(245,158,11,0.03)' : 'transparent',
                      }}
                    >
                      {/* # */}
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '7px',
                            background: allFilled ? 'rgba(52,211,153,0.12)' : 'var(--wb-bg)',
                            border: `1px solid ${allFilled ? 'rgba(52,211,153,0.35)' : 'var(--wb-border-2)'}`,
                            color: allFilled ? 'var(--wb-emerald)' : 'var(--wb-text-mute)',
                            fontSize: '12px', fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {isFinal ? <Zap size={12} color="var(--wb-amber)" /> : allFilled ? <Check size={13} /> : i + 1}
                          </div>
                          <span style={{
                            fontSize: '10.5px', fontWeight: 700,
                            color: isFinal ? 'var(--wb-amber)' : 'var(--wb-text-mute)',
                            fontFamily: "'JetBrains Mono', monospace",
                            whiteSpace: 'nowrap',
                          }}>
                            {row.distance ? `${row.distance}m` : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Time mm:ss */}
                      <td style={{ padding: '8px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
                            value={(hasTime || minVal > 0) ? String(minVal) : ''}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                              updateTime(i, parseInt(v) || 0, secVal);
                            }}
                            placeholder="mm"
                            aria-label={`Trap ${i + 1} minuten`}
                            className="wb-cell no-spin"
                            style={{ ...bigInput, textAlign: 'center', padding: '0 6px', flex: 1, minWidth: 0 }}
                          />
                          <span style={{ color: 'var(--wb-text-mute)', fontWeight: 700, fontSize: '18px' }}>:</span>
                          <input
                            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
                            value={hasTime ? String(secVal).padStart(2, '0') : ''}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                              const s = Math.min(parseInt(v) || 0, 59);
                              updateTime(i, minVal, s);
                            }}
                            placeholder="ss"
                            aria-label={`Trap ${i + 1} seconden`}
                            className="wb-cell no-spin"
                            style={{ ...bigInput, textAlign: 'center', padding: '0 6px', flex: 1, minWidth: 0 }}
                          />
                        </div>
                      </td>

                      {/* Lactate */}
                      <td style={{ padding: '8px 8px' }}>
                        <input
                          type="text" inputMode="decimal"
                          value={
                            lactateRaw[i] !== undefined && lactateRaw[i].num === row.lactate
                              ? lactateRaw[i].raw
                              : (row.lactate || '')
                          }
                          onChange={(e) => {
                            // enkel cijfers en één scheidingsteken (, of .)
                            let raw = e.target.value.replace(/[^\d.,]/g, '');
                            const firstSep = raw.search(/[.,]/);
                            if (firstSep !== -1) {
                              raw = raw.slice(0, firstSep + 1) + raw.slice(firstSep + 1).replace(/[.,]/g, '');
                            }
                            let num = parseFloat(raw.replace(',', '.'));
                            if (!isFinite(num)) num = 0;
                            num = Math.min(25, Math.max(0, num));
                            setLactateRaw((prev) => ({ ...prev, [i]: { raw, num } }));
                            updateRow(i, { lactate: num });
                          }}
                          placeholder="—"
                          aria-label={`Trap ${i + 1} lactaat`}
                          className="wb-cell no-spin"
                          style={{ ...bigInput, textAlign: 'center' }}
                        />
                      </td>

                      {/* HR */}
                      <td style={{ padding: '8px 8px' }}>
                        <input
                          type="number" min="0" max="220"
                          value={row.hr || ''}
                          onChange={(e) => updateRow(i, { hr: parseInt(e.target.value) || 0 })}
                          placeholder="—"
                          aria-label={`Trap ${i + 1} hartslag`}
                          className="wb-cell no-spin"
                          style={{ ...bigInput, textAlign: 'center' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && i === testData.length - 1) {
                              e.preventDefault();
                              addRow();
                            }
                          }}
                        />
                      </td>

                      {/* Pace (auto) */}
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                        <span className="font-mono-num" style={{ ...autoCellStyle(row.speed > 0), fontSize: '13px', opacity: 0.75 }}>
                          {row.speed > 0 ? formatPace(row.speed) : '—'}
                        </span>
                      </td>

                      {/* Speed (auto) */}
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                        <span className="font-mono-num" style={{ ...autoCellStyle(row.speed > 0), fontSize: '13px', opacity: 0.75 }}>
                          {row.speed > 0 ? row.speed.toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '6px 6px', textAlign: 'center', width: '34px' }}>
                        <button
                          onClick={() => removeRow(i)}
                          aria-label={`Verwijder trap ${i + 1}`}
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
              <Plus size={13} /> Trap toevoegen
            </button>
          </div>
        </div>

        {/* RIGHT — chat (always open), aligned to data box height */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>

          {/* Permanent chat composer */}
          <div style={{
            flex: 1,
            padding: '12px',
            background: 'var(--wb-surface)',
            border: '1px solid var(--wb-border)',
            borderRadius: '14px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px -16px rgba(0,0,0,0.6)',
            minHeight: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ fontSize: '12px', color: 'var(--wb-text-mute)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquarePlus size={13} />
                <span style={{ color: 'var(--wb-text-dim)', fontWeight: 600 }}>Assistent</span>
              </div>
              <button
                onClick={onCalculate}
                disabled={needsValidation || filledCount < 3}
                className="wb-focus wb-transition"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px',
                  background: (needsValidation || filledCount < 3) ? 'var(--wb-surface-2)' : 'var(--wb-indigo)',
                  border: '1px solid ' + ((needsValidation || filledCount < 3) ? 'var(--wb-border-2)' : 'var(--wb-indigo-dim)'),
                  color: (needsValidation || filledCount < 3) ? 'var(--wb-text-mute)' : '#fff',
                  fontSize: '12px', fontWeight: 600,
                  cursor: (needsValidation || filledCount < 3) ? 'not-allowed' : 'pointer',
                  boxShadow: (needsValidation || filledCount < 3) ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                aria-label="Genereer rapport"
              >
                Genereer rapport
              </button>
            </div>

            {needsValidation && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.45)',
                borderRadius: '12px',
              }}>
                <AlertTriangle size={18} style={{ color: 'var(--wb-amber)', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '12.5px', color: 'var(--wb-text)', lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--wb-amber)' }}>Controle vereist.</strong> Loop alle trappen na en klik dan op de knop hiernaast.
                </div>
                <button onClick={() => setNeedsValidation(false)} className="wb-focus wb-transition wb-pulse-cta"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'var(--wb-amber)',
                    color: '#1a1205',
                    border: '1px solid var(--wb-amber)',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    boxShadow: '0 0 0 0 rgba(245,158,11,0.55)',
                  }}>
                  <Check className="h-4 w-4" /> Gecontroleerd
                </button>
              </div>
            )}

            {/* Conversatie-historiek */}
            <div style={{
              flex: 1, minHeight: '280px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: '8px',
              padding: '4px 2px',
            }}>
              {chatMessages.map((m, idx) => (
                <div key={idx} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'var(--wb-indigo)' : 'var(--wb-surface-2)',
                  color: m.role === 'user' ? '#fff' : 'var(--wb-text)',
                  border: m.role === 'user' ? '1px solid var(--wb-indigo-dim)' : '1px solid var(--wb-border)',
                  fontSize: '13px', lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  boxShadow: m.role === 'user' ? 'inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
                }}>
                  {m.role === 'assistant'
                    ? m.content.split('\n').map((line, j) => (
                        <div key={j} dangerouslySetInnerHTML={{
                          __html: line
                            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                        }} />
                      ))
                    : m.content}
                </div>
              ))}
              {chatBusy && (
                <div style={{ alignSelf: 'flex-start', fontSize: '13px', color: 'var(--wb-text-mute)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> aan het typen…
                </div>
              )}
            </div>

            {pastedImage && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px', borderRadius: '10px',
                background: 'var(--wb-bg)', border: '1px solid var(--wb-border)',
              }}>
                <img src={pastedImage} alt="Bijlage"
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--wb-border)' }} />
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
                  : 'Stel een vraag, plak een screenshot of typ je testdata…'}
                rows={4}
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
                  disabled={parsing || chatBusy}
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
                <div style={{ flex: 1 }} />
                <button
                  onClick={handleComposerSubmit}
                  disabled={parsing || chatBusy || (!pasteText.trim() && !pastedImage)}
                  className="wb-focus wb-transition"
                  aria-label="Versturen"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    height: '32px', padding: '0 12px', borderRadius: '8px',
                    background: 'var(--wb-indigo)', color: '#fff',
                    border: '1px solid var(--wb-indigo-dim)',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    opacity: (parsing || chatBusy || (!pasteText.trim() && !pastedImage)) ? 0.5 : 1,
                  }}
                >
                  {(parsing || chatBusy) ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp size={15} />}
                  {parsing ? 'Inlezen…' : chatBusy ? 'Bezig…' : 'Versturen'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer logo */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '18px', padding: '48px 0 32px', marginTop: '32px',
      }}>
        <img src={logoSrc} alt="MyLactest" style={{
          width: '260px', height: '260px', objectFit: 'contain',
        }} />
        <span style={{
          fontSize: '44px', fontWeight: 800, letterSpacing: '1px',
          color: 'var(--wb-text)',
        }}>
          MyLactest
        </span>
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


export default DataInputTab;
