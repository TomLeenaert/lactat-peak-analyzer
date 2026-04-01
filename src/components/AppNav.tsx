import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import logoSrc from '@/assets/screen.png';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLang } from '@/contexts/LanguageContext';

interface AppNavProps {
  backTo?: string;
  backLabel?: string;
  title?: string;
  rightContent?: React.ReactNode;
  hideSignOut?: boolean;
}

const ADMIN_EMAIL = 'tomleenaert@gmail.com';
const DEMO_EMAIL = 'coach@demo.mylactest.com';

const AppNav = ({ backTo, backLabel, title, rightContent, hideSignOut }: AppNavProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { t } = useLang();
  const isDemo = user?.email === DEMO_EMAIL;

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      {isDemo && (
        <div
          style={{
            width: '100%',
            background: 'rgba(189,157,255,0.08)',
            borderBottom: '1px solid rgba(189,157,255,0.2)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{t('nav.demoNotice')}</span>
          <button
            onClick={() => { signOut().then(() => navigate('/auth')); }}
            style={{
              color: '#bd9dff',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 8px',
            }}
          >
            {t('nav.startFree')}
          </button>
        </div>
      )}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
        {backTo ? (
          <button
            onClick={() => navigate(backTo)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '13px', padding: '6px 0',
              whiteSpace: 'nowrap', flexShrink: 0, minHeight: '44px',
            }}
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{backLabel ?? t('common.back')}</span>
          </button>
        ) : (
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
            <img src={logoSrc} alt="MyLactest" style={{ width: '44px', height: '44px', objectFit: 'contain', mixBlendMode: 'lighten', filter: 'drop-shadow(0 2px 8px rgba(139,74,255,0.25))' }} />
            <span style={{ fontSize: '17px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>MyLactest</span>
          </a>
        )}

        {title && (
          <span className="hidden sm:block" style={{
            color: 'rgba(255,255,255,0.55)', fontSize: '13px',
            borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '10px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {rightContent}


        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="hidden sm:block"
            style={{
              color: 'rgba(255,255,255,0.38)', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '12px', padding: '6px 8px', borderRadius: '6px', minHeight: '44px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)'; }}
          >
            Admin
          </button>
        )}

        {!hideSignOut && (
          <button
            onClick={() => signOut().then(() => navigate('/auth'))}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              color: 'rgba(255,255,255,0.38)', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '12px', padding: '6px 8px', borderRadius: '6px',
              transition: 'color 0.15s', minHeight: '44px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)'; }}
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">{t('nav.signOut')}</span>
          </button>
        )}
      </div>
    </nav>
    </>
  );
};

export default AppNav;
