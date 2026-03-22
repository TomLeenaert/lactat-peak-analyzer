import { useState } from 'react';
import { type CalculationResults, getZones, polyEval, formatPace, interpolateHR, interpolateWatt } from '@/lib/lactate-math';
import LactateChart from './LactateChart';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Check, Link } from 'lucide-react';

interface ResultsTabProps {
  results: CalculationResults | null;
  testId?: string;
  athleteName?: string;
  testDate?: string;
}

const ResultsTab = ({ results, testId, athleteName, testDate }: ResultsTabProps) => {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleShare = async () => {
    if (!testId || !athleteName) return;
    setSharing(true);
    try {
      const { data: token, error } = await supabase.rpc('create_share_link', {
        p_test_result_id: testId,
        p_athlete_name: athleteName,
        p_test_date: testDate ?? new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(false);
    }
  };
  if (!results) {
    return (
      <div style={{
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.3)' }}>
          Voer testgegevens in en klik op "Berekenen".
        </p>
      </div>
    );
  }

  const { lt1, lt2, speeds, hrs, watts, coeffs } = results;
  if (!coeffs || !Array.isArray(coeffs)) {
    return (
      <div style={{
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.3)' }}>
          Geen berekende resultaten beschikbaar.
        </p>
      </div>
    );
  }

  const zones = getZones(results);
  const hasWatts = watts.some(w => w > 0);
  const totalRange = zones[zones.length - 1].to - zones[0].from;

  const lt1HR = interpolateHR(lt1.best, speeds, hrs);
  const lt2HR = interpolateHR(lt2.best, speeds, hrs);
  const lt1Lac = polyEval(coeffs, lt1.best).toFixed(1);
  const lt2Lac = polyEval(coeffs, lt2.best).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Threshold hero cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* LT1 */}
        <div style={{
          background: 'rgba(0,229,122,0.05)',
          border: '1px solid rgba(0,229,122,0.25)',
          borderRadius: '18px',
          padding: '18px 14px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,229,122,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#00e57a', opacity: 0.8, marginBottom: '10px' }}>
            Aerobe drempel
          </p>
          <p style={{ fontSize: '32px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px', marginBottom: '2px' }}>
            {formatPace(lt1.best)}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>/km</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {lt1HR > 0 && (
              <span style={{
                fontSize: '11px', fontWeight: 600, color: '#00e57a',
                background: 'rgba(0,229,122,0.1)', padding: '3px 8px', borderRadius: '6px',
              }}>{lt1HR} bpm</span>
            )}
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px',
            }}>{lt1Lac} mmol/L</span>
          </div>
        </div>

        {/* LT2 */}
        <div style={{
          background: 'rgba(255,107,43,0.05)',
          border: '1px solid rgba(255,107,43,0.25)',
          borderRadius: '18px',
          padding: '18px 14px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,43,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#ff6b2b', opacity: 0.8, marginBottom: '10px' }}>
            Anaerobe drempel
          </p>
          <p style={{ fontSize: '32px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px', marginBottom: '2px' }}>
            {formatPace(lt2.best)}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>/km</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {lt2HR > 0 && (
              <span style={{
                fontSize: '11px', fontWeight: 600, color: '#ff6b2b',
                background: 'rgba(255,107,43,0.1)', padding: '3px 8px', borderRadius: '6px',
              }}>{lt2HR} bpm</span>
            )}
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px',
            }}>{lt2Lac} mmol/L</span>
          </div>
        </div>
      </div>

      {/* Lactate curve */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '16px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
          Lactaatcurve
        </p>
        <LactateChart results={results} />
      </div>

      {/* Zone bar */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', height: '32px', display: 'flex', border: '1px solid rgba(255,255,255,0.06)' }}>
        {zones.map(z => {
          const width = Math.max(((z.to - z.from) / totalRange) * 100, 5);
          return (
            <div
              key={z.name}
              style={{
                width: `${width}%`,
                background: z.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                letterSpacing: '0.5px',
              }}
            >
              {z.name.replace('Zone ', 'Z')}
            </div>
          );
        })}
      </div>

      {/* Zone cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `4px solid ${z.color}`,
                borderRadius: '12px',
                padding: '12px 14px',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{z.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: '15px' }}>{z.label}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                    {formatPace(z.to)} – {formatPace(z.from)} /km
                  </p>
                  {hrFrom > 0 && (
                    <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginBottom: '1px' }}>
                      {hrFrom} – {hrTo} bpm
                    </p>
                  )}
                  {hasWatts && (
                    <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginBottom: '1px' }}>
                      {wFrom} – {wTo} W
                    </p>
                  )}
                  <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                    {lacFrom} – {lacTo} mmol/L
                  </p>
                </div>
              </div>
              {/* Description — visible on larger screens */}
              <p style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.3)',
                marginTop: '8px',
                lineHeight: 1.5,
              }} className="hidden sm:block">
                {z.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Share button */}
      {testId && (
        <div style={{ marginTop: '20px' }}>
          {shareUrl ? (
            <div style={{
              background: 'rgba(0,253,193,0.06)',
              border: '1px solid rgba(0,253,193,0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <Link size={14} style={{ color: '#00fdc1', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', flex: 1, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shareUrl}
              </span>
              <button
                onClick={handleShare}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '4px', border: 'none',
                  background: copied ? 'rgba(0,253,193,0.2)' : 'rgba(0,253,193,0.1)',
                  color: '#00fdc1', fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                  letterSpacing: '0.5px',
                }}
              >
                {copied ? <Check size={12} /> : <Share2 size={12} />}
                {copied ? 'GEKOPIEERD' : 'KOPIEER'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px',
                borderRadius: '6px',
                border: '1px solid rgba(0,253,193,0.25)',
                background: 'rgba(0,253,193,0.06)',
                color: '#00fdc1',
                fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px',
                cursor: sharing ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Share2 size={15} />
              {sharing ? 'Link aanmaken...' : 'Deel resultaten met atleet'}
            </button>
          )}
        </div>
      )}

    </div>
  );
};

export default ResultsTab;
