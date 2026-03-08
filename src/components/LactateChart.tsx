import { useMemo } from 'react';
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine,
  ResponsiveContainer, Tooltip, Label,
} from 'recharts';
import { type CalculationResults, polyEval, formatPace } from '@/lib/lactate-math';

interface LactateChartProps {
  results: CalculationResults;
}

const LactateChart = ({ results }: LactateChartProps) => {
  const { speeds, lactates, coeffs, lt1, lt2 } = results;

  const xMin = speeds[0] - 0.5;
  const xMax = speeds[speeds.length - 1] + 0.5;
  const yMax = Math.ceil(Math.max(...lactates) * 1.2);

  // Generate polynomial curve data
  const curveData = useMemo(() => {
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      points.push({ speed: parseFloat(x.toFixed(2)), fit: parseFloat(polyEval(coeffs, x).toFixed(2)) });
    }
    return points;
  }, [coeffs, xMin, xMax]);

  // Scatter data (actual measurements)
  const scatterData = speeds.map((s, i) => ({ speed: s, lactate: lactates[i] }));

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="speed"
            type="number"
            domain={[xMin, xMax]}
            tickFormatter={(v: number) => `${v}`}
            allowDuplicatedCategory={false}
          >
            <Label value="Snelheid (km/h)" position="bottom" offset={20} className="fill-muted-foreground text-xs" />
          </XAxis>
          <YAxis domain={[0, yMax]}>
            <Label value="Lactaat (mmol/L)" angle={-90} position="insideLeft" offset={0} className="fill-muted-foreground text-xs" />
          </YAxis>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)} ${name === 'fit' ? 'mmol/L (fit)' : 'mmol/L'}`,
            ]}
            labelFormatter={(v: number) => `${v} km/h (${formatPace(v)}/km)`}
          />

          {/* OBLA lines */}
          <ReferenceLine y={2} stroke="#a3e635" strokeDasharray="3 3" label={{ value: '2 mmol/L', position: 'right', className: 'fill-green-400 text-[10px]' }} />
          <ReferenceLine y={4} stroke="#fb923c" strokeDasharray="3 3" label={{ value: '4 mmol/L', position: 'right', className: 'fill-orange-400 text-[10px]' }} />

          {/* LT1 vertical */}
          {lt1.best >= xMin && lt1.best <= xMax && (
            <ReferenceLine x={parseFloat(lt1.best.toFixed(1))} stroke="#34d399" strokeDasharray="6 4" label={{ value: `LT1 ${lt1.best.toFixed(1)}`, position: 'top', className: 'fill-green-400 text-[11px] font-bold' }} />
          )}

          {/* LT2 vertical */}
          {lt2.best >= xMin && lt2.best <= xMax && (
            <ReferenceLine x={parseFloat(lt2.best.toFixed(1))} stroke="#f97316" strokeDasharray="6 4" label={{ value: `LT2 ${lt2.best.toFixed(1)}`, position: 'top', className: 'fill-orange-500 text-[11px] font-bold' }} />
          )}

          {/* Polynomial curve */}
          <Line
            data={curveData}
            dataKey="fit"
            type="monotone"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={false}
            name="Polynoomfit"
          />

          {/* Data points */}
          <Scatter
            data={scatterData}
            dataKey="lactate"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--card))"
            strokeWidth={2}
            r={5}
            name="Meetwaarde"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LactateChart;
