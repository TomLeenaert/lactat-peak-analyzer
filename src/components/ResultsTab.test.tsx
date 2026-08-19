import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ResultsTab from '@/components/ResultsTab';
import type { CalculationResults } from '@/lib/lactate-math';

const baseResults: CalculationResults = {
  coeffs: [0, 0, 0.2, 1.0],
  r2: 0.98,
  speeds: [10, 11, 12, 13, 14, 15],
  lactates: [1.2, 1.5, 1.8, 2.2, 2.7, 3.2],
  hrs: [120, 130, 140, 150, 160, 170],
  watts: [],
  restLac: 1.0,
  minActiveLac: 1.2,
  lt1: { obla: null, bsln: 1.2, loglog: 10.5, best: 11.0, method: 'Base+0.5', hr: 130, watt: 0 },
  lt2: { obla: null, dmax: 14.0, moddmax: 14.2, best: 14.2, method: 'ModDmax', hr: 160, watt: 0, oblaReached: false },
  modStartIdx: 0,
  curveType: 'cubic',
  quality: { r2: 0.98, rmse: 0.15, fitQuality: 'good' },
  warnings: [
    { severity: 'warning', code: 'OBLA_NOT_REACHED', message: 'OBLA niet bereikt; LT2 is een schatting op basis van de curve.' },
  ],
};

const wrapper = ({ children }: { children?: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('ResultsTab OBLA not reached', () => {
  it('shows the anaerobic threshold as not determined and surfaces warnings', () => {
    render(<ResultsTab results={baseResults} athleteName="Test" testDate="2026-05-20" />, { wrapper });

    expect(screen.getByText(/niet bepaalbaar/i)).toBeInTheDocument();
    expect(screen.getAllByText(/OBLA niet bereikt/i).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/Zones vanaf de anaerobe drempel zijn schattingen — de test bereikte geen 4\.0 mmol\/L\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/OBLA niet bereikt; LT2 is een schatting op basis van de curve\./i)
    ).toBeInTheDocument();
  });

  it('renders normal values when oblaReached is true', () => {
    const results: CalculationResults = {
      ...baseResults,
      lt2: { ...baseResults.lt2, oblaReached: true },
      warnings: [],
    };
    render(<ResultsTab results={results} athleteName="Test" testDate="2026-05-20" />, { wrapper });

    expect(screen.queryByText(/niet bepaalbaar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/OBLA niet bereikt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zones vanaf de anaerobe drempel zijn schattingen/i)).not.toBeInTheDocument();
  });

  it('renders normal values for older saved tests without oblaReached field', () => {
    const lt2WithoutFlag = { ...baseResults.lt2 };
    delete (lt2WithoutFlag as { oblaReached?: boolean }).oblaReached;
    const results: CalculationResults = { ...baseResults, lt2: lt2WithoutFlag, warnings: [] };
    render(<ResultsTab results={results} athleteName="Test" testDate="2026-05-20" />, { wrapper });

    expect(screen.queryByText(/niet bepaalbaar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/OBLA niet bereikt/i)).not.toBeInTheDocument();
  });
});

describe('ResultsTab fit quality chip', () => {
  it('renders the chip with label, steps, curve type and R² when quality exists', () => {
    render(<ResultsTab results={baseResults} athleteName="Test" testDate="2026-05-20" />, { wrapper });

    expect(screen.getByText(/Fit: goed/i)).toBeInTheDocument();
    expect(screen.getByText(/\(6 trappen, cubic\) · R² 0,98|\(6 trappen, cubic\) · R² 0\.98/)).toBeInTheDocument();
  });

  it('does not render the chip and does not crash when quality is missing', () => {
    const results = { ...baseResults, warnings: [] } as CalculationResults;
    delete (results as { quality?: unknown }).quality;
    render(<ResultsTab results={results} athleteName="Test" testDate="2026-05-20" />, { wrapper });

    expect(screen.queryByText(/Fit: goed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fit: matig/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fit: zwak/i)).not.toBeInTheDocument();
  });
});

