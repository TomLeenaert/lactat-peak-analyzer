import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AppNav from '@/components/AppNav';
import logoSrc from '@/assets/screen.png';

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden.';

const getSportInitial = (sport?: string | null) => (sport ?? 'L').charAt(0).toUpperCase();

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAthlete, setNewAthlete] = useState({ name: '', birth_date: '', sport: '', notes: '' });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*, test_results(id, test_date, results_json)')
        .eq('user_id', user!.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateClubName = useMutation({
    mutationFn: async (club_name: string) => {
      const { error } = await supabase.from('profiles').update({ club_name }).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  const addAthlete = useMutation({
    mutationFn: async (athlete: typeof newAthlete) => {
      const { error } = await supabase.from('athletes').insert({
        user_id: user!.id,
        name: athlete.name,
        birth_date: athlete.birth_date || null,
        sport: athlete.sport || null,
        notes: athlete.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      setDialogOpen(false);
      setNewAthlete({ name: '', birth_date: '', sport: '', notes: '' });
      toast({ title: 'Atleet toegevoegd' });
    },
    onError: (err: unknown) => toast({ title: 'Fout', description: getErrorMessage(err), variant: 'destructive' }),
  });

  const deleteAthlete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('athletes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      toast({ title: 'Atleet verwijderd' });
    },
  });

  const [editingClub, setEditingClub] = useState(false);
  const [clubNameInput, setClubNameInput] = useState('');

  const navRight = editingClub ? (
    <form onSubmit={e => { e.preventDefault(); updateClubName.mutate(clubNameInput); setEditingClub(false); }} style={{ display: 'flex', gap: '8px' }}>
      <Input value={clubNameInput} onChange={e => setClubNameInput(e.target.value)} style={{ height: '28px', width: '140px', fontSize: '13px' }} placeholder="Clubnaam" />
      <Button type="submit" size="sm" variant="outline" style={{ height: '28px', fontSize: '12px' }}>Opslaan</Button>
    </form>
  ) : (
    <button
      onClick={() => { setClubNameInput(profile?.club_name || ''); setEditingClub(true); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.38)', fontSize: '12px', padding: '4px 8px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}
    >
      {profile?.club_name || 'Mijn Club'}
    </button>
  );

  // Get last lactate from test results
  const getLastLactate = (testResults: { test_date?: string; results_json?: Record<string, unknown> }[]) => {
    if (!testResults?.length) return null;
    const sorted = [...testResults].sort((a, b) => (b.test_date || '').localeCompare(a.test_date || ''));
    const last = sorted[0];
    if (!last?.results_json) return null;
    const r = last.results_json as Record<string, Record<string, unknown>>;
    const lt2 = r?.lt2?.best ?? r?.lt2Speed ?? null;
    return lt2 ? (lt2 as number).toFixed(1) : null;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e' }}>
      <AppNav rightContent={navRight} />

      <main style={{ padding: '24px 24px 120px' }}>

        {/* Status + Title */}
        <section style={{ marginBottom: '24px' }}>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#00fdc1',
            display: 'block',
            marginBottom: '4px',
          }}>
            Status: Arctic High
          </span>
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '48px',
            fontWeight: 900,
            letterSpacing: '-2px',
            lineHeight: 1,
            color: '#fff',
            margin: '0 0 20px',
            textTransform: 'uppercase',
          }}>
            ATHLETES
          </h2>

          {/* Add button — gradient CTA */}
          <button
            onClick={() => setDialogOpen(true)}
            style={{
              width: '100%',
              height: '72px',
              background: 'linear-gradient(135deg, #8b4aff 0%, #bd9dff 100%)',
              border: 'none',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 28px',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(139,74,255,0.35)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: '#fff' }}>
              + Atleet toevoegen
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
        </section>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '20px' }}>
            <img
              src={logoSrc}
              alt=""
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'contain',
                mixBlendMode: 'lighten',
                opacity: 0.6,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '0.1em' }}>
              Laden...
            </span>
          </div>
        )}

        {/* Athlete bento cards */}
        {!isLoading && athletes.length > 0 && (
          <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '48px' }}>
            {athletes.map((a, idx) => {
              const testCount = a.test_results?.length ?? 0;
              const lastLactate = getLastLactate((a.test_results ?? []) as any);
              const isActive = idx === 0 && testCount > 0;
              const accentColor = isActive ? '#00fdc1' : '#bd9dff';
              const sportInitial = getSportInitial(a.sport);

              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/athlete/${a.id}`)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: '#201f1f',
                    border: 'none',
                    borderLeft: `4px solid ${accentColor}`,
                    borderRadius: '2px',
                    padding: '24px',
                    minHeight: '180px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Sport letter watermark */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '16px',
                    fontSize: '64px', opacity: 0.08, lineHeight: 1,
                    fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900,
                    color: accentColor,
                    pointerEvents: 'none',
                  }}>
                    {sportInitial}
                  </div>

                  {/* Top: status chip + name */}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      background: isActive ? '#006c50' : '#262626',
                      color: isActive ? '#dfffef' : '#adaaaa',
                      fontSize: '10px',
                      fontWeight: 900,
                      fontFamily: 'Space Grotesk, sans-serif',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '2px',
                      marginBottom: '8px',
                    }}>
                      {isActive ? 'Active Test' : 'Ready'}
                    </span>
                    <h3 style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '28px',
                      fontWeight: 900,
                      letterSpacing: '-0.5px',
                      color: '#fff',
                      margin: 0,
                      lineHeight: 1.1,
                      textTransform: 'uppercase',
                    }}>
                      {a.name.toUpperCase()}
                    </h3>
                  </div>

                  {/* Bottom: metric + arrow */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#777575', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: 'Space Grotesk, sans-serif' }}>
                        {lastLactate ? 'Laatste Lactaat' : (a.sport || 'Geen tests')}
                      </p>
                      {lastLactate ? (
                        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 900, color: accentColor, margin: 0, lineHeight: 1 }}>
                          {lastLactate} <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}>mmol/L</span>
                        </p>
                      ) : (
                        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                          {testCount} tests
                        </p>
                      )}
                    </div>
                    <span style={{ color: '#777575', fontSize: '20px', lineHeight: 1 }}>›</span>
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {/* Empty state — Systeem Klaarmaken */}
        {!isLoading && athletes.length === 0 && (
          <section style={{
            background: '#131313',
            padding: '40px 24px',
            marginTop: '24px',
            borderRadius: '2px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '80px', height: '80px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <img
                  src={logoSrc}
                  alt=""
                  style={{
                    width: '72px',
                    height: '72px',
                    objectFit: 'contain',
                    mixBlendMode: 'lighten',
                    filter: 'drop-shadow(0 4px 16px rgba(139,74,255,0.25))',
                    opacity: 0.7,
                  }}
                />
              </div>
              <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px', textTransform: 'uppercase', color: '#fff', margin: '0 0 8px' }}>
                Systeem Klaarmaken
              </h4>
              <p style={{ fontSize: '14px', color: '#adaaaa', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
                Geen actieve atleten gevonden. Volg de protocol stappen voor een zuivere meting.
              </p>
            </div>

            {[
              { n: '01', title: 'Voeg atleet toe', desc: 'Importeer profiel of maak een nieuwe coach-ID aan.' },
              { n: '02', title: 'Koppel Sensoren', desc: 'Zorg dat de Bluetooth analyzer is ingeschakeld.' },
              { n: '03', title: 'Start de Test', desc: 'De data-flow start automatisch na de eerste strip.', accent: true },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '36px', fontWeight: 900, color: '#777575', opacity: 0.4, lineHeight: 1, flexShrink: 0 }}>{step.n}</span>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px', color: step.accent ? '#00fdc1' : '#fff', margin: '0 0 4px' }}>{step.title}</p>
                  <p style={{ fontSize: '12px', color: '#adaaaa', margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Add athlete dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe atleet</DialogTitle>
            <DialogDescription>Voer de naam van de atleet in.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); addAthlete.mutate(newAthlete); }} className="space-y-4">
            <Input
              placeholder="Naam *"
              value={newAthlete.name}
              onChange={e => setNewAthlete(p => ({ ...p, name: e.target.value }))}
              required
              className="h-[52px] text-base"
              style={{ background: '#141414', color: '#ffffff', border: '2px solid #333' }}
            />
            <button
              type="submit"
              disabled={addAthlete.isPending}
              style={{
                width: '100%', height: '56px',
                background: 'linear-gradient(135deg, #8b4aff 0%, #bd9dff 100%)',
                border: 'none', borderRadius: '4px',
                color: '#fff', fontSize: '16px', fontWeight: 900,
                fontFamily: 'Space Grotesk, sans-serif',
                letterSpacing: '-0.3px', cursor: 'pointer',
              }}
            >
              {addAthlete.isPending ? 'Bezig...' : 'Toevoegen'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
