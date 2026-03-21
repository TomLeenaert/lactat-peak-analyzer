interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasResults: boolean;
}

const TABS = [
  { key: 'protocol', emoji: '📋', label: 'PREP' },
  { key: 'data',     emoji: '📊', label: 'TEST' },
  { key: 'results',  emoji: '🎯', label: 'DATA' },
  { key: 'zones',    emoji: '🏃', label: 'ZONES' },
  { key: 'science',  emoji: '📚', label: 'INFO' },
];

const BottomNav = ({ activeTab, onTabChange, hasResults }: BottomNavProps) => {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(9,9,13,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'stretch',
      height: '72px',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        const isDisabled = (tab.key === 'results' || tab.key === 'zones') && !hasResults;
        return (
          <button
            key={tab.key}
            onClick={() => !isDisabled && onTabChange(tab.key)}
            disabled={isDisabled}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              cursor: isDisabled ? 'default' : 'pointer',
              padding: '8px 4px',
              position: 'relative',
              transition: 'opacity 0.15s',
              opacity: isDisabled ? 0.3 : 1,
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                background: '#6644ff',
                borderRadius: '0 0 2px 2px',
                boxShadow: '0 0 8px rgba(102,68,255,0.8)',
              }} />
            )}
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.emoji}</span>
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.8px',
              color: isActive ? '#a090ff' : 'rgba(255,255,255,0.35)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
