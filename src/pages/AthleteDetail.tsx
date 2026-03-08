import { useState } from 'react';
import { formatPace } from '@/lib/lactate-math';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import type { CalculationResults } from '@/lib/lactate-math';

const AthleteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', birth_date: '', sport: '', notes: '' });
  const [viewingTest, setViewingTest] = useState<any>(null);

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

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Laden...</p></div>;
  if (!athlete) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Atleet niet gevonden</p></div>;

  const openEdit = () => {
    setEditForm({
      name: athlete.name,
      birth_date: athlete.birth_date || '',
      sport: athlete.sport || '',
      notes: athlete.notes || '',
    });
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{athlete.name}</h1>
            <p className="text-sm text-muted-foreground">{athlete.sport || 'Geen sport'}{athlete.birth_date ? ` · ${athlete.birth_date}` : ''}</p>
          </div>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-2" />Bewerken
          </Button>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 py-6">
        {athlete.notes && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">{athlete.notes}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Testhistoriek</h2>
          <Button onClick={() => navigate(`/athlete/${id}/test`)}>
            <Plus className="h-4 w-4 mr-2" />Nieuwe test
          </Button>
        </div>

        {tests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nog geen tests. Start een nieuwe test!</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>LT1</TableHead>
                    <TableHead>LT2</TableHead>
                    <TableHead>Stappen</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map(t => {
                    const r = t.results_json as any;
                    const steps = t.steps_json as any[];
                    return (
                      <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/athlete/${id}/test/${t.id}`)}>
                        <TableCell>{t.test_date}</TableCell>
                        <TableCell>{r?.lt1Speed != null ? `${formatPace(r.lt1Speed)} /km` : '—'}</TableCell>
                        <TableCell>{r?.lt2Speed != null ? `${formatPace(r.lt2Speed)} /km` : '—'}</TableCell>
                        <TableCell>{steps?.length ?? '—'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => { e.stopPropagation(); if (confirm('Test verwijderen?')) deleteTest.mutate(t.id); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
