import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type CalculationResults, getZones, polyEval, formatPace, interpolateHR } from '@/lib/lactate-math';
import LactateChart from '@/components/LactateChart';

const ShareView = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['share', token],
    queryFn: async () => {
      // 1. Fetch the share record
      const { data: share, error: shareErr } = await (supabase
        .from as any)('shared_results')
        .select('test_result_id, athlete_name, test_date')
        .eq('token', token!)
        .single();
      if (shareErr || !share) throw new Error('Link niet gevonden');

      // 2. Fetch the test result (public read via RLS)
      const { data: test, error: testErr } = await supabase
        .from('test_results')
        .select('results_json, test_date')
        .eq('id', (share as any).test_result_id)
        .single();
      if (testErr || !test) throw new Error('Testresultaat niet gevonden');

      return {
        athleteName: (share as any).athlete_name,
        testDate: (share as any).test_date || test.test_date,
        results: test.results_json as unknown as CalculationResults,
      };
    },
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #bd9dff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isError || !data?.results) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>Link ongeldig of verlopen.</div>
        <button
          onClick={() => navigate('/')}
          style={{ padding: '10px 20px', borderRadius: '6px', background: '#bd9dff', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
        >
          Naar LacTest
        </button>
      </div>
    );
  }

  const { athleteName, testDate, results } = data;
  const { lt1, lt2, speeds, hrs, coeffs } = results;

  if (!lt1 || !lt2 || !coeffs) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Geen resultaten beschikbaar.</p>
      </div>
    );
  }

  const zones = getZones(results);
  const totalRange = zones[zones.length - 1].to - zones[0].from;
  const lt1HR = interpolateHR(lt1.best, speeds, hrs);
  const lt2HR = interpolateHR(lt2.best, speeds, hrs);
  const lt1Lac = polyEval(coeffs, lt1.best).toFixed(1);
  const lt2Lac = polyEval(coeffs, lt2.best).toFixed(1);

  const formattedDate = testDate
    ? new Date(testDate).toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#131313',
        borderBottom: '1px solid #262626',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>
            Testresultaten
          </div>
          <div style={{ fontSize: '17px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: '#fff', letterSpacing: '-0.3px' }}>
            {athleteName}
          </div>
          {formattedDate && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{formattedDate}</div>
          )}
        </div>
        <a
          href="https://mylactest.com"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '4px' }}
        >
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: '14px', color: '#bd9dff' }}>
            Lac<span style={{ color: '#fff' }}>.</span>Test
          </span>
        </a>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* Threshold hero cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>

          {/* LT1 */}
          <div style={{
            background: 'rgba(0,229,122,0.05)', border: '1px solid rgba(0,229,122,0.25)',
            borderRadius: '14px', padding: '20px 14px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,122,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#00e57a', marginBottom: '10px' }}>Aerobe drempel</p>
            <p style={{ fontSize: '34px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px', marginBottom: '2px', fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatPace(lt1.best)}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>/km</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {lt1HR > 0 && <span style={{ fontSize: '11px', fontWeight: 600, color: '#00e57a', background: 'rgba(0,229,122,0.1)', padding: '3px 8px', borderRadius: '6px' }}>{lt1HR} bpm</span>}
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px' }}>{lt1Lac} mmol/L</span>
            </div>
          </div>

          {/* LT2 */}
          <div style={{
            background: 'rgba(255,107,43,0.05)', border: '1px solid rgba(255,107,43,0.25)',
            borderRadius: '14px', padding: '20px 14px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,43,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#ff6b2b', marginBottom: '10px' }}>Anaerobe drempel</p>
            <p style={{ fontSize: '34px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px', marginBottom: '2px', fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatPace(lt2.best)}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>/km</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {lt2HR > 0 && <span style={{ fontSize: '11px', fontWeight: 600, color: '#ff6b2b', background: 'rgba(255,107,43,0.1)', padding: '3px 8px', borderRadius: '6px' }}>{lt2HR} bpm</span>}
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px' }}>{lt2Lac} mmol/L</span>
            </div>
          </div>
        </div>

        {/* Lactate curve */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>Lactaatcurve</p>
          <LactateChart results={results} />
        </div>

        {/* Zone bar */}
        <div style={{ borderRadius: '8px', overflow: 'hidden', height: '28px', display: 'flex', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '10px' }}>
          {zones.map(z => {
            const width = Math.max(((z.to - z.from) / totalRange) * 100, 5);
            return (
              <div key={z.name} style={{ width: `${width}%`, background: z.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)', letterSpacing: '0.5px' }}>
                {z.name.replace('Zone ', 'Z')}
              </div>
            );
          })}
        </div>

        {/* Zone cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '32px' }}>
          {zones.map(z => {
            const hrFrom = interpolateHR(z.from, speeds, hrs);
            const hrTo   = interpolateHR(Math.min(z.to, speeds[speeds.length - 1]), speeds, hrs);
            const lacFrom = Math.max(0, polyEval(coeffs, Math.max(z.from, speeds[0]))).toFixed(1);
            const lacTo   = Math.max(0, polyEval(coeffs, Math.min(z.to, speeds[speeds.length - 1]))).toFixed(1);

            return (
              <div key={z.name} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${z.color}`, borderRadius: '8px', padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{z.name}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginLeft: '13px' }}>{z.label}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                      {formatPace(z.to)} – {formatPace(z.from)} /km
                    </p>
                    {hrFrom > 0 && <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginBottom: '1px' }}>{hrFrom} – {hrTo} bpm</p>}
                    <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>{lacFrom} – {lacTo} mmol/L</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginBottom: '8px' }}>Gegenereerd door</p>
          <a href="https://mylactest.com" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: '16px', color: '#bd9dff', letterSpacing: '-0.3px' }}>
              Lac<span style={{ color: 'rgba(255,255,255,0.6)' }}>.</span>Test
            </span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default ShareView;
