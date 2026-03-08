import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type CalculationResults, getZones, polyEval, formatPace, interpolateHR } from '@/lib/lactate-math';
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

  const zones = getZones(results);
  const { speeds, hrs, lt1, lt2, coeffs } = results;
  const totalRange = zones[zones.length - 1].to - zones[0].from;

  // HR chart data
  const validHR = speeds.map((s, i) => ({ speed: s, hr: hrs[i] })).filter(d => d.hr > 0);
  const hrMin = validHR.length > 0 ? Math.floor(Math.min(...validHR.map(d => d.hr)) / 10) * 10 - 10 : 100;
  const hrMax = validHR.length > 0 ? Math.ceil(Math.max(...validHR.map(d => d.hr)) / 10) * 10 + 10 : 200;
  const xMin = validHR.length > 0 ? validHR[0].speed - 0.5 : 8;
  const xMax = validHR.length > 0 ? validHR[validHR.length - 1].speed + 0.5 : 18;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Trainingszones (5-zone model)</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-accent/10 border border-primary/20 rounded-lg p-4 mb-4 text-sm leading-relaxed">
            Zones gebaseerd op je individuele LT1 en LT2 waarden (Seiler, 2010; Kindermann, 1979). De snelheden en hartslagen zijn interpolaties uit je testdata.
          </div>

          {/* Zone bar */}
          <div className="flex rounded-md overflow-hidden h-8 mb-4">
            {zones.map(z => {
              const width = Math.max(((z.to - z.from) / totalRange) * 100, 5);
              return (
                <div
                  key={z.name}
                  className="flex items-center justify-center text-xs font-semibold text-white"
                  style={{ width: `${width}%`, background: z.color, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {z.name}
                </div>
              );
            })}
          </div>

          {/* Zone table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Hartslag</TableHead>
                <TableHead>Lactaat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map(z => {
                const hrFrom = interpolateHR(z.from, speeds, hrs);
                const hrTo = interpolateHR(Math.min(z.to, speeds[speeds.length - 1]), speeds, hrs);
                const lacFrom = Math.max(0, polyEval(coeffs, Math.max(z.from, speeds[0]))).toFixed(1);
                const lacTo = Math.max(0, polyEval(coeffs, Math.min(z.to, speeds[speeds.length - 1]))).toFixed(1);
                return (
                  <TableRow key={z.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: z.color }} />
                        <div>
                          <strong>{z.name}</strong>
                          <div className="text-muted-foreground text-xs">{z.label}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{z.desc}</TableCell>
                    <TableCell className="font-mono">{formatPace(z.to)} – {formatPace(z.from)} /km</TableCell>
                    <TableCell className="font-mono">{hrFrom} – {hrTo} bpm</TableCell>
                    <TableCell className="font-mono">{lacFrom} – {lacTo}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {validHR.length >= 2 && (
        <Card>
          <CardHeader><CardTitle>Hartslag vs Snelheid</CardTitle></CardHeader>
          <CardContent>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={validHR} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="speed" type="number" domain={[xMin, xMax]} tickFormatter={(v: number) => formatPace(v)}>
                    <Label value="Tempo (min/km)" position="bottom" offset={20} className="fill-muted-foreground text-xs" />
                  </XAxis>
                  <YAxis domain={[hrMin, hrMax]}>
                    <Label value="Hartslag (bpm)" angle={-90} position="insideLeft" offset={0} className="fill-muted-foreground text-xs" />
                  </YAxis>
                  <Tooltip labelFormatter={(v: number) => `${formatPace(v)} /km`} formatter={(v: number) => [`${v} bpm`]} />

                  {lt1.best >= xMin && lt1.best <= xMax && (
                    <ReferenceLine x={parseFloat(lt1.best.toFixed(1))} stroke="#34d399" strokeDasharray="6 4" label={{ value: 'LT1', position: 'top', className: 'fill-green-400 text-[11px] font-bold' }} />
                  )}
                  {lt2.best >= xMin && lt2.best <= xMax && (
                    <ReferenceLine x={parseFloat(lt2.best.toFixed(1))} stroke="#f97316" strokeDasharray="6 4" label={{ value: 'LT2', position: 'top', className: 'fill-orange-500 text-[11px] font-bold' }} />
                  )}

                  <Line dataKey="hr" type="monotone" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                  <Scatter dataKey="hr" fill="#ef4444" stroke="hsl(var(--card))" strokeWidth={2} r={5} />
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
