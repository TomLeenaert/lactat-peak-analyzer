interface NumPadProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
  unit: string;
  color?: string;
  maxValue?: number;
  decimalPlaces?: number;
}

const NumPad = ({ value, onChange, label, unit, color = '#6644ff', maxValue = 30, decimalPlaces = 1 }: NumPadProps) => {
  const handleKey = (key: string) => {
    if (key === '←') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '.' && value.includes('.')) return;
    if (key === '.' && value === '') { onChange('0.'); return; }
    // max decimal places
    if (decimalPlaces === 0 && key === '.') return;
    const parts = (value + key).split('.');
    if (parts[1] && parts[1].length > decimalPlaces) return;
    // max value
    const next = value + key;
    if (parseFloat(next) > maxValue) return;
    onChange(next);
  };

  const KEYS = ['1','2','3','4','5','6','7','8','9','.','0','←'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Display */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: `2px solid ${color}40`,
        borderRadius: '16px',
        padding: '20px 24px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          color: color,
          textTransform: 'uppercase',
          marginBottom: '8px',
          opacity: 0.9,
        }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#fff',
            fontFamily: '"Inter", system-ui, monospace',
            lineHeight: 1,
            letterSpacing: '-2px',
            minWidth: '120px',
            display: 'inline-block',
            textAlign: 'center',
          }}>
            {value || '—'}
          </span>
          <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{unit}</span>
        </div>
      </div>

      {/* Keys */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}>
        {KEYS.map(key => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            style={{
              height: '72px',
              fontSize: key === '←' ? '22px' : '28px',
              fontWeight: 700,
              color: key === '←' ? 'rgba(255,255,255,0.5)' : '#fff',
              background: key === '←'
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(255,255,255,0.05)',
              border: key === '←'
                ? '1px solid rgba(239,68,68,0.2)'
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.1s',
              fontFamily: '"Inter", system-ui, monospace',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
            }}
            onPointerDown={e => {
              (e.currentTarget as HTMLButtonElement).style.background =
                key === '←' ? 'rgba(239,68,68,0.25)' : `${color}25`;
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
            }}
            onPointerUp={e => {
              (e.currentTarget as HTMLButtonElement).style.background =
                key === '←' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NumPad;
