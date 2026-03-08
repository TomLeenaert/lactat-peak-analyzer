import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { ProtocolSettings } from '@/lib/protocol-types';
import { formatPace, type StepData } from '@/lib/lactate-math';

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

const ProtocolTab = ({ protocol, setProtocol, onGenerateSteps }: ProtocolTabProps) => {
  const update = (field: keyof ProtocolSettings, value: number | boolean) => {
    setProtocol({ ...protocol, [field]: value });
  };

  // Preview van de stappen
  const previewSpeeds = Array.from({ length: protocol.numberOfSteps }, (_, i) =>
    protocol.startSpeed + i * protocol.stepIncrement
  );

  return (
    <div className="space-y-6">
      {/* Protocol instellingen */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Protocol instellen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-accent/10 border border-primary/20 rounded-lg p-4 mb-6 text-sm leading-relaxed">
            <strong className="text-primary">Pas je protocol aan:</strong> Stel de startsnelheid, het aantal stappen, de stapduur en het increment in. Je kunt ook een laatste all-out inspanning toevoegen voor VO₂max-bepaling.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Startsnelheid (km/h)</Label>
              <Input
                type="number"
                step="0.5"
                value={protocol.startSpeed}
                onChange={e => update('startSpeed', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Increment (km/h per stap)</Label>
              <Input
                type="number"
                step="0.5"
                value={protocol.stepIncrement}
                onChange={e => update('stepIncrement', parseFloat(e.target.value) || 0.5)}
              />
            </div>
            <div>
              <Label>Stapduur (minuten)</Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={protocol.stepDuration}
                onChange={e => update('stepDuration', parseInt(e.target.value) || 5)}
              />
            </div>
            <div>
              <Label>Aantal stappen</Label>
              <Input
                type="number"
                min={4}
                max={15}
                value={protocol.numberOfSteps}
                onChange={e => update('numberOfSteps', parseInt(e.target.value) || 6)}
              />
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
          <div className="border border-border rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">📋 Protocol preview</h4>
            <div className="flex flex-wrap gap-2">
              {previewSpeeds.map((s, i) => (
                <div key={i} className="bg-muted px-3 py-1.5 rounded-md text-sm font-mono">
                  Stap {i + 1}: {s.toFixed(1)} km/h ({formatPace(s)}/km) × {protocol.stepDuration} min
                </div>
              ))}
              {protocol.allOutEnabled && (
                <div className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-md text-sm font-mono font-semibold">
                  🏁 All-out: {protocol.allOutDistance}m (max {protocol.allOutDuration}s)
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
          <ProtocolStep num="2" title="Warming-up (15 min)" desc="Lichte jog op 60-65% HFmax (~8 km/h). Bouw op tot licht bezweet. Eindig met 2–3 korte versnellingen (10s)." />
          <ProtocolStep num="3" title={`Stappen van ${protocol.stepDuration} minuten`} desc={`Loop ${protocol.stepDuration} minuten per stap. Start op ${protocol.startSpeed} km/h, verhoog met ${protocol.stepIncrement} km/h per stap. Na elke stap: 30s pauze voor bloedafname.`} />
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
