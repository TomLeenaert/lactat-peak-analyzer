import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import AppNav from '@/components/AppNav';
import { Users, FlaskConical, Share2, Activity, MessageCircle, FileText, Image as ImageIcon, Link as LinkIcon, Eye, Globe } from 'lucide-react';

interface TopUser {
  user_id: string;
  full_name: string | null;
  club_name: string | null;
  email: string | null;
  athlete_count: number;
  test_count: number;
  created_at: string;
}
interface ActivityRow {
  kind: 'test' | 'event';
  ts: string;
  subject: string | null;
  actor: string | null;
  detail: string | null;
}
interface DayBucket { day: string; count: number; }
interface ShareBucket { event_type: string; count: number; }

interface CoachRow {
  user_id: string;
  full_name: string | null;
  club_name: string | null;
  email: string | null;
  test_count: number;
  export_count: number;
  last_export_at: string | null;
}
interface Overview {
  totals: {
    users: number;
    athletes: number;
    tests: number;
    tests_last_7d: number;
    tests_last_30d: number;
    new_users_last_30d: number;
    share_events_total: number;
    visitors_total: number;
    visitors_last_7d: number;
    visitors_unique_30d: number;
  };
  share_breakdown: ShareBucket[];
  tests_per_day: DayBucket[];
  signups_per_day: DayBucket[];
  visitors_per_day: DayBucket[];
  top_users: TopUser[];
  coaches_overview: CoachRow[];
  recent_activity: ActivityRow[];
}

const SHARE_META: Record<string, { label: string; icon: JSX.Element; color: string }> = {
  share_whatsapp: { label: 'WhatsApp', icon: <MessageCircle size={14} />, color: '#25D366' },
  share_pdf:      { label: 'PDF',      icon: <FileText size={14} />,     color: '#f97316' },
  share_image:    { label: 'Afbeelding', icon: <ImageIcon size={14} />,  color: '#a78bfa' },
  share_link:     { label: 'Link gekopieerd', icon: <LinkIcon size={14} />, color: '#60a5fa' },
  share_link_view:{ label: 'Link bekeken', icon: <Eye size={14} />,      color: '#00fdc1' },
};

// Build a continuous 30-day series, filling missing days with 0
const buildDailySeries = (rows: DayBucket[]) => {
  const map = new Map(rows.map(r => [r.day, r.count]));
  const out: { day: string; count: number; label: string }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    out.push({
      day: iso,
      count: Number(map.get(iso) ?? 0),
      label: d.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit' }),
    });
  }
  return out;
};

// Tiny inline bar chart (no chart lib)
const BarChart = ({ data, color }: { data: { label: string; count: number }[]; color: string }) => {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '90px', padding: '4px 0' }}>
      {data.map((d, i) => {
        const h = (d.count / max) * 100;
        return (
          <div key={i} title={`${d.label}: ${d.count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{
              width: '100%', height: `${h}%`, minHeight: d.count > 0 ? '2px' : '0',
              background: color, borderRadius: '2px 2px 0 0', opacity: d.count > 0 ? 1 : 0.15,
              transition: 'opacity .15s',
            }} />
          </div>
        );
      })}
    </div>
  );
};

const formatRelative = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s geleden`;
  if (diff < 3600) return `${Math.round(diff / 60)}m geleden`;
  if (diff < 86400) return `${Math.round(diff / 3600)}u geleden`;
  return `${Math.round(diff / 86400)}d geleden`;
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();

  const { data, isLoading, error } = useQuery<Overview>({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('admin_overview');
      if (error) throw error;
      return data as Overview;
    },
    enabled: !!user && isAdmin,
    refetchInterval: 60_000,
  });

  if (authLoading || roleLoading) {
    return <div style={{ minHeight: '100vh', background: '#0c0d11', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Laden...</div>;
  }

  if (!user || !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const totals = data?.totals;
  const testsSeries = buildDailySeries(data?.tests_per_day ?? []);
  const signupsSeries = buildDailySeries(data?.signups_per_day ?? []);
  const visitorsSeries = buildDailySeries(data?.visitors_per_day ?? []);

  const shareTotal = data?.share_breakdown.reduce((s, b) => s + Number(b.count), 0) ?? 0;
  const recent = (data?.recent_activity ?? []).slice(0, 25);

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '18px 20px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0c0d11', color: '#e8e9f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <AppNav title="Admin" />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
          Management Board
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
          Live inzicht in gebruik, testactiviteit en hoe coaches resultaten delen.
        </p>

        {error && (
          <div style={{ ...card, color: '#f87171', marginBottom: '20px' }}>
            Kan analytics niet laden: {(error as Error).message}
          </div>
        )}

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { icon: <Users size={16} />, label: 'Coaches', value: totals?.users ?? '—', sub: totals ? `+${totals.new_users_last_30d} laatste 30d` : '', color: '#6644ff' },
            { icon: <Users size={16} />, label: 'Atleten', value: totals?.athletes ?? '—', sub: '', color: '#fbbf24' },
            { icon: <FlaskConical size={16} />, label: 'Testen', value: totals?.tests ?? '—', sub: totals ? `${totals.tests_last_7d} deze week · ${totals.tests_last_30d} 30d` : '', color: '#00c9a7' },
            { icon: <Share2 size={16} />, label: 'Deelacties', value: totals?.share_events_total ?? '—', sub: 'WhatsApp, PDF, link, ...', color: '#f97316' },
            { icon: <Globe size={16} />, label: 'Bezoekers', value: totals?.visitors_total ?? '—', sub: totals ? `${totals.visitors_last_7d} deze week · ~${totals.visitors_unique_30d} uniek 30d` : '', color: '#60a5fa' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: s.color, marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                {s.icon}{s.label}
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Coaches overview — simple view: name + tests + export status */}
        <div style={{ ...card, marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              Coaches — testen & export
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                {data?.coaches_overview?.length ?? 0} coaches
              </div>
              <button
                onClick={() => {
                  const rows = data?.coaches_overview ?? [];
                  const header = ['Naam', 'Email', 'Club', 'Testen', 'Exports', 'Laatste export'];
                  const csv = [header, ...rows.map(c => [
                    c.full_name ?? '',
                    c.email ?? '',
                    c.club_name ?? '',
                    String(c.test_count),
                    String(c.export_count),
                    c.last_export_at ?? '',
                  ])].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `coaches-${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: 'rgba(0,201,167,0.12)', color: '#00c9a7',
                  border: '1px solid rgba(0,201,167,0.3)', fontSize: '12px', fontWeight: 600,
                }}
              >
                ⬇ Export CSV
              </button>
              <button
                onClick={() => {
                  const emails = (data?.coaches_overview ?? []).map(c => c.email).filter(Boolean).join(',');
                  if (emails) window.location.href = `mailto:?bcc=${emails}`;
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: 'rgba(102,68,255,0.12)', color: '#a090ff',
                  border: '1px solid rgba(102,68,255,0.3)', fontSize: '12px', fontWeight: 600,
                }}
              >
                ✉ Mail allemaal
              </button>
            </div>
          </div>
          {!data?.coaches_overview?.length ? (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Nog geen coaches.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Coach</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Email</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right' }}>Testen</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>Tot export</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right' }}>Exports</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coaches_overview.map(c => {
                    const completed = c.export_count > 0;
                    return (
                      <tr key={c.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ color: '#fff', fontWeight: 500 }}>
                            {c.full_name || <span style={{ color: 'rgba(255,255,255,0.3)' }}>(geen naam)</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                            {c.club_name || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {c.email ? (
                            <a href={`mailto:${c.email}?subject=${encodeURIComponent('myLactest — ' + (c.test_count > 0 ? `je ${c.test_count} test(en)` : 'welkom'))}`}
                               style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
                              {c.email}
                            </a>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                          {c.test_count}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {c.test_count === 0 ? (
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>—</span>
                          ) : completed ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '3px 8px', borderRadius: '999px',
                              background: 'rgba(0,201,167,0.12)', color: '#00c9a7',
                              fontSize: '11px', fontWeight: 600,
                            }}>
                              ✓ Ja
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '3px 8px', borderRadius: '999px',
                              background: 'rgba(248,113,113,0.10)', color: '#f87171',
                              fontSize: '11px', fontWeight: 600,
                            }}>
                              Niet afgerond
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>
                          {c.export_count}
                          {c.last_export_at && (
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                              laatst {formatRelative(c.last_export_at)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trends */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Testen — laatste 30 dagen</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                {testsSeries.reduce((s, d) => s + d.count, 0)} totaal
              </div>
            </div>
            <BarChart data={testsSeries} color="#00c9a7" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
              <span>{testsSeries[0]?.label}</span>
              <span>{testsSeries[testsSeries.length - 1]?.label}</span>
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Nieuwe coaches — 30 dagen</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                {signupsSeries.reduce((s, d) => s + d.count, 0)} totaal
              </div>
            </div>
            <BarChart data={signupsSeries} color="#a090ff" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
              <span>{signupsSeries[0]?.label}</span>
              <span>{signupsSeries[signupsSeries.length - 1]?.label}</span>
            </div>
          </div>
        </div>

        {/* Share method breakdown */}
        <div style={{ ...card, marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '14px' }}>
            Hoe delen coaches resultaten?
          </div>
          {!data?.share_breakdown.length ? (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', padding: '12px 0' }}>
              Nog geen deelacties geregistreerd.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.share_breakdown.map(b => {
                const meta = SHARE_META[b.event_type] ?? { label: b.event_type, icon: <Share2 size={14} />, color: '#888' };
                const pct = shareTotal > 0 ? (Number(b.count) / shareTotal) * 100 : 0;
                return (
                  <div key={b.event_type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: meta.color, fontWeight: 600 }}>
                        {meta.icon}{meta.label}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {b.count} <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>{pct.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: meta.color, transition: 'width .3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top users + Activity feed (two cols) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
          <div style={card}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '12px' }}>
              Top 10 actieve coaches
            </div>
            {!data?.top_users.length ? (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Nog geen data.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.top_users.map((u, i) => (
                  <div key={u.user_id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px',
                    background: i < 3 ? 'rgba(102,68,255,0.06)' : 'transparent',
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.full_name || <span style={{ color: 'rgba(255,255,255,0.3)' }}>(geen naam)</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.club_name || u.email}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                      <div><strong style={{ color: '#fff' }}>{u.test_count}</strong> testen</div>
                      <div>{u.athlete_count} atleten</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '12px' }}>
              <Activity size={14} /> Recente activiteit
            </div>
            {!recent.length ? (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Nog geen activiteit.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {recent.map((r, i) => {
                  const meta = r.kind === 'test'
                    ? { label: 'Test', icon: <FlaskConical size={12} />, color: '#00c9a7' }
                    : (SHARE_META[r.subject ?? ''] ?? { label: r.subject ?? 'event', icon: <Share2 size={12} />, color: '#a78bfa' });
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', paddingBottom: '8px', borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ color: meta.color, marginTop: '2px' }}>{meta.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: 500 }}>
                          {r.kind === 'test' ? <>Test voor <strong>{r.subject}</strong></> : meta.label}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.actor ?? 'anoniem'}
                        </div>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', whiteSpace: 'nowrap' }}>{formatRelative(r.ts)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            Laden...
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
