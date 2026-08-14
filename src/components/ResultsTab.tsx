import { useState, useRef } from 'react';
import { type CalculationResults, getZones, polyEval, formatPace, interpolateHR } from '@/lib/lactate-math';
import LactateChart from './LactateChart';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Check, Link, MessageCircle, Download, Image, FileText } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoSrc from '@/assets/screen.png';

interface ResultsTabProps {
  results: CalculationResults | null;
  testId?: string;
  athleteName?: string;
  testDate?: string;
}

const ResultsTab = ({ results, testId, athleteName, testDate }: ResultsTabProps) => {
  const { t } = useLang();
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const trackEvent = (event_type: string, metadata: Record<string, unknown> = {}) => {
    (supabase.rpc as any)('log_event', { _event_type: event_type, _metadata: { ...metadata, test_id: testId ?? null } })
      .then(() => {})
      .catch(() => {});
  };

  const handleShare = async () => {
    if (!testId || !athleteName) return;
    setSharing(true);
    try {
      const { data: token, error } = await (supabase.rpc as any)('create_share_link', {
        p_test_result_id: testId,
        p_athlete_name: athleteName,
        p_test_date: testDate ?? new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent('share_link');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error(e);
      toast({ title: t('common.error'), description: t('results.shareFailed'), variant: 'destructive' });
    } finally {
      setSharing(false);
    }
  };

  if (!results) {
    return (
      <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.3)' }}>{t('results.enterData')}</p>
      </div>
    );
  }

  const { lt1, lt2, speeds, hrs, coeffs, warnings } = results;
  const lt2NotReached = lt2.oblaReached === false;
  if (!coeffs || !Array.isArray(coeffs)) {
    return (
      <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.3)' }}>{t('results.noResults')}</p>
      </div>
    );
  }

  const zonesInconsistent =
    Array.isArray(warnings) && warnings.some(w => w.code === 'THRESHOLD_ORDER') && lt2.best <= lt1.best;

  const zones = getZones(results);
  const totalRange = zones[zones.length - 1].to - zones[0].from;

  // Dubbele THRESHOLD_INTERPOLATED-meldingen samenvoegen tot één (enkel weergave).
  const displayWarnings = (() => {
    if (!Array.isArray(warnings)) return [];
    const interpolated = warnings.filter(w => w.code === 'THRESHOLD_INTERPOLATED');
    if (interpolated.length < 2) return warnings;
    const rest = warnings.filter(w => w.code !== 'THRESHOLD_INTERPOLATED');
    return [
      ...rest,
      { severity: interpolated[0].severity, code: 'THRESHOLD_INTERPOLATED', message: t('results.bothInterpolated') },
    ] as typeof warnings;
  })();

  const lt1HR = interpolateHR(lt1.best, speeds, hrs);
  const lt2HR = interpolateHR(lt2.best, speeds, hrs);
  const lt1Lac = polyEval(coeffs, lt1.best).toFixed(1);
  const lt2Lac = polyEval(coeffs, lt2.best).toFixed(1);

  const buildWhatsAppMessage = () => {
    if (!results) return '';
    const { lt1, lt2 } = results;
    const zones = getZones(results);
    let msg = t('wa.title');
    if (athleteName) msg += `\n👤 ${athleteName}`;
    if (testDate) msg += ` — ${testDate}`;
    msg += `\n\n🟢 *${t('wa.aerobic')}*: ${formatPace(lt1.best)} /km`;
    if (lt1HR > 0) msg += ` (${lt1HR} bpm)`;
    msg += ` — ${lt1Lac} mmol/L`;
    if (lt2.oblaReached === false) {
      msg += `\n🟠 *${t('wa.anaerobic')}*: ${t('wa.anaerobicNotReached')}`;
    } else {
      msg += `\n🟠 *${t('wa.anaerobic')}*: ${formatPace(lt2.best)} /km`;
      if (lt2HR > 0) msg += ` (${lt2HR} bpm)`;
      msg += ` — ${lt2Lac} mmol/L`;
    }
    msg += `\n\n${t('wa.zones')}`;
    zones.forEach(z => {
      msg += `\n${z.name}: ${formatPace(z.to)} – ${formatPace(z.from)} /km`;
    });
    msg += `\n\n${t('wa.via')}`;
    return msg;
  };

  const handleWhatsApp = (phoneNumber?: string) => {
    const msg = encodeURIComponent(buildWhatsAppMessage());
    const url = phoneNumber
      ? `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    trackEvent('share_whatsapp');
    window.open(url, '_blank');
  };

  const handleShareImage = async () => {
    if (!resultsRef.current) return;
    setGeneratingImage(true);
    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );
      const fileName = `lactaat-test${athleteName ? `-${athleteName.replace(/\s+/g, '-')}` : ''}${testDate ? `-${testDate}` : ''}.png`;

      // Try Web Share API with file (works on mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'image/png' });
        const shareData = { files: [file] };
        if (navigator.canShare(shareData)) {
          await navigator.share({
            ...shareData,
            text: buildWhatsAppMessage(),
          });
          trackEvent('share_image', { method: 'native_share' });
          return;
        }
      }
      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      trackEvent('share_image', { method: 'download' });
    } catch (e) {
      console.error('Image generation failed:', e);
      toast({ title: t('common.error'), description: t('results.imageFailed'), variant: 'destructive' });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handlePdfExport = async () => {
    if (!resultsRef.current) return;
    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2,
        useCORS: true,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const headerH = 18;
      const footerH = 10;

      // Background
      pdf.setFillColor(10, 10, 15);
      pdf.rect(0, 0, pageW, pageH, 'F');

      // Header: logo + brand
      try {
        pdf.addImage(logoSrc, 'PNG', margin, 6, 12, 12);
      } catch {}
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('MyLactest', margin + 14, 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 253, 193);
      pdf.text('mylactest.com', pageW - margin, 11, { align: 'right' });
      pdf.setTextColor(180, 180, 200);
      pdf.setFontSize(9);
      const subtitle = `${athleteName ?? ''}${athleteName && testDate ? ' — ' : ''}${testDate ?? ''}`;
      if (subtitle.trim()) pdf.text(subtitle, pageW - margin, 16, { align: 'right' });

      // Divider
      pdf.setDrawColor(60, 60, 80);
      pdf.line(margin, headerH, pageW - margin, headerH);

      // Image of results — fill full page width for maximum readability
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const maxImgH = pageH - headerH - footerH - 8;
      let finalW = imgW;
      let finalH = imgH;
      if (imgH > maxImgH) {
        finalH = maxImgH;
        finalW = (canvas.width * finalH) / canvas.height;
      }
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', (pageW - finalW) / 2, headerH + 4, finalW, finalH);

      // Footer
      pdf.setDrawColor(60, 60, 80);
      pdf.line(margin, pageH - footerH, pageW - margin, pageH - footerH);
      pdf.setFontSize(8);
      pdf.setTextColor(140, 140, 160);
      pdf.text('Generated by MyLactest — free lactate threshold analysis', margin, pageH - 4);
      pdf.setTextColor(0, 253, 193);
      pdf.text('https://mylactest.com', pageW - margin, pageH - 4, { align: 'right' });

      const fileName = `mylactest${athleteName ? `-${athleteName.replace(/\s+/g, '-')}` : ''}${testDate ? `-${testDate}` : ''}.pdf`;
      pdf.save(fileName);
      trackEvent('share_pdf');
    } catch (e) {
      console.error('PDF generation failed:', e);
      toast({ title: t('common.error'), description: t('results.pdfFailed'), variant: 'destructive' });
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
      <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px' }}>

      {/* Threshold hero cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* LT1 */}
        <div style={{
          background: 'rgba(0,229,122,0.05)', border: '1px solid rgba(0,229,122,0.25)',
          borderRadius: '16px', padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: '14px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#00e57a', margin: 0, marginBottom: '4px' }}>
              {t('results.aerobicThreshold')}
            </p>
            <p style={{ fontSize: '46px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1.5px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {formatPace(lt1.best)}<span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginLeft: '5px' }}>/km</span>
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
            {lt1HR > 0 && (
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#00e57a', background: 'rgba(0,229,122,0.15)', padding: '4px 10px', borderRadius: '6px' }}>{lt1HR} bpm</span>
            )}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{lt1Lac} mmol/L</span>
          </div>
        </div>

        {/* LT2 */}
        <div style={{
          background: 'rgba(255,107,43,0.05)', border: '1px solid rgba(255,107,43,0.25)',
          borderRadius: '16px', padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: '14px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#ff6b2b', margin: 0, marginBottom: '4px' }}>
              {t('results.anaerobicThreshold')}
            </p>
            <p style={{
              fontSize: lt2NotReached ? '21px' : '46px', fontWeight: 900, color: '#fff', lineHeight: 1,
              letterSpacing: lt2NotReached ? '-0.5px' : '-1.5px', margin: 0, fontVariantNumeric: 'tabular-nums',
            }}>
              {lt2NotReached ? t('results.anaerobicNotDetermined') : formatPace(lt2.best)}
              {!lt2NotReached && <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginLeft: '5px' }}>/km</span>}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
            {lt2NotReached ? (
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffab40' }}>{t('results.oblaNotReached')}</span>
            ) : (
              <>
                {lt2HR > 0 && (
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#ff6b2b', background: 'rgba(255,107,43,0.15)', padding: '4px 10px', borderRadius: '6px' }}>{lt2HR} bpm</span>
                )}
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{lt2Lac} mmol/L</span>
              </>
            )}
          </div>
        </div>
      </div>

      {displayWarnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>{t('results.warnings')}</div>
          {displayWarnings.map((w, i) => (
            <div key={i} style={{
              padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, lineHeight: 1.4,
              background: w.severity === 'warning' ? 'rgba(255,171,64,0.08)' : 'rgba(255,255,255,0.04)',
              border: w.severity === 'warning' ? '1px solid rgba(255,171,64,0.25)' : '1px solid rgba(255,255,255,0.08)',
              color: w.severity === 'warning' ? '#ffab40' : 'rgba(255,255,255,0.55)',
            }}>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Lactate curve */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '12px 14px' }}>
        <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '8px', marginTop: 0 }}>
          {t('results.lactateCurve')}
        </p>
        <LactateChart results={results} />
      </div>

      {/* Zone bar */}
      <div style={{ borderRadius: '10px', overflow: 'hidden', height: '32px', display: 'flex', border: '1px solid rgba(255,255,255,0.06)' }}>
        {zones.map(z => {
          const width = Math.max(((z.to - z.from) / totalRange) * 100, 5);
          return (
            <div key={z.name} style={{
              width: `${width}%`, background: z.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 800, color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)', letterSpacing: '0.5px',
            }}>
              {z.name.replace('Zone ', 'Z')}
            </div>
          );
        })}
      </div>

      {lt2NotReached && (
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '8px 0 0' }}>
          {t('results.oblaZoneCaption')}
        </p>
      )}

      {/* Zone cards — compact one-line rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {zones.map(z => {
          const hrFrom = interpolateHR(z.from, speeds, hrs);
          const hrTo = interpolateHR(Math.min(z.to, speeds[speeds.length - 1]), speeds, hrs);
          const hasHR = hrFrom > 0;

          return (
            <div key={z.name} style={{
              background: `linear-gradient(90deg, ${z.color}14 0%, rgba(255,255,255,0.02) 70%)`,
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `4px solid ${z.color}`,
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 1.4fr) minmax(0, 1fr) minmax(0, 1fr)',
              alignItems: 'center',
              gap: '14px',
            }}>
              {/* Zone label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>
                  {z.name.replace('Zone ', 'Z')}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {z.label}
                </span>
              </div>

              {/* Pace */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: z.color, lineHeight: 1 }}>Pace</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginTop: '3px' }}>
                  {formatPace(z.to)}–{formatPace(z.from)}
                </span>
              </div>

              {/* HR */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>HR</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginTop: '3px' }}>
                  {hasHR ? `${hrFrom}–${hrTo} bpm` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      </div>{/* end ref wrapper */}

      {/* Share as image button */}
      <button
        onClick={handleShareImage}
        disabled={generatingImage}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '14px', borderRadius: '6px',
          border: '1px solid rgba(37,211,102,0.35)', background: 'rgba(37,211,102,0.08)',
          color: '#25d366', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px',
          cursor: generatingImage ? 'wait' : 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
        }}
      >
        <Image size={15} />
        {generatingImage
          ? (t('results.shareWhatsApp').includes('WhatsApp') ? '⏳...' : '⏳...')
          : t('results.shareImage')}
      </button>

      {/* PDF export button */}
      <button
        onClick={handlePdfExport}
        disabled={generatingPdf}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '14px', borderRadius: '6px',
          border: '1px solid rgba(189,157,255,0.35)', background: 'rgba(189,157,255,0.08)',
          color: '#bd9dff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px',
          cursor: generatingPdf ? 'wait' : 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
        }}
      >
        <FileText size={15} />
        {generatingPdf ? '⏳ PDF...' : 'Download als PDF'}
      </button>

      {/* WhatsApp text share button */}
      <button
        onClick={() => handleWhatsApp()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '14px', borderRadius: '6px',
          border: '1px solid rgba(37,211,102,0.25)', background: 'rgba(37,211,102,0.04)',
          color: '#25d366', fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px',
          cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
        }}
      >
        <MessageCircle size={15} />
        {t('results.shareWhatsApp')}
      </button>

      {testId && (
        <div style={{ marginTop: '20px' }}>
          {shareUrl ? (
            <div style={{
              background: 'rgba(0,253,193,0.06)', border: '1px solid rgba(0,253,193,0.2)',
              borderRadius: '8px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '10px',
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
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', letterSpacing: '0.5px',
                }}
              >
                {copied ? <Check size={12} /> : <Share2 size={12} />}
                {copied ? t('results.copied') : t('results.copy')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px', borderRadius: '6px',
                border: '1px solid rgba(0,253,193,0.25)', background: 'rgba(0,253,193,0.06)',
                color: '#00fdc1', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px',
                cursor: sharing ? 'wait' : 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
              }}
            >
              <Share2 size={15} />
              {sharing ? t('results.creatingLink') : t('results.shareResults')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsTab;
