import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { ProtocolSettings } from '@/lib/protocol-types';
import { formatPace } from '@/lib/lactate-math';
import PaceInput, { PaceIncrementInput } from './PaceInput';

interface ProtocolTabProps {
  protocol: ProtocolSettings;
  setProtocol: (p: ProtocolSettings) => void;
  onGenerateSteps: () => void;
}

const prepSteps = [
  { num: '!', title: '48u voor de test', desc: 'Geen zware training. Rust of lichte activiteit maximaal.' },
  { num: '!', title: 'Voeding', desc: 'Geen voedsel 2u voor de test. Geen cafeïne 4u voor de test. Goed gehydrateerd. Normale koolhydraatinname de dag ervoor.' },
  { num: '!', title: 'Materiaal nodig', desc: 'Lactaatmeter (bv. Lactate Plus / Lactate Pro 2), teststrips, lancetten (dikkere naald, 28G), alcoholdoekjes, papieren handdoek, hartslagband, loopband (1% helling).' },
];

const ProtocolStep = ({ num, title, desc }: { num: string; title: string; desc: string }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
      {num}
    </div>
    <div>
      <h4 className="text-base font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground m-0">{desc}</p>
    </div>
  </div>
);

/** Convert pace increment (seconds faster) to km/h increment at a given base speed */
function paceSecToSpeedIncrement(baseSpeedKmh: number, paceIncrementSec: number): number {
  const basePaceMin = 60 / baseSpeedKmh;
  const newPaceMin = basePaceMin - paceIncrementSec / 60;
  if (newPaceMin <= 0) return 1;
  const newSpeed = 60 / newPaceMin;
  return newSpeed - baseSpeedKmh;
}

const ProtocolTab = ({ protocol, setProtocol, onGenerateSteps }: ProtocolTabProps) => {
  const update = (field: keyof ProtocolSettings, value: number | boolean) => {
    setProtocol({ ...protocol, [field]: value });
  };

  // Generate preview speeds using pace-based increments
  const previewSpeeds: number[] = [];
  let currentSpeed = protocol.startSpeed;
  for (let i = 0; i < protocol.numberOfSteps; i++) {
    previewSpeeds.push(currentSpeed);
    const currentPaceMin = 60 / currentSpeed;
    const nextPaceMin = currentPaceMin - protocol.paceIncrementSec / 60;
    if (nextPaceMin <= 0) break;
    currentSpeed = 60 / nextPaceMin;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Protocol instellen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-accent/10 border border-primary/20 rounded-lg p-4 mb-6 text-sm leading-relaxed">
            <strong className="text-primary">Pas je protocol aan:</strong> Stel het starttempo, het tempo-increment en de stapafstand in. Je kunt ook een laatste all-out inspanning toevoegen voor VO₂max-bepaling.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Starttempo (min/km)</Label>
              <PaceInput
                speedKmh={protocol.startSpeed}
                onChange={v => update('startSpeed', v)}
              />
              <p className="text-xs text-muted-foreground mt-1">Tempo van de eerste stap</p>
            </div>
            <div>
              <Label>Increment (mm:ss sneller)</Label>
              <PaceIncrementInput
                seconds={protocol.paceIncrementSec}
                onChange={v => update('paceIncrementSec', v)}
              />
              <p className="text-xs text-muted-foreground mt-1">Hoeveel sneller per stap</p>
            </div>
            <div>
              <Label>Stapafstand (meter)</Label>
              <Input
                type="number"
                step="100"
                min={400}
                max={3000}
                value={protocol.stepDistance}
                onChange={e => update('stepDistance', parseInt(e.target.value) || 1600)}
              />
              <p className="text-xs text-muted-foreground mt-1">Typisch: 1200m, 1600m of 2000m</p>
            </div>
          </div>

          {/* All-out sectie */}
          <div className="border border-border rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold">🏁 Laatste all-out inspanning</h4>
                <p className="text-sm text-muted-foreground">Voeg een maximale inspanning toe na de laatste stap (voor VO₂max/MAS bepaling)</p>
              </div>
              <Switch
                checked={protocol.allOutEnabled}
                onCheckedChange={v => update('allOutEnabled', v)}
              />
            </div>
            {protocol.allOutEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Afstand (meter)</Label>
                  <Input
                    type="number"
                    step="100"
                    value={protocol.allOutDistance}
                    onChange={e => update('allOutDistance', parseInt(e.target.value) || 800)}
                    placeholder="bv. 800"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Typisch: 800m of 1000m</p>
                </div>
                <div>
                  <Label>Max duur (seconden)</Label>
                  <Input
                    type="number"
                    step="10"
                    value={protocol.allOutDuration}
                    onChange={e => update('allOutDuration', parseInt(e.target.value) || 180)}
                    placeholder="bv. 180"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Veiligheidsgrens, typisch 3-5 min</p>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="border border-border rounded-xl p-5 mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">📋 Protocol preview</h4>
            <div className="space-y-2">
              {previewSpeeds.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/60 hover:bg-muted transition-colors px-4 py-3 rounded-lg">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 flex items-baseline gap-2">
                    <span className="font-semibold text-sm">{formatPace(s)} /km</span>
                    <span className="text-muted-foreground text-xs">({s.toFixed(1)} km/h)</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{protocol.stepDistance}m</span>
                </div>
              ))}
              {protocol.allOutEnabled && (
                <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-lg">
                  <span className="w-7 h-7 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs shrink-0">
                    🏁
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-destructive">All-out</span>
                  </div>
                  <span className="text-xs text-destructive font-mono">{protocol.allOutDistance}m (max {protocol.allOutDuration}s)</span>
                </div>
              )}
            </div>
          </div>

          <Button onClick={onGenerateSteps} className="w-full">
            📊 Genereer stappen → Data Invoer
          </Button>
        </CardContent>
      </Card>

      {/* Bestaand protocol info */}
      <Card>
        <CardHeader>
          <CardTitle>Testprotocol richtlijnen</CardTitle>
        </CardHeader>
        <CardContent>
          <h4 className="text-lg font-semibold mb-4">Voorbereiding (dag ervoor)</h4>
          {prepSteps.map((s, i) => <ProtocolStep key={i} {...s} />)}

          <h4 className="text-lg font-semibold mb-4 mt-6">Testverloop</h4>
          <ProtocolStep num="1" title="Rustmeting" desc="Meet rustlactaat vóór de warming-up. Dit is je baseline. Normaal: 0.5–1.5 mmol/L. Bij >2.5 mmol/L: check voeding/stress." />
          <ProtocolStep num="2" title="Warming-up (15 min)" desc={`Lichte jog op 60-65% HFmax (~${formatPace(8)} /km). Bouw op tot licht bezweet. Eindig met 2–3 korte versnellingen (10s).`} />
          <ProtocolStep num="3" title={`Stappen van ${protocol.stepDistance}m`} desc={`Loop ${protocol.stepDistance}m per stap. Start op ${formatPace(protocol.startSpeed)} /km, verhoog het tempo met ${protocol.paceIncrementSec}s per stap. Na elke stap: 30s pauze voor bloedafname.`} />
          <ProtocolStep num="4" title="Bloedafname" desc="Reinig de prikplaats met alcohol. Prik, veeg eerste druppel weg, test de tweede druppel. Noteer: lactaat (mmol/L), hartslag (einde stap), RPE (1-10)." />
          {protocol.allOutEnabled && (
            <ProtocolStep num="5" title={`All-out: ${protocol.allOutDistance}m`} desc={`Na de laatste reguliere stap: maximale inspanning over ${protocol.allOutDistance}m (max ${protocol.allOutDuration}s). Meet hartslag en lactaat direct na afloop en na 1 min rust.`} />
          )}
          <ProtocolStep num={protocol.allOutEnabled ? '6' : '5'} title="Cooling down" desc="10–15 min uitlopen op lage intensiteit. Eventueel nog een laatste lactaatmeting na 5 min cooldown." />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProtocolTab;
