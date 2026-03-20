import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type CalculationResults, getZones, polyEval, formatPace, interpolateHR, interpolateWatt } from '@/lib/lactate-math';
import LactateChart from './LactateChart';

interface ResultsTabProps {
  results: CalculationResults | null;
}

const ResultsTab = ({ results }: ResultsTabProps) => {
  if (!results) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground py-12">
          <p>Voer eerst testgegevens in en klik op "Berekenen".</p>
        </CardContent>
      </Card>
    );
  }

  const { lt1, lt2, speeds, hrs, watts, coeffs } = results;
  if (!coeffs || !Array.isArray(coeffs)) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground py-12">
          <p>Geen berekende resultaten beschikbaar. Ga naar het Data-tabblad en klik op "Berekenen".</p>
        </CardContent>
      </Card>
    );
  }

  const zones = getZones(results);
  const hasWatts = watts.some(w => w > 0);
  const totalRange = zones[zones.length - 1].to - zones[0].from;

  return (
    <div className="space-y-4">

      {/* Lactaatcurve */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Lactaatcurve</CardTitle></CardHeader>
        <CardContent>
          <LactateChart results={results} />
        </CardContent>
      </Card>

      {/* LT1 + LT2 samenvatting */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-600 mb-1">Aerobe drempel</p>
          <p className="text-2xl font-bold">{formatPace(lt1.best)} /km</p>
          <p className="text-xs text-muted-foreground mt-1">
            ~{interpolateHR(lt1.best, speeds, hrs)} bpm · {polyEval(coeffs, lt1.best).toFixed(1)} mmol/L
          </p>
        </div>
        <div className="rounded-xl border border-orange-500/25 bg-orange-500/8 p-4">
          <p className="text-xs uppercase tracking-wider text-orange-600 mb-1">Anaerobe drempel</p>
          <p className="text-2xl font-bold">{formatPace(lt2.best)} /km</p>
          <p className="text-xs text-muted-foreground mt-1">
            ~{interpolateHR(lt2.best, speeds, hrs)} bpm · {polyEval(coeffs, lt2.best).toFixed(1)} mmol/L
          </p>
        </div>
      </div>

      {/* Zone bar */}
      <div className="flex rounded-xl overflow-hidden h-8 border border-border/60 shadow-inner">
        {zones.map(z => {
          const width = Math.max(((z.to - z.from) / totalRange) * 100, 5);
          return (
            <div
              key={z.name}
              className="flex items-center justify-center text-[10px] font-bold text-white"
              style={{ width: `${width}%`, background: z.color, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            >
              {z.name.replace('Zone ', 'Z')}
            </div>
          );
        })}
      </div>

      {/* Zones — verticaal, één per rij */}
      <div className="space-y-2">
        {zones.map(z => {
          const hrFrom = interpolateHR(z.from, speeds, hrs);
          const hrTo   = interpolateHR(Math.min(z.to, speeds[speeds.length - 1]), speeds, hrs);
          const wFrom  = hasWatts ? interpolateWatt(z.from, speeds, watts) : 0;
          const wTo    = hasWatts ? interpolateWatt(Math.min(z.to, speeds[speeds.length - 1]), speeds, watts) : 0;
          const lacFrom = Math.max(0, polyEval(coeffs, Math.max(z.from, speeds[0]))).toFixed(1);
          const lacTo   = Math.max(0, polyEval(coeffs, Math.min(z.to, speeds[speeds.length - 1]))).toFixed(1);
          return (
            <div
              key={z.name}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
              style={{ borderLeft: `4px solid ${z.color}` }}
            >
              {/* Zone naam + label */}
              <div className="w-28 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: z.color }} />
                  <span className="font-bold text-sm">{z.name}</span>
                </div>
                <span className="text-[11px] text-muted-foreground ml-4">{z.label}</span>
              </div>

              {/* Beschrijving */}
              <p className="text-xs text-muted-foreground hidden sm:block flex-1">{z.desc}</p>

              {/* Waarden */}
              <div className="ml-auto text-right shrink-0 space-y-0.5">
                <p className="text-xs font-mono font-semibold">{formatPace(z.to)} – {formatPace(z.from)} /km</p>
                {hrFrom > 0 && <p className="text-xs text-muted-foreground font-mono">{hrFrom} – {hrTo} bpm</p>}
                {hasWatts && <p className="text-xs text-muted-foreground font-mono">{wFrom} – {wTo} W</p>}
                <p className="text-xs text-muted-foreground font-mono">{lacFrom} – {lacTo} mmol/L</p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ResultsTab;
