import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatPace } from '@/lib/lactate-math';

interface PaceInputProps {
  speedKmh: number;
  onChange: (speedKmh: number) => void;
  className?: string;
}

/** Parses "M:SS" or "M.SS" pace string to km/h */
function parsePace(pace: string): number | null {
  // Try M:SS format
  const colonMatch = pace.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1]);
    const secs = parseInt(colonMatch[2]);
    const totalMin = mins + secs / 60;
    if (totalMin <= 0) return null;
    return 60 / totalMin;
  }
  // Try plain number (treat as min/km decimal)
  const num = parseFloat(pace);
  if (!isNaN(num) && num > 0) {
    return 60 / num;
  }
  return null;
}

const PaceInput = ({ speedKmh, onChange, className = '' }: PaceInputProps) => {
  const [value, setValue] = useState(speedKmh > 0 ? formatPace(speedKmh) : '');
  const [focused, setFocused] = useState(false);

  // Sync external changes when not focused
  useEffect(() => {
    if (!focused) {
      setValue(speedKmh > 0 ? formatPace(speedKmh) : '');
    }
  }, [speedKmh, focused]);

  const handleBlur = () => {
    setFocused(false);
    if (!value.trim()) {
      onChange(0);
      return;
    }
    const parsed = parsePace(value.trim());
    if (parsed !== null) {
      onChange(Math.round(parsed * 100) / 100);
      setValue(formatPace(parsed));
    } else {
      // Reset to current
      setValue(speedKmh > 0 ? formatPace(speedKmh) : '');
    }
  };

  return (
    <Input
      type="text"
      className={`w-24 font-mono text-center ${className}`}
      value={value}
      placeholder="M:SS"
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
};

export default PaceInput;
