import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type CalculationResults, getZones, polyEval, formatPace, interpolateHR, interpolateWatt } from '@/lib/lactate-math';
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine,
  ResponsiveContainer, Tooltip, Label,
} from 'recharts';

interface ZonesTabProps {
  results: CalculationResults | null;
}

const ZonesTab = ({ results }: ZonesTabProps) => {
  if (!results) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground py-12">
          <p>Eerst berekenen om trainingszones te zien.</p>
        </CardContent>
      </Card>
    );
  }

  const { speeds, hrs, watts, lt1, lt2, coeffs } = results;
  if (!lt1 || !lt2 || !coeffs || !Array.isArray(coeffs)) {
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

  const validHR = speeds.map((s, i) => ({ speed: s, hr: hrs[i] })).filter(d => d.hr > 0);
  const hrMin = validHR.length > 0 ? Math.floor(Math.min(...validHR.map(d => d.hr)) / 10) * 10 - 10 : 100;
  const hrMax = validHR.length > 0 ? Math.ceil(Math.max(...validHR.map(d => d.hr)) / 10) * 10 + 10 : 200;
  const xMin = validHR.length > 0 ? validHR[0].speed - 0.5 : 8;
  const xMax = validHR.length > 0 ? validHR[validHR.length - 1].speed + 0.5 : 18;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Trainingszones (5-zone model)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-accent/10 p-4 mb-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">5-zone model</p>
            <p className="text-sm mt-1 text-foreground/90">Zones gebaseerd op je individuele LT1- en LT2-drempelwaarden.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-700">LT1 {formatPace(lt1.best)} /km</span>
              <span className="rounded-full bg-orange-500/10 px-3 py-1 font-semibold text-orange-700">LT2 {formatPace(lt2.best)} /km</span>
            </div>
          </div>

          {/* Zone bar */}
          <div className="flex rounded-xl overflow-hidden h-9 mb-5 border border-border/60 shadow-inner">
            {zones.map(z => {
              const width = Math.max(((z.to - z.from) / totalRange) * 100, 5);
              return (
                <div
                  key={z.name}
                  className="flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{ width: `${width}%`, background: z.color, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {z.name.replace('Zone ', 'Z')}
                </div>
              );
            })}
          </div>

          {/* Zone cards - mobile friendly */}
          <div className="grid gap-3 md:grid-cols-2">
            {zones.map(z => {
              const hrFrom = interpolateHR(z.from, speeds, hrs);
              const hrTo = interpolateHR(Math.min(z.to, speeds[speeds.length - 1]), speeds, hrs);
              const wattFrom = hasWatts ? interpolateWatt(z.from, speeds, watts) : 0;
              const wattTo = hasWatts ? interpolateWatt(Math.min(z.to, speeds[speeds.length - 1]), speeds, watts) : 0;
              const lacFrom = Math.max(0, polyEval(coeffs, Math.max(z.from, speeds[0]))).toFixed(1);
              const lacTo = Math.max(0, polyEval(coeffs, Math.min(z.to, speeds[speeds.length - 1]))).toFixed(1);
              return (
                <div key={z.name} className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: z.color }} />
                      <strong className="text-sm">{z.name}</strong>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{z.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{z.desc}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-muted-foreground">Tempo:</span> <span className="font-mono">{formatPace(z.to)}-{formatPace(z.from)}</span></div>
                    <div><span className="text-muted-foreground">HR:</span> <span className="font-mono">{hrFrom}-{hrTo}</span></div>
                    {hasWatts && <div><span className="text-muted-foreground">Watt:</span> <span className="font-mono">{wattFrom}-{wattTo}</span></div>}
                    <div><span className="text-muted-foreground">Lac:</span> <span className="font-mono">{lacFrom}-{lacTo}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {validHR.length >= 2 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Hartslag vs Tempo</CardTitle></CardHeader>
          <CardContent>
            <div className="w-full h-[280px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={validHR} margin={{ top: 10, right: 10, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="speed" type="number" domain={[xMin, xMax]} tickFormatter={(v: number) => formatPace(v)} tick={{ fontSize: 11 }}>
                    <Label value="Tempo (min/km)" position="bottom" offset={20} className="fill-muted-foreground text-xs" />
                  </XAxis>
                  <YAxis domain={[hrMin, hrMax]} tick={{ fontSize: 11 }}>
                    <Label value="HR (bpm)" angle={-90} position="insideLeft" offset={0} className="fill-muted-foreground text-xs" />
                  </YAxis>
                  <Tooltip labelFormatter={(v: number) => `${formatPace(v)} /km`} formatter={(v: number) => [`${v} bpm`]} />

                  {lt1.best >= xMin && lt1.best <= xMax && (
                    <ReferenceLine x={parseFloat(lt1.best.toFixed(1))} stroke="#34d399" strokeDasharray="6 4" label={{ value: 'LT1', position: 'top', className: 'fill-green-400 text-[11px] font-bold' }} />
                  )}
                  {lt2.best >= xMin && lt2.best <= xMax && (
                    <ReferenceLine x={parseFloat(lt2.best.toFixed(1))} stroke="#f97316" strokeDasharray="6 4" label={{ value: 'LT2', position: 'top', className: 'fill-orange-500 text-[11px] font-bold' }} />
                  )}

                  <Line dataKey="hr" type="monotone" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                  <Scatter dataKey="hr" fill="#ef4444" stroke="hsl(var(--card))" strokeWidth={2} r={4} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ZonesTab;
