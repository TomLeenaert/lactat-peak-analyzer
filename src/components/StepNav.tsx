interface StepNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasResults: boolean;
}

const STEPS = [
  { key: 'protocol', label: 'GET SET.' },
  { key: 'data',     label: 'TEST.' },
  { key: 'analyze',  label: 'ANALYZE.' },
];

const StepNav = ({ activeTab, onTabChange, hasResults }: StepNavProps) => {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      width: '100%',
    }}>
      {/* Connecting line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '10%',
        right: '10%',
        height: '2px',
        background: 'linear-gradient(90deg, #00fdc1, #6644ff)',
        transform: 'translateY(-50%)',
        zIndex: 0,
      }} />

      {STEPS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const isDisabled = key === 'analyze' && !hasResults;
        return (
          <button
            key={key}
            onClick={() => !isDisabled && onTabChange(key)}
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '10px 24px',
              borderRadius: '999px',
              border: isActive ? '2px solid #6644ff' : '2px solid rgba(102,68,255,0.3)',
              background: isActive ? '#6644ff' : '#1a1a2e',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: isDisabled ? 'default' : 'pointer',
              opacity: isDisabled ? 0.3 : 1,
              transition: 'all 0.2s ease',
              boxShadow: isActive ? '0 0 20px rgba(102,68,255,0.5)' : 'none',
              WebkitTapHighlightColor: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default StepNav;
