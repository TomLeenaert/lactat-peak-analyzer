import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type CalculationResults, formatPace, interpolateHR } from '@/lib/lactate-math';
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

  const { speeds, hrs, lt1, lt2 } = results;
  if (!lt1 || !lt2) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground py-12">
          <p>Geen berekende resultaten beschikbaar. Ga naar het Data-tabblad en klik op "Berekenen".</p>
        </CardContent>
      </Card>
    );
  }
  const validHR = speeds.map((s, i) => ({ speed: s, hr: hrs[i] })).filter(d => d.hr > 0);
  const hrMin = validHR.length > 0 ? Math.floor(Math.min(...validHR.map(d => d.hr)) / 10) * 10 - 10 : 100;
  const hrMax = validHR.length > 0 ? Math.ceil(Math.max(...validHR.map(d => d.hr)) / 10) * 10 + 10 : 200;
  const xMin = validHR.length > 0 ? validHR[0].speed - 0.5 : 8;
  const xMax = validHR.length > 0 ? validHR[validHR.length - 1].speed + 0.5 : 18;

  return (
    <div className="space-y-4">
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
