import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AppNavProps {
  /** If provided, shows a back arrow instead of the logo */
  backTo?: string;
  backLabel?: string;
  /** Sub-title shown next to logo/back button */
  title?: string;
  /** Extra content on the right side (e.g. a Save button) */
  rightContent?: React.ReactNode;
  /** Hide the sign-out button (e.g. on public/demo pages) */
  hideSignOut?: boolean;
}

const ADMIN_EMAIL = 'tomleenaert@gmail.com';

const AppNav = ({ backTo, backLabel, title, rightContent, hideSignOut }: AppNavProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile-nav'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !hideSignOut,
    staleTime: 10_000,
  });

  const tokens = profile?.tokens ?? null;
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(12, 13, 17, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '58px',
        gap: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {backTo ? (
          <button
            onClick={() => navigate(backTo)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255,255,255,0.45)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '6px 0',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              minHeight: '44px',
            }}
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{backLabel ?? 'Terug'}</span>
          </button>
        ) : (
          <a
            href="/"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontSize: '17px',
              flexShrink: 0,
            }}
          >
            Lac<span style={{ color: '#6644ff' }}>.</span>Test
          </a>
        )}

        {title && (
          <span
            className="hidden sm:block"
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '13px',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              paddingLeft: '10px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {rightContent}

        {!hideSignOut && tokens !== null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: tokens === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(102,68,255,0.12)',
              border: `1px solid ${tokens === 0 ? 'rgba(239,68,68,0.25)' : 'rgba(102,68,255,0.25)'}`,
              fontSize: '12px',
              fontWeight: 600,
              color: tokens === 0 ? '#f87171' : '#a090ff',
              cursor: 'default',
            }}
            title={
              tokens === 0
                ? 'Geen tokens meer, koop tokens om analyses te doen'
                : `${tokens} analyse${tokens === 1 ? '' : 's'} beschikbaar`
            }
          >
            <Coins size={12} />
            {tokens}
          </div>
        )}

        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="hidden sm:block"
            style={{
              color: 'rgba(255,255,255,0.38)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '6px 8px',
              borderRadius: '6px',
              minHeight: '44px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)';
            }}
          >
            Admin
          </button>
        )}

        {!hideSignOut && (
          <button
            onClick={() => signOut().then(() => navigate('/auth'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'rgba(255,255,255,0.38)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '6px 8px',
              borderRadius: '6px',
              transition: 'color 0.15s',
              minHeight: '44px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)';
            }}
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Uitloggen</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default AppNav;