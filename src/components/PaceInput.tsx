import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatPace } from '@/lib/lactate-math';

interface PaceInputProps {
  speedKmh: number;
  onChange: (speedKmh: number) => void;
  className?: string;
}

/** Parses "M:SS" pace string to km/h */
function parsePace(pace: string): number | null {
  const colonMatch = pace.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1]);
    const secs = parseInt(colonMatch[2]);
    const totalMin = mins + secs / 60;
    if (totalMin <= 0) return null;
    return 60 / totalMin;
  }
  const num = parseFloat(pace);
  if (!isNaN(num) && num > 0) return 60 / num;
  return null;
}

const PaceInput = ({ speedKmh, onChange, className = '' }: PaceInputProps) => {
  const [value, setValue] = useState(speedKmh > 0 ? formatPace(speedKmh) : '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setValue(speedKmh > 0 ? formatPace(speedKmh) : '');
    }
  }, [speedKmh, focused]);

  const handleBlur = () => {
    setFocused(false);
    if (!value.trim()) { onChange(0); return; }
    const parsed = parsePace(value.trim());
    if (parsed !== null) {
      onChange(Math.round(parsed * 100) / 100);
      setValue(formatPace(parsed));
    } else {
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

// --- Increment input (seconds) ---

interface PaceIncrementInputProps {
  seconds: number;
  onChange: (seconds: number) => void;
  className?: string;
}

function formatIncrementSec(sec: number): string {
  if (sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseIncrement(val: string): number | null {
  const colonMatch = val.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  }
  const num = parseInt(val);
  if (!isNaN(num) && num >= 0) return num; // plain seconds
  return null;
}

export const PaceIncrementInput = ({ seconds, onChange, className = '' }: PaceIncrementInputProps) => {
  const [value, setValue] = useState(formatIncrementSec(seconds));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setValue(formatIncrementSec(seconds));
  }, [seconds, focused]);

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseIncrement(value.trim());
    if (parsed !== null) {
      onChange(parsed);
      setValue(formatIncrementSec(parsed));
    } else {
      setValue(formatIncrementSec(seconds));
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
