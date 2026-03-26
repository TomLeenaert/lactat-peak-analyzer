import { useState } from 'react';
import { formatPace } from '@/lib/lactate-math';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AppNav from '@/components/AppNav';
import { Trash2 } from 'lucide-react';

interface StoredThresholdResults {
  lt1Speed?: number;
  lt2Speed?: number;
  lt1?: { best?: number };
  lt2?: { best?: number };
}

const getStoredResults = (value: unknown): StoredThresholdResults | null => {
  if (typeof value !== 'object' || value === null) return null;
  return value as StoredThresholdResults;
};

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const AthleteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', birth_date: '', sport: '', notes: '' });

  const { data: athlete, isLoading } = useQuery({
    queryKey: ['athlete', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('athletes').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tests = [] } = useQuery({
    queryKey: ['tests', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('athlete_id', id!)
        .order('test_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateAthlete = useMutation({
    mutationFn: async (form: typeof editForm) => {
      const { error } = await supabase.from('athletes').update({
        name: form.name,
        birth_date: form.birth_date || null,
        sport: form.sport || null,
        notes: form.notes || null,
      }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete', id] });
      setEditOpen(false);
      toast({ title: 'Atleet bijgewerkt' });
    },
  });

  const deleteTest = useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase.from('test_results').delete().eq('id', testId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests', id] });
      toast({ title: 'Test verwijderd' });
    },
  });

  if (isLoading || !athlete) return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#adaaaa', fontFamily: 'Space Grotesk, sans-serif' }}>Laden...</p>
    </div>
  );

  const openEdit = () => {
    setEditForm({ name: athlete.name, birth_date: athlete.birth_date || '', sport: athlete.sport || '', notes: athlete.notes || '' });
    setEditOpen(true);
  };

  const latestTest = tests[0];
  const latestResults = getStoredResults(latestTest?.results_json);
  const latestLt1Speed = latestResults?.lt1?.best ?? latestResults?.lt1Speed ?? null;
  const latestLt2Speed = latestResults?.lt2?.best ?? latestResults?.lt2Speed ?? null;

  // Avg tempo from all tests that have LT2 results
  const avgTempo = (() => {
    const lt2Speeds = tests
      .map(t => {
        const r = getStoredResults(t.results_json);
        return r?.lt2?.best ?? r?.lt2Speed ?? null;
      })
      .filter((s): s is number => s != null && s > 0);
    if (lt2Speeds.length === 0) return null;
    const avg = lt2Speeds.reduce((a, b) => a + b, 0) / lt2Speeds.length;
    return formatPace(avg);
  })();

  const editButton = (
    <button onClick={openEdit} style={{
      fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: '#bd9dff', background: 'rgba(189,157,255,0.1)',
      border: '1px solid rgba(189,157,255,0.25)',
      borderRadius: '2px', padding: '6px 14px', cursor: 'pointer',
    }}>
      Edit
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e' }}>
      <AppNav
        backTo="/dashboard"
        backLabel="Athletes"
        title="LacTest"
        rightContent={editButton}
      />

      <main style={{ padding: '24px 24px 120px' }}>

        {/* Athlete profile header */}
        <div style={{
          background: '#131313',
          borderRadius: '2px',
          padding: '24px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '20px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '72px', height: '72px', flexShrink: 0,
            background: '#201f1f',
            border: '2px solid #bd9dff',
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '24px', fontWeight: 900, color: '#bd9dff',
            letterSpacing: '-0.5px',
          }}>
            {getInitials(athlete.name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {athlete.sport && (
              <span style={{
                display: 'inline-block',
                background: '#006c50', color: '#dfffef',
                fontSize: '9px', fontWeight: 900,
                fontFamily: 'Space Grotesk, sans-serif',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: '2px', marginBottom: '6px',
              }}>
                {athlete.sport}
              </span>
            )}
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '26px', fontWeight: 900,
              letterSpacing: '-0.5px', color: '#fff',
              margin: '0 0 2px', lineHeight: 1.1,
            }}>
              {athlete.name}
            </h1>
            {athlete.notes && (
              <p style={{ fontSize: '12px', color: '#adaaaa', margin: '4px 0 0', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>
                {athlete.notes}
              </p>
            )}
          </div>
        </div>

        {/* VO2 Max / key metric — large display */}
        {latestLt2Speed && (
          <div style={{
            background: '#131313',
            borderRadius: '2px',
            padding: '20px 24px',
            marginBottom: '16px',
          }}>
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#777575', marginBottom: '4px',
            }}>
              T4mmol Precision
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '56px', fontWeight: 900,
                color: '#00fdc1', lineHeight: 1,
                letterSpacing: '-2px',
                textShadow: '0 0 20px rgba(0,253,193,0.3)',
              }}>
                {formatPace(latestLt2Speed)}
              </span>
              <span style={{ fontSize: '14px', color: '#adaaaa', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>
                min/km
              </span>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#131313', borderRadius: '2px', padding: '16px' }}>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', margin: '0 0 6px' }}>Tests</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '36px', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>
              {tests.length}
            </p>
            {tests.length > 1 && (
              <p style={{ fontSize: '11px', color: '#00fdc1', margin: '4px 0 0', fontWeight: 700 }}>↑ {tests.length - 1} sessies</p>
            )}
          </div>
          <div style={{ background: '#131313', borderRadius: '2px', padding: '16px' }}>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', margin: '0 0 6px' }}>Avg Tempo</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-0.5px' }}>
              {avgTempo ?? '—'}
            </p>
            <p style={{ fontSize: '11px', color: '#777575', margin: '4px 0 0', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              min/km
            </p>
          </div>
        </div>

        {/* New test button */}
        <button
          onClick={() => navigate(`/athlete/${id}/test`)}
          style={{
            width: '100%',
            height: '64px',
            background: 'linear-gradient(135deg, #8b4aff 0%, #bd9dff 100%)',
            border: 'none',
            borderRadius: '2px',
            color: '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 900,
            fontSize: '16px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            marginBottom: '32px',
            boxShadow: '0 8px 24px rgba(139,74,255,0.3)',
          }}
        >
          + Nieuwe Test
        </button>

        {/* History */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', margin: 0 }}>
              History
            </h2>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#777575' }}>
              Last {tests.length} tests
            </span>
          </div>

          {tests.length === 0 ? (
            <div style={{ background: '#131313', borderRadius: '2px', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', color: '#adaaaa' }}>Nog geen tests uitgevoerd.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {tests.map(t => {
                const r = getStoredResults(t.results_json);
                const lt1Speed = r?.lt1?.best ?? r?.lt1Speed ?? null;
                const lt2Speed = r?.lt2?.best ?? r?.lt2Speed ?? null;
                const hasResults = lt1Speed != null || lt2Speed != null;
                const steps = Array.isArray(t.steps_json) ? t.steps_json : [];

                // Format date: "Feb 24, 2024" style
                const dateStr = t.test_date ? new Date(t.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                return (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/athlete/${id}/test/${t.id}`)}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: '#131313',
                      border: 'none',
                      borderBottom: '1px solid #1a1919',
                      padding: '16px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#777575', margin: '0 0 4px' }}>
                        {dateStr}
                      </p>
                      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>
                        {hasResults
                          ? (lt2Speed ? `Lactate Threshold 2` : `Aerobic Threshold`)
                          : `Test — ${steps.length} stappen`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {lt2Speed && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 900, color: '#00fdc1', margin: 0, lineHeight: 1 }}>
                            {lt2Speed.toFixed(1)}
                          </p>
                          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, color: '#777575', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            mmol/L
                          </p>
                        </div>
                      )}
                      <span style={{ color: '#777575', fontSize: '18px' }}>›</span>
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm('Test verwijderen?')) deleteTest.mutate(t.id); }}
                        style={{
                          width: '28px', height: '28px',
                          background: 'rgba(239,68,68,0.07)',
                          border: '1px solid rgba(239,68,68,0.15)',
                          borderRadius: '2px',
                          color: 'rgba(239,68,68,0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atleet bewerken</DialogTitle>
            <DialogDescription>Wijzig de gegevens van de atleet.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); updateAthlete.mutate(editForm); }} className="space-y-4">
            <Input placeholder="Naam *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
            <Input type="date" value={editForm.birth_date} onChange={e => setEditForm(p => ({ ...p, birth_date: e.target.value }))} />
            <Input placeholder="Sport" value={editForm.sport} onChange={e => setEditForm(p => ({ ...p, sport: e.target.value }))} />
            <Input placeholder="Notities" value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            <Button type="submit" className="w-full" disabled={updateAthlete.isPending}>Opslaan</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AthleteDetail;
