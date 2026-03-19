import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

const AppNav = ({ backTo, backLabel, title, rightContent, hideSignOut }: AppNavProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

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
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
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
            }}
          >
            <ArrowLeft size={14} />
            {backLabel ?? 'Terug'}
          </button>
        ) : (
          <a
            href="/"
            style={{ color: '#fff', textDecoration: 'none', fontSize: '17px', flexShrink: 0 }}
          >
            Lac<span style={{ color: '#6644ff' }}>.</span>Test
          </a>
        )}

        {title && (
          <span
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '13px',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              paddingLeft: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {rightContent}
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
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)')}
          >
            <LogOut size={13} />
            Uitloggen
          </button>
        )}
      </div>
    </nav>
  );
};

export default AppNav;
