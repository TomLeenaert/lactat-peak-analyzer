import { ArrowLeft, CheckCircle2, FlaskConical, LineChart, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DemoSnapshot from '@/components/DemoSnapshot';
import ResultsTab from '@/components/ResultsTab';
import ZonesTab from '@/components/ZonesTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEMO_ATHLETE, DEMO_RESULTS, DEMO_STEPS } from '@/lib/demo-data';

const proofPoints = [
  'Volledige lactaatcurve met drempelvisualisatie',
  'LT1, LT2 en trainingszones uit dezelfde berekening',
  'Een voorbeeldflow die je in een gesprek of demo meteen kunt tonen',
];

const Demo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Terug naar landing
          </Button>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            Probeer met account
            <FlaskConical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <LineChart className="h-4 w-4" />
              Publieke demo zonder login
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Zo ziet de output eruit als je iemand wilt overtuigen.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Deze demo gebruikt echte voorbeelddata en dezelfde berekening als de app. Je toont dus geen dode marketingmock-up,
                maar de echte curve, drempels en zones die een coach of sporter later ook krijgt.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Atleet</p>
                  <p className="mt-2 font-semibold">{DEMO_ATHLETE.name}</p>
                  <p className="text-sm text-muted-foreground">{DEMO_ATHLETE.sport}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Test</p>
                  <p className="mt-2 font-semibold">{DEMO_STEPS.length} stappen</p>
                  <p className="text-sm text-muted-foreground">Inclusief hartslag en watt</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Gebruik</p>
                  <p className="mt-2 font-semibold">Coachgesprek</p>
                  <p className="text-sm text-muted-foreground">Direct inzetbaar tijdens sales of intake</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Waarom deze demo werkt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{point}</p>
                </div>
              ))}
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Gebruik deze pagina als walkthrough in een verkoopgesprek, of laat bezoekers hier eerst de output zien voor ze een account maken.
              </div>
            </CardContent>
          </Card>
        </section>

        <DemoSnapshot />

        <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <ResultsTab results={DEMO_RESULTS} />
          <ZonesTab results={DEMO_RESULTS} />
        </section>
      </main>
    </div>
  );
};

export default Demo;