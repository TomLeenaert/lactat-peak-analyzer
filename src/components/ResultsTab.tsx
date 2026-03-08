import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type CalculationResults, polyEval, formatPace, interpolateHR, interpolateWatt } from '@/lib/lactate-math';
import LactateChart from './LactateChart';

interface ResultsTabProps {
  results: CalculationResults | null;
}

const MethodTag = ({ type, children }: { type: 'obla' | 'dmax' | 'bsln'; children: React.ReactNode }) => {
  const colors = {
    obla: 'bg-primary/10 text-primary',
    dmax: 'bg-warning/15 text-warning',
    bsln: 'bg-green-500/10 text-green-600',
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-1 ${colors[type]}`}>{children}</span>;
};

const ResultBox = ({ variant, label, value, detail }: { variant: 'success' | 'warning' | 'info'; label: string; value: string; detail: string }) => {
  const colors = {
    success: 'bg-primary/15 border-primary/25',
    warning: 'bg-warning/15 border-warning/25',
    info: 'bg-muted-foreground/15 border-muted-foreground/25',
  };
  return (
    <div className={`p-4 rounded-lg mb-4 border ${colors[variant]}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{detail}</div>
    </div>
  );
};

const formatThreshold = (val: number | null): string => {
  if (!val) return 'n.v.t.';
  return `${formatPace(val)} /km (${val.toFixed(1)} km/h)`;
};

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

  const { lt1, lt2, speeds, hrs, coeffs, r2 } = results;
  const [a, b, c, d] = coeffs;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Lactaatcurve</CardTitle></CardHeader>
        <CardContent>
          <LactateChart results={results} />
          <p className="text-sm text-muted-foreground mt-2">Punten = meetwaarden. Doorgetrokken lijn = 3e-graads polynoomfit. Stippellijnen = drempels.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>LT1 — Aerobe Drempel</CardTitle></CardHeader>
          <CardContent>
            <ResultBox
              variant="success"
              label="Beste schatting (Baseline+0.5)"
              value={`${formatPace(lt1.best)} /km`}
              detail={`${lt1.best.toFixed(1)} km/h · HR: ~${interpolateHR(lt1.best, speeds, hrs)} bpm · Lactaat: ${polyEval(coeffs, lt1.best).toFixed(1)} mmol/L`}
            />
            <div className="text-sm space-y-2 mt-4">
              <p><MethodTag type="obla">OBLA 2.0</MethodTag> {formatThreshold(lt1.obla)}</p>
              <p><MethodTag type="bsln">Baseline+0.5</MethodTag> {formatThreshold(lt1.bsln)}</p>
              <p><MethodTag type="dmax">Log-Log</MethodTag> {formatThreshold(lt1.loglog)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>LT2 — Anaerobe Drempel</CardTitle></CardHeader>
          <CardContent>
            <ResultBox
              variant="warning"
              label="Beste schatting (Modified Dmax)"
              value={`${formatPace(lt2.best)} /km`}
              detail={`${lt2.best.toFixed(1)} km/h · HR: ~${interpolateHR(lt2.best, speeds, hrs)} bpm · Lactaat: ${polyEval(coeffs, lt2.best).toFixed(1)} mmol/L`}
            />
            <div className="text-sm space-y-2 mt-4">
              <p><MethodTag type="obla">OBLA 4.0</MethodTag> {formatThreshold(lt2.obla)}</p>
              <p><MethodTag type="dmax">Dmax</MethodTag> {formatThreshold(lt2.dmax)}</p>
              <p><MethodTag type="dmax">Mod. Dmax</MethodTag> {formatThreshold(lt2.moddmax)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Polynoomfit & Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultBox
              variant="info"
              label="Polynoomvergelijking"
              value=""
              detail={`y = ${a.toFixed(6)}x³ ${b >= 0 ? '+' : ''}${b.toFixed(5)}x² ${c >= 0 ? '+' : ''}${c.toFixed(4)}x ${d >= 0 ? '+' : ''}${d.toFixed(3)}`}
            />
            <ResultBox
              variant="info"
              label="R² (Coëfficiënt van determinatie)"
              value={r2.toFixed(4)}
              detail={r2 > 0.98 ? '✅ Uitstekende fit' : r2 > 0.95 ? '✅ Goede fit' : r2 > 0.90 ? '⚠️ Acceptabele fit' : '❌ Slechte fit — controleer data'}
            />
          </div>

          <h4 className="text-base font-semibold mb-2 mt-4">Ruwe data vs. polynoomfit</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tempo</TableHead>
                <TableHead>Gemeten</TableHead>
                <TableHead>Fit</TableHead>
                <TableHead>Verschil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {speeds.map((s, i) => {
                const fitted = polyEval(coeffs, s);
                const diff = results.lactates[i] - fitted;
                return (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{formatPace(s)} /km</TableCell>
                    <TableCell className="font-mono">{results.lactates[i].toFixed(1)}</TableCell>
                    <TableCell className="font-mono">{fitted.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">{diff >= 0 ? '+' : ''}{diff.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsTab;
