import { useState } from 'react';
import { formatPace } from '@/lib/lactate-math';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AppNav from '@/components/AppNav';
import { Plus, Pencil, Trash2, Calendar, Activity, TrendingUp, BarChart3, ChevronRight } from 'lucide-react';

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
  const { user } = useAuth();
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

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#09090d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Laden...</p>
    </div>
  );
  if (!athlete) return (
    <div style={{ minHeight: '100vh', background: '#09090d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Atleet niet gevonden</p>
    </div>
  );

  const openEdit = () => {
    setEditForm({
      name: athlete.name,
      birth_date: athlete.birth_date || '',
      sport: athlete.sport || '',
      notes: athlete.notes || '',
    });
    setEditOpen(true);
  };

  const latestTest = tests[0];
  const latestResults = getStoredResults(latestTest?.results_json);
  const lastTestDate = latestTest?.test_date;

  const latestLt1Speed = latestResults?.lt1?.best ?? latestResults?.lt1Speed ?? null;
  const latestLt2Speed = latestResults?.lt2?.best ?? latestResults?.lt2Speed ?? null;
  const latestLt1 = latestLt1Speed != null ? formatPace(latestLt1Speed) : null;
  const latestLt2 = latestLt2Speed != null ? formatPace(latestLt2Speed) : null;

  const editButton = (
    <button
      onClick={openEdit}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
        height: '30px',
      }}
    >
      <Pencil size={11} />Bewerken
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#09090d' }}>
      <AppNav
        backTo="/dashboard"
        backLabel="Alle atleten"
        title={athlete.name}
        rightContent={editButton}
      />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* Profile header */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
            background: 'rgba(102,68,255,0.15)',
            border: '1px solid rgba(102,68,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 800, color: '#a090ff',
            letterSpacing: '-0.5px',
          }}>
            {getInitials(athlete.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {athlete.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {athlete.sport && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                  <Activity size={12} />{athlete.sport}
                </span>
              )}
              {athlete.birth_date && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                  <Calendar size={12} />{athlete.birth_date}
                </span>
              )}
            </div>
            {athlete.notes && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {athlete.notes}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {/* Total tests */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>Totaal tests</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>{tests.length}</p>
          </div>
          {/* Last test */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>Laatste test</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: lastTestDate ? '#fff' : 'rgba(255,255,255,0.2)' }}>
              {lastTestDate || '—'}
            </p>
          </div>
        </div>

        {/* Threshold cards — only if we have data */}
        {(latestLt1 || latestLt2) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              background: 'rgba(0,229,122,0.05)',
              border: '1px solid rgba(0,229,122,0.2)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#00e57a', marginBottom: '8px', opacity: 0.8 }}>T2mmol</p>
              {latestLt1 ? (
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#00e57a', lineHeight: 1, letterSpacing: '-0.5px' }}>{latestLt1}<span style={{ fontSize: '13px', fontWeight: 500, opacity: 0.6 }}> /km</span></p>
              ) : (
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>—</p>
              )}
            </div>
            <div style={{
              background: 'rgba(255,107,43,0.05)',
              border: '1px solid rgba(255,107,43,0.2)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#ff6b2b', marginBottom: '8px', opacity: 0.8 }}>T4mmol</p>
              {latestLt2 ? (
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#ff6b2b', lineHeight: 1, letterSpacing: '-0.5px' }}>{latestLt2}<span style={{ fontSize: '13px', fontWeight: 500, opacity: 0.6 }}> /km</span></p>
              ) : (
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>—</p>
              )}
            </div>
          </div>
        )}

        {/* Evolution placeholder */}
        {tests.length === 1 && (
          <div style={{
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            <BarChart3 size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Voeg meer tests toe om de evolutie van drempels te zien.</p>
          </div>
        )}

        {/* Test history header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>Testhistoriek</h2>
          <button
            onClick={() => navigate(`/athlete/${id}/test`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: 'linear-gradient(135deg, #6644ff, #8866ff)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />Nieuwe test
          </button>
        </div>

        {/* Empty tests */}
        {tests.length === 0 ? (
          <div style={{
            border: '2px dashed rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <TrendingUp size={32} style={{ color: 'rgba(255,255,255,0.12)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Nog geen tests uitgevoerd.</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto' }}>
              Start een nieuwe lactaattest om drempels, zones en evolutie zichtbaar te maken.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tests.map(t => {
              const r = getStoredResults(t.results_json);
              const steps = Array.isArray(t.steps_json) ? t.steps_json : [];
              const rowLt1Speed = r?.lt1?.best ?? r?.lt1Speed ?? null;
              const rowLt2Speed = r?.lt2?.best ?? r?.lt2Speed ?? null;
              const hasResults = rowLt1Speed != null || rowLt2Speed != null;

              return (
                <button
                  key={t.id}
                  onClick={() => navigate(`/athlete/${id}/test/${t.id}`)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Date badge */}
                  <div style={{
                    background: 'rgba(102,68,255,0.1)',
                    border: '1px solid rgba(102,68,255,0.2)',
                    borderRadius: '10px',
                    padding: '6px 10px',
                    flexShrink: 0,
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#6644ff', margin: 0 }}>
                      {t.test_date?.split('-').slice(1).join('/')}
                    </p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                      {t.test_date?.split('-')[0]}
                    </p>
                  </div>

                  {/* Thresholds */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {hasResults ? (
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {rowLt1Speed != null && (
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#00e57a' }}>
                            T2: {formatPace(rowLt1Speed)} /km
                          </span>
                        )}
                        {rowLt2Speed != null && (
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ff6b2b' }}>
                            T4: {formatPace(rowLt2Speed)} /km
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Geen resultaten</span>
                    )}
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '3px' }}>
                      {steps.length} stappen
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm('Test verwijderen?')) deleteTest.mutate(t.id); }}
                      style={{
                        width: '28px', height: '28px', borderRadius: '7px',
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        color: 'rgba(239,68,68,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
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
