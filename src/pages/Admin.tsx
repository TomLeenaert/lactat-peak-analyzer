import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppNav from '@/components/AppNav';
import { useToast } from '@/hooks/use-toast';
import { Coins, Users, FlaskConical, Plus, Infinity as InfinityIcon } from 'lucide-react';

const ADMIN_EMAIL = 'tomleenaert@gmail.com';

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  club_name: string;
  tokens: number;
  unlimited: boolean;
  athlete_count: number;
  test_count: number;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [grantAmount, setGrantAmount] = useState<Record<string, string>>({});

  // Fetch all users — hooks MUST be called before any early return
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('admin_get_users');
      if (error) throw error;
      return data as AdminUser[];
    },
    enabled: !!user,
  });

  // Toggle unlimited mutation
  const toggleUnlimited = useMutation({
    mutationFn: async ({ userId, unlimited }: { userId: string; unlimited: boolean }) => {
      const { error } = await (supabase.rpc as any)('admin_set_unlimited', {
        p_user_id: userId,
        p_unlimited: unlimited,
      });
      if (error) throw error;
    },
    onSuccess: (_, { unlimited }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: unlimited ? 'Unlimited beta geactiveerd' : 'Unlimited uitgeschakeld' });
    },
    onError: (err: Error) => toast({ title: 'Fout', description: err.message, variant: 'destructive' }),
  });

  // Grant tokens mutation
  const grantTokens = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { error } = await (supabase.rpc as any)('admin_grant_tokens', {
        p_user_id: userId,
        p_amount: amount,
      });
      if (error) throw error;
    },
    onSuccess: (_, { userId, amount }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['profile-nav'] });
      toast({ title: `${amount} token${amount === 1 ? '' : 's'} toegekend` });
      setGrantAmount(prev => ({ ...prev, [userId]: '' }));
    },
    onError: (err: Error) => toast({ title: 'Fout', description: err.message, variant: 'destructive' }),
  });

  // Redirect als niet admin — after all hooks
  if (user && user.email !== ADMIN_EMAIL) {
    navigate('/dashboard');
    return null;
  }

  // Statistieken
  const totalUsers = users.length;
  const totalTests = users.reduce((s, u) => s + Number(u.test_count), 0);
  const totalAthletes = users.reduce((s, u) => s + Number(u.athlete_count), 0);
  const totalTokens = users.reduce((s, u) => s + Number(u.tokens), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0c0d11', color: '#e8e9f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <AppNav title="Admin" />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px 80px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          Management Board
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>
          Overzicht van alle gebruikers, testen en tokens.
        </p>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          {[
            { icon: <Users size={16} />, label: 'Gebruikers', value: totalUsers, color: '#6644ff' },
            { icon: <FlaskConical size={16} />, label: 'Testen', value: totalTests, color: '#00c9a7' },
            { icon: <Users size={16} />, label: 'Atleten', value: totalAthletes, color: '#fbbf24' },
            { icon: <Coins size={16} />, label: 'Tokens in omloop', value: totalTokens, color: '#f97316' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: s.color, marginBottom: '10px', fontSize: '13px' }}>
                {s.icon}
                <span style={{ fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
            Gebruikers ({totalUsers})
          </div>

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              Laden...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              Geen gebruikers gevonden.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Naam / Email', 'Club', 'Atleten', 'Testen', 'Tokens', 'Beta', 'Tokens geven', 'Lid sinds'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                        fontSize: '11px', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.user_id} style={{
                      borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      transition: 'background .15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Naam + email */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                          {u.full_name || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Geen naam</span>}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{u.email}</div>
                      </td>

                      {/* Club */}
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>
                        {u.club_name || '—'}
                      </td>

                      {/* Atleten */}
                      <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, textAlign: 'center' }}>
                        {u.athlete_count}
                      </td>

                      {/* Testen */}
                      <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, textAlign: 'center' }}>
                        {u.test_count}
                      </td>

                      {/* Tokens */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 10px', borderRadius: '20px',
                          background: u.unlimited ? 'rgba(0,253,193,0.1)' : u.tokens === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(102,68,255,0.12)',
                          border: `1px solid ${u.unlimited ? 'rgba(0,253,193,0.3)' : u.tokens === 0 ? 'rgba(239,68,68,0.25)' : 'rgba(102,68,255,0.25)'}`,
                          color: u.unlimited ? '#00fdc1' : u.tokens === 0 ? '#f87171' : '#a090ff',
                          fontWeight: 700, fontSize: '13px',
                        }}>
                          {u.unlimited ? <InfinityIcon size={11} /> : <Coins size={11} />}
                          {u.unlimited ? '∞' : u.tokens}
                        </span>
                      </td>

                      {/* Beta unlimited toggle */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleUnlimited.mutate({ userId: u.user_id, unlimited: !u.unlimited })}
                          disabled={toggleUnlimited.isPending}
                          style={{
                            padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                            background: u.unlimited ? 'rgba(0,253,193,0.15)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${u.unlimited ? 'rgba(0,253,193,0.4)' : 'rgba(255,255,255,0.12)'}`,
                            color: u.unlimited ? '#00fdc1' : 'rgba(255,255,255,0.35)',
                            fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                            transition: 'all 0.15s',
                          }}
                        >
                          {u.unlimited ? 'BETA AAN' : 'BETA'}
                        </button>
                      </td>

                      {/* Tokens geven */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            placeholder="bv. 5"
                            value={grantAmount[u.user_id] ?? ''}
                            onChange={e => setGrantAmount(prev => ({ ...prev, [u.user_id]: e.target.value }))}
                            style={{
                              width: '70px', padding: '5px 8px',
                              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                              borderRadius: '6px', color: '#fff', fontSize: '13px',
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => {
                              const amount = parseInt(grantAmount[u.user_id] ?? '');
                              if (!amount || amount <= 0) return;
                              grantTokens.mutate({ userId: u.user_id, amount });
                            }}
                            disabled={grantTokens.isPending}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '6px',
                              background: 'rgba(102,68,255,0.2)', border: '1px solid rgba(102,68,255,0.35)',
                              color: '#a090ff', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Plus size={12} />
                            Geven
                          </button>
                        </div>
                      </td>

                      {/* Lid sinds */}
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {new Date(u.created_at).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
