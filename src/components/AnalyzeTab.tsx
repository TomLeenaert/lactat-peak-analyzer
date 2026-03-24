import { type CalculationResults } from '@/lib/lactate-math';
import ResultsTab from '@/components/ResultsTab';
import ZonesTab from '@/components/ZonesTab';

interface AnalyzeTabProps {
  results: CalculationResults | null;
  testId?: string;
  athleteName?: string;
  testDate?: string;
}

const AnalyzeTab = ({ results, testId, athleteName, testDate }: AnalyzeTabProps) => {
  if (!results) {
    return (
      <div style={{
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif' }}>
          Eerst data invoeren en berekenen om resultaten te zien.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ResultsTab results={results} testId={testId} athleteName={athleteName} testDate={testDate} />
      <ZonesTab results={results} />
    </div>
  );
};

export default AnalyzeTab;
