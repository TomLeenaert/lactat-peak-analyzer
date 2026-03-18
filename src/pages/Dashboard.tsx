import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, LogOut, Users, Trash2 } from 'lucide-react';

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden.';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAthlete, setNewAthlete] = useState({ name: '', birth_date: '', sport: '', notes: '' });

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch athletes with test count
  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*, test_results(id)')
        .eq('user_id', user!.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update club name
  const updateClubName = useMutation({
    mutationFn: async (club_name: string) => {
      const { error } = await supabase.from('profiles').update({ club_name }).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  // Add athlete
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

  // Delete athlete
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            {editingClub ? (
              <form onSubmit={e => { e.preventDefault(); updateClubName.mutate(clubNameInput); setEditingClub(false); }} className="flex gap-2">
                <Input value={clubNameInput} onChange={e => setClubNameInput(e.target.value)} className="h-8 w-48" placeholder="Clubnaam" />
                <Button type="submit" size="sm" variant="outline">Opslaan</Button>
              </form>
            ) : (
              <h1
                className="text-lg font-semibold cursor-pointer hover:text-primary"
                onClick={() => { setClubNameInput(profile?.club_name || ''); setEditingClub(true); }}
                title="Klik om clubnaam te wijzigen"
              >
                {profile?.club_name || 'Mijn Club'}
              </h1>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate('/auth'))}>
            <LogOut className="h-4 w-4 mr-2" />Uitloggen
          </Button>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Atleten</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Atleet toevoegen</Button>
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

        {isLoading ? (
          <p className="text-muted-foreground">Laden...</p>
        ) : athletes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">Nog geen atleten.</p>
              <p className="mt-2 text-muted-foreground">Voeg je eerste atleet toe en bouw vanaf daar je testhistoriek op.</p>
              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-dashed border-border p-4 text-left">
                <p className="text-sm font-medium text-foreground">Start hier</p>
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>1. Voeg een atleet toe met naam, sport en optionele notities.</li>
                  <li>2. Open de atleet en start een nieuwe lactaattest.</li>
                  <li>3. Bewaar de resultaten om evolutie doorheen het seizoen te tonen.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead className="text-center">Tests</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {athletes.map(a => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/athlete/${a.id}`)}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{a.sport || '—'}</TableCell>
                      <TableCell className="text-center">{a.test_results?.length ?? 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={e => { e.stopPropagation(); if (confirm('Atleet verwijderen?')) deleteAthlete.mutate(a.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
