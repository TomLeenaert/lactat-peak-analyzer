import { ClipboardList, Flame, Timer, Wind, BarChart2 } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasResults: boolean;
}

const TABS = [
  { key: 'protocol', label: 'PREP',   Icon: ClipboardList },
  { key: 'warmup',   label: 'WARMUP', Icon: Flame },
  { key: 'data',     label: 'TEST',   Icon: Timer },
  { key: 'zones',    label: 'COOL',   Icon: Wind },
  { key: 'results',  label: 'DATA',   Icon: BarChart2 },
];

const BottomNav = ({ activeTab, onTabChange, hasResults }: BottomNavProps) => {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 8px 20px',
      background: '#131313',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      zIndex: 50,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.6)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
    }}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        const isDisabled = (key === 'results' || key === 'zones') && !hasResults;
        return (
          <button
            key={key}
            onClick={() => !isDisabled && onTabChange(key)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 14px',
              borderRadius: '4px',
              border: 'none',
              cursor: isDisabled ? 'default' : 'pointer',
              background: isActive ? '#201f1f' : 'transparent',
              outline: isActive ? '2px solid #00fdc1' : 'none',
              outlineOffset: '-2px',
              boxShadow: isActive ? '0 0 12px rgba(0,253,193,0.35)' : 'none',
              opacity: isDisabled ? 0.3 : 1,
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
              minWidth: '56px',
            }}
          >
            <Icon
              size={18}
              style={{
                marginBottom: '3px',
                color: isActive ? '#00fdc1' : '#777575',
                strokeWidth: isActive ? 2.5 : 1.75,
              }}
            />
            <span style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 700,
              fontSize: '9px', letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: isActive ? '#00fdc1' : '#777575',
              lineHeight: 1,
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
