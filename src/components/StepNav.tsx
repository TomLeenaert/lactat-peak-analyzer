import { useLang } from '@/contexts/LanguageContext';

interface StepNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasResults: boolean;
}

const StepNav = ({ activeTab, onTabChange, hasResults }: StepNavProps) => {
  const { t } = useLang();

  const STEPS = [
    { key: 'data', label: t('step.test') },
    { key: 'analyze', label: t('step.analyze') },
  ];

  return (
    <div
      role="tablist"
      aria-label="Test sections"
      style={{
        display: 'inline-flex',
        background: 'var(--wb-surface)',
        border: '1px solid var(--wb-border)',
        borderRadius: '10px',
        padding: '3px',
        gap: '2px',
      }}
    >
      {STEPS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const isDisabled = key === 'analyze' && !hasResults;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            onClick={() => !isDisabled && onTabChange(key)}
            className="wb-focus wb-transition"
            style={{
              padding: '7px 18px',
              borderRadius: '7px',
              border: 'none',
              background: isActive ? 'var(--wb-surface-2)' : 'transparent',
              boxShadow: isActive ? 'inset 0 0 0 1px var(--wb-border-2)' : 'none',
              color: isActive ? 'var(--wb-text)' : 'var(--wb-text-dim)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '12.5px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.4 : 1,
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
