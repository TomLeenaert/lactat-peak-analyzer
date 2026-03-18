import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LactateChart from '@/components/LactateChart';
import { DEMO_ATHLETE, DEMO_RESULTS } from '@/lib/demo-data';
import { formatPace, getZones, interpolateHR } from '@/lib/lactate-math';

const metricCards = [
  {
    label: 'Aerobe drempel',
    value: `${formatPace(DEMO_RESULTS.lt1.best)} /km`,
    detail: `~${interpolateHR(DEMO_RESULTS.lt1.best, DEMO_RESULTS.speeds, DEMO_RESULTS.hrs)} bpm`,
  },
  {
    label: 'Anaerobe drempel',
    value: `${formatPace(DEMO_RESULTS.lt2.best)} /km`,
    detail: `~${interpolateHR(DEMO_RESULTS.lt2.best, DEMO_RESULTS.speeds, DEMO_RESULTS.hrs)} bpm`,
  },
  {
    label: 'Model fit',
    value: `R² ${DEMO_RESULTS.r2.toFixed(3)}`,
    detail: 'Sterke fit op de lactaatcurve',
  },
];

const demoZones = getZones(DEMO_RESULTS);

const DemoSnapshot = () => {
  return (
    <Card className="border-border/60 bg-card/80 shadow-xl shadow-primary/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Voorbeeldanalyse</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {DEMO_ATHLETE.name} · {DEMO_ATHLETE.sport} · Test op {DEMO_ATHLETE.testDate}
            </p>
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Klaar om te tonen aan coaches en atleten
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border/60 bg-background/75 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/75 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Zone-overzicht</p>
            <p className="text-xs text-muted-foreground">Van herstel tot VO2max</p>
          </div>
          <div className="flex h-8 w-full overflow-hidden rounded-lg border border-border/50">
            {demoZones.map((zone) => (
              <div
                key={zone.name}
                className="flex items-center justify-center text-[10px] font-semibold text-white"
                style={{ background: zone.color, width: `${Math.max(((zone.to - zone.from) / (demoZones[demoZones.length - 1].to - demoZones[0].from)) * 100, 5)}%` }}
              >
                {zone.name.replace('Zone ', 'Z')}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/75 p-3 sm:p-5">
          <LactateChart results={DEMO_RESULTS} />
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoSnapshot;