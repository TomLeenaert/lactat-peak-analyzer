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
      <div style={{
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif' }}>
          Eerst berekenen om trainingszones te zien.
        </p>
      </div>
    );
  }

  const { speeds, hrs, lt1, lt2 } = results;
  if (!lt1 || !lt2) {
    return (
      <div style={{
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif' }}>
          Geen resultaten beschikbaar. Ga naar Data en klik op Berekenen.
        </p>
      </div>
    );
  }

  const validHR = speeds.map((s, i) => ({ speed: s, hr: hrs[i] })).filter(d => d.hr > 0);
  const hrMin = validHR.length > 0 ? Math.floor(Math.min(...validHR.map(d => d.hr)) / 10) * 10 - 10 : 100;
  const hrMax = validHR.length > 0 ? Math.ceil(Math.max(...validHR.map(d => d.hr)) / 10) * 10 + 10 : 200;
  const xMin = validHR.length > 0 ? validHR[0].speed - 0.5 : 8;
  const xMax = validHR.length > 0 ? validHR[validHR.length - 1].speed + 0.5 : 18;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {validHR.length >= 2 && (
        <div style={{
          background: '#131313',
          border: '1px solid #262626',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
            marginBottom: '16px', fontFamily: 'Inter, sans-serif',
          }}>
            Hartslag vs Tempo
          </p>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={validHR} margin={{ top: 10, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="speed"
                  type="number"
                  domain={[xMin, xMax]}
                  tickFormatter={(v: number) => formatPace(v)}
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                >
                  <Label value="Tempo (min/km)" position="bottom" offset={20} style={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                </XAxis>
                <YAxis
                  domain={[hrMin, hrMax]}
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                >
                  <Label value="HR (bpm)" angle={-90} position="insideLeft" offset={0} style={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                </YAxis>
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', fontSize: '12px' }}
                  labelFormatter={(v: number) => `${formatPace(v)} /km`}
                  formatter={(v: number) => [`${v} bpm`]}
                />
                {lt1.best >= xMin && lt1.best <= xMax && (
                  <ReferenceLine
                    x={parseFloat(lt1.best.toFixed(1))}
                    stroke="#00fdc1"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{ value: 'LT1', position: 'top', fill: '#00fdc1', fontSize: 11, fontWeight: 700 }}
                  />
                )}
                {lt2.best >= xMin && lt2.best <= xMax && (
                  <ReferenceLine
                    x={parseFloat(lt2.best.toFixed(1))}
                    stroke="#ff7440"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{ value: 'LT2', position: 'top', fill: '#ff7440', fontSize: 11, fontWeight: 700 }}
                  />
                )}
                <Line dataKey="hr" type="monotone" stroke="#bd9dff" strokeWidth={2.5} dot={false} />
                <Scatter dataKey="hr" fill="#bd9dff" stroke="#131313" strokeWidth={2} r={4} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesTab;
