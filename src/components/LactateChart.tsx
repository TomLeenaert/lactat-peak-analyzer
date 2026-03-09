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

  const xMin = speeds[0] - 0.3;
  const xMax = speeds[speeds.length - 1] + 0.3;
  const maxLactate = Math.max(...lactates);
  const yMax = Math.ceil(maxLactate * 1.3);

  // Generate polynomial curve data
  const curveData = useMemo(() => {
    const points = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = polyEval(coeffs, x);
      // Clamp to avoid wild polynomial tails
      if (y >= -0.5 && y <= yMax + 1) {
        points.push({ speed: parseFloat(x.toFixed(3)), fit: parseFloat(y.toFixed(2)) });
      }
    }
    return points;
  }, [coeffs, xMin, xMax, yMax]);

  // Scatter data (actual measurements)
  const scatterData = speeds.map((s, i) => ({ speed: s, lactate: lactates[i] }));

  // Generate pace ticks from actual data range
  const paceTickValues = useMemo(() => {
    const ticks: number[] = [];
    const start = Math.floor(xMin * 2) / 2;
    const end = Math.ceil(xMax * 2) / 2;
    for (let v = start; v <= end; v += 0.5) {
      ticks.push(parseFloat(v.toFixed(1)));
    }
    return ticks;
  }, [xMin, xMax]);

  return (
    <div className="w-full">
      <div className="w-full h-[400px] sm:h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 30, right: 50, bottom: 50, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis
              dataKey="speed"
              type="number"
              domain={[xMin, xMax]}
              ticks={paceTickValues}
              tickFormatter={(v: number) => formatPace(v)}
              allowDuplicatedCategory={false}
              tick={{ fontSize: 11 }}
            >
              <Label value="Tempo (min/km)" position="bottom" offset={25} className="fill-muted-foreground text-xs" />
            </XAxis>
            <YAxis
              domain={[0, yMax]}
              tick={{ fontSize: 11 }}
              width={50}
            >
              <Label value="Lactaat (mmol/L)" angle={-90} position="insideLeft" offset={5} className="fill-muted-foreground text-xs" />
            </YAxis>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)} ${name === 'fit' ? 'mmol/L (fit)' : 'mmol/L'}`,
              ]}
              labelFormatter={(v: number) => `${formatPace(v)} /km`}
            />

            {/* OBLA lines */}
            <ReferenceLine y={2} stroke="hsl(142, 71%, 45%)" strokeDasharray="4 4" strokeWidth={1.5}>
              <Label value="2 mmol/L" position="right" offset={8} fill="hsl(142, 71%, 45%)" fontSize={10} />
            </ReferenceLine>
            <ReferenceLine y={4} stroke="hsl(25, 95%, 53%)" strokeDasharray="4 4" strokeWidth={1.5}>
              <Label value="4 mmol/L" position="right" offset={8} fill="hsl(25, 95%, 53%)" fontSize={10} />
            </ReferenceLine>

            {/* LT1 vertical */}
            {lt1.best >= xMin && lt1.best <= xMax && (
              <ReferenceLine x={lt1.best} stroke="hsl(160, 60%, 50%)" strokeDasharray="8 4" strokeWidth={1.5}>
                <Label value={`T2mmol ${formatPace(lt1.best)}`} position="top" offset={8} fill="hsl(160, 60%, 50%)" fontSize={11} fontWeight="bold" />
              </ReferenceLine>
            )}

            {/* LT2 vertical */}
            {lt2.best >= xMin && lt2.best <= xMax && (
              <ReferenceLine x={lt2.best} stroke="hsl(25, 85%, 50%)" strokeDasharray="8 4" strokeWidth={1.5}>
                <Label value={`T4mmol ${formatPace(lt2.best)}`} position="top" offset={8} fill="hsl(25, 85%, 50%)" fontSize={11} fontWeight="bold" />
              </ReferenceLine>
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
              isAnimationActive={false}
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
      <p className="text-xs text-muted-foreground text-center mt-2">
        Punten = meetwaarden. Doorgetrokken lijn = 3e-graads polynoomfit. Stippellijnen = drempels.
      </p>
    </div>
  );
};

export default LactateChart;
