import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Trash2, ChevronRight, Activity, Calendar } from 'lucide-react';
import AppNav from '@/components/AppNav';

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden.';

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const SPORT_COLORS: Record<string, string> = {
  lopen: '#6644ff',
  running: '#6644ff',
  fietsen: '#00e57a',
  cycling: '#00e57a',
  triathlon: '#ff6b2b',
  zwemmen: '#00c9a7',
  swimming: '#00c9a7',
  roeien: '#ffb800',
  rowing: '#ffb800',
};

const getSportColor = (sport?: string | null): string => {
  if (!sport) return '#6644ff';
  const key = sport.toLowerCase();
  return SPORT_COLORS[key] || '#6644ff';
};

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
        .select('*, test_results(id, test_date)')
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
    <form onSubmit={e => { e.preventDefault(); updateClubName.mutate(clubNameInput); setEditingClub(false); }} className="flex gap-2">
      <Input value={clubNameInput} onChange={e => setClubNameInput(e.target.value)} className="h-7 w-36 text-sm" placeholder="Clubnaam" />
      <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">Opslaan</Button>
    </form>
  ) : (
    <button
      onClick={() => { setClubNameInput(profile?.club_name || ''); setEditingClub(true); }}
      title="Klik om clubnaam te wijzigen"
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.38)', fontSize: '12px', padding: '4px 8px' }}
    >
      <Users size={13} style={{ display: 'inline', marginRight: '5px' }} />
      {profile?.club_name || 'Mijn Club'}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNav rightContent={navRight} />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
              Atleten
            </h2>
            {athletes.length > 0 && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                {athletes.length} {athletes.length === 1 ? 'atleet' : 'atleten'}
              </p>
            )}
          </div>

          {/* Desktop add button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="hidden sm:flex"
                style={{ background: 'linear-gradient(135deg, #6644ff, #8866ff)', border: 'none' }}
              >
                <Plus className="h-4 w-4 mr-2" />Atleet toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe atleet</DialogTitle>
                <DialogDescription>Vul de gegevens in van de atleet.</DialogDescription>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addAthlete.mutate(newAthlete); }} className="space-y-4">
                <Input placeholder="Naam *" value={newAthlete.name} onChange={e => setNewAthlete(p => ({ ...p, name: e.target.value }))} required />
                <Input type="date" placeholder="Geboortedatum" value={newAthlete.birth_date} onChange={e => setNewAthlete(p => ({ ...p, birth_date: e.target.value }))} />
                <Input placeholder="Sport" value={newAthlete.sport} onChange={e => setNewAthlete(p => ({ ...p, sport: e.target.value }))} />
                <Input placeholder="Notities" value={newAthlete.notes} onChange={e => setNewAthlete(p => ({ ...p, notes: e.target.value }))} />
                <Button type="submit" className="w-full" disabled={addAthlete.isPending}>
                  {addAthlete.isPending ? 'Bezig...' : 'Toevoegen'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '80px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && athletes.length === 0 && (
          <div style={{
            border: '2px dashed rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '56px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(102,68,255,0.1)', border: '1px solid rgba(102,68,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Users size={24} style={{ color: '#6644ff' }} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Nog geen atleten
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Voeg je eerste atleet toe en bouw de testhistoriek op doorheen het seizoen.
            </p>
            <div style={{
              maxWidth: '340px', margin: '0 auto 28px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left',
            }}>
              {['Voeg een atleet toe met naam en sport.', 'Start een lactaattest op het veld.', 'Bekijk drempels, zones en evolutie.'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: i < 2 ? '12px' : 0 }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(102,68,255,0.2)', border: '1px solid rgba(102,68,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: '#a090ff',
                  }}>{i + 1}</div>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #6644ff, #8866ff)',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontSize: '15px', fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                  Eerste atleet toevoegen
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe atleet</DialogTitle>
                  <DialogDescription>Vul de gegevens in van de atleet.</DialogDescription>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); addAthlete.mutate(newAthlete); }} className="space-y-4">
                  <Input placeholder="Naam *" value={newAthlete.name} onChange={e => setNewAthlete(p => ({ ...p, name: e.target.value }))} required />
                  <Input type="date" placeholder="Geboortedatum" value={newAthlete.birth_date} onChange={e => setNewAthlete(p => ({ ...p, birth_date: e.target.value }))} />
                  <Input placeholder="Sport" value={newAthlete.sport} onChange={e => setNewAthlete(p => ({ ...p, sport: e.target.value }))} />
                  <Input placeholder="Notities" value={newAthlete.notes} onChange={e => setNewAthlete(p => ({ ...p, notes: e.target.value }))} />
                  <Button type="submit" className="w-full" disabled={addAthlete.isPending}>
                    {addAthlete.isPending ? 'Bezig...' : 'Toevoegen'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Athlete cards */}
        {!isLoading && athletes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {athletes.map(a => {
              const testCount = a.test_results?.length ?? 0;
              const lastTest = a.test_results
                ?.map((t: any) => t.test_date)
                .filter(Boolean)
                .sort()
                .reverse()[0];
              const sportColor = getSportColor(a.sport);

              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/athlete/${a.id}`)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onPointerEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${sportColor}40`;
                    (e.currentTarget as HTMLButtonElement).style.background = `${sportColor}08`;
                  }}
                  onPointerLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: `${sportColor}18`,
                    border: `1px solid ${sportColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 800, color: sportColor,
                    letterSpacing: '-0.5px',
                  }}>
                    {getInitials(a.name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {a.sport && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                          <Activity size={11} />
                          {a.sport}
                        </span>
                      )}
                      {lastTest && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                          <Calendar size={11} />
                          {lastTest}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: test count + arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {testCount > 0 && (
                      <div style={{
                        background: `${sportColor}18`,
                        border: `1px solid ${sportColor}30`,
                        borderRadius: '8px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: sportColor,
                      }}>
                        {testCount} {testCount === 1 ? 'test' : 'tests'}
                      </div>
                    )}
                    <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />

                    {/* Delete */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Atleet verwijderen?')) deleteAthlete.mutate(a.id);
                      }}
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        color: 'rgba(239,68,68,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <div className="sm:hidden">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button style={{
              position: 'fixed',
              bottom: '88px',  /* above BottomNav if present, otherwise just above nav safe area */
              right: '20px',
              width: '56px', height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6644ff, #8866ff)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(102,68,255,0.5)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 40,
              WebkitTapHighlightColor: 'transparent',
            }}>
              <Plus size={24} style={{ color: '#fff' }} />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe atleet</DialogTitle>
              <DialogDescription>Vul de gegevens in van de atleet.</DialogDescription>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); addAthlete.mutate(newAthlete); }} className="space-y-4">
              <Input placeholder="Naam *" value={newAthlete.name} onChange={e => setNewAthlete(p => ({ ...p, name: e.target.value }))} required />
              <Input type="date" placeholder="Geboortedatum" value={newAthlete.birth_date} onChange={e => setNewAthlete(p => ({ ...p, birth_date: e.target.value }))} />
              <Input placeholder="Sport" value={newAthlete.sport} onChange={e => setNewAthlete(p => ({ ...p, sport: e.target.value }))} />
              <Input placeholder="Notities" value={newAthlete.notes} onChange={e => setNewAthlete(p => ({ ...p, notes: e.target.value }))} />
              <Button type="submit" className="w-full" disabled={addAthlete.isPending}>
                {addAthlete.isPending ? 'Bezig...' : 'Toevoegen'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
