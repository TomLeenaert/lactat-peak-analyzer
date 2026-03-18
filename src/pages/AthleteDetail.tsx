import { useState } from 'react';
import { formatPace } from '@/lib/lactate-math';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Calendar, Activity, TrendingUp, BarChart3 } from 'lucide-react';

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

  // Derive summary stats from tests
  const latestTest = tests[0];
  const latestResults = getStoredResults(latestTest?.results_json);
  const lastTestDate = latestTest?.test_date;

  // Get latest valid LT values
  const latestLt1Speed = latestResults?.lt1?.best ?? latestResults?.lt1Speed ?? null;
  const latestLt2Speed = latestResults?.lt2?.best ?? latestResults?.lt2Speed ?? null;
  const latestLt1 = latestLt1Speed != null ? formatPace(latestLt1Speed) : null;
  const latestLt2 = latestLt2Speed != null ? formatPace(latestLt2Speed) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Alle atleten</span>
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-2" />Bewerken
          </Button>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 py-6 space-y-6">
        {/* Profile header card */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary">
                  {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{athlete.name}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                  {athlete.sport && (
                    <span className="flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" />
                      {athlete.sport}
                    </span>
                  )}
                  {athlete.birth_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {athlete.birth_date}
                    </span>
                  )}
                </div>
                {athlete.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{athlete.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Totaal tests</p>
              <p className="text-2xl font-bold">{tests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Laatste test</p>
              <p className="text-sm font-semibold">{lastTestDate || <span className="text-muted-foreground font-normal">—</span>}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">T2mmol</p>
              {latestLt1 ? (
                <p className="text-sm font-semibold text-green-600">{latestLt1} /km</p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Niet berekend</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">T4mmol</p>
              {latestLt2 ? (
                <p className="text-sm font-semibold text-orange-600">{latestLt2} /km</p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Niet berekend</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evolution placeholder */}
        {tests.length === 1 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Voeg meer testen toe om de evolutie van drempels te zien.</p>
            </CardContent>
          </Card>
        )}

        {/* Test history */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Testhistoriek</h2>
          <Button onClick={() => navigate(`/athlete/${id}/test`)}>
            <Plus className="h-4 w-4 mr-2" />Nieuwe test
          </Button>
        </div>

        {tests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-lg font-semibold text-foreground mb-1">Nog geen tests uitgevoerd.</p>
              <p className="text-sm text-muted-foreground/70">Start een nieuwe lactaattest om drempels, zones en evolutie zichtbaar te maken.</p>
              <div className="mx-auto mt-5 max-w-md rounded-2xl border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground">
                Na de eerste test kun je hier meteen tempozones, lactaatcurve en vergelijkingen over meerdere testmomenten tonen.
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>T2mmol</TableHead>
                    <TableHead>T4mmol</TableHead>
                    <TableHead>Stappen</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map(t => {
                    const r = getStoredResults(t.results_json);
                    const steps = Array.isArray(t.steps_json) ? t.steps_json : [];
                    const rowLt1Speed = r?.lt1?.best ?? r?.lt1Speed ?? null;
                    const rowLt2Speed = r?.lt2?.best ?? r?.lt2Speed ?? null;
                    return (
                      <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/athlete/${id}/test/${t.id}`)}>
                        <TableCell className="font-medium">{t.test_date}</TableCell>
                        <TableCell>
                          {rowLt1Speed != null
                            ? <span className="text-green-600 font-medium">{formatPace(rowLt1Speed)} /km</span>
                            : <span className="text-muted-foreground/40 italic text-sm">—</span>
                          }
                        </TableCell>
                        <TableCell>
                          {rowLt2Speed != null
                            ? <span className="text-orange-600 font-medium">{formatPace(rowLt2Speed)} /km</span>
                            : <span className="text-muted-foreground/40 italic text-sm">—</span>
                          }
                        </TableCell>
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
