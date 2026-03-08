const steps = [
  { num: '!', title: '48u voor de test', desc: 'Geen zware training. Rust of lichte activiteit maximaal.' },
  { num: '!', title: 'Voeding', desc: 'Geen voedsel 2u voor de test. Geen cafeïne 4u voor de test. Goed gehydrateerd. Normale koolhydraatinname de dag ervoor.' },
  { num: '!', title: 'Materiaal nodig', desc: 'Lactaatmeter (bv. Lactate Plus / Lactate Pro 2), teststrips, lancetten (dikkere naald, 28G), alcoholdoekjes, papieren handdoek, hartslagband, loopband (1% helling).' },
];

const testSteps = [
  { num: '1', title: 'Rustmeting', desc: 'Meet rustlactaat vóór de warming-up. Dit is je baseline. Normaal: 0.5–1.5 mmol/L. Bij >2.5 mmol/L: check voeding/stress.' },
  { num: '2', title: 'Warming-up (15 min)', desc: 'Lichte jog op 60-65% HFmax (~8 km/h). Bouw op tot licht bezweet. Eindig met 2–3 korte versnellingen (10s). Dit activeert het aeroob systeem volledig en verlaagt startlactaat.' },
  { num: '3', title: 'Eerste stap', desc: 'Start op een snelheid ~3–4 km/h onder je vermoedelijke LT1. Voor een getrainde loper (5K in 19:00): start rond 9–10 km/h. Loopband op 1% helling.' },
  { num: '4', title: 'Stappen van 5 minuten', desc: 'Loop 5 minuten per stap. Verhoog snelheid met 1 km/h per stap. Na elke 5 min: 30s pauze voor bloedafname (vingerprik of oorlel).' },
  { num: '5', title: 'Bloedafname', desc: 'Reinig de prikplaats met alcohol. Prik, veeg eerste druppel weg, test de tweede druppel. Noteer: lactaat (mmol/L), hartslag (einde stap), RPE (1-10).' },
  { num: '6', title: 'Doorgaan tot...', desc: 'Ga door tot: lactaat > 8 mmol/L, OF uitputting, OF 1–2 stappen voorbij vermoedelijk LT2. Doel: minstens 6–8 datapunten waarvan 2+ boven de knik.' },
  { num: '7', title: 'Cooling down', desc: '10–15 min uitlopen op lage intensiteit. Eventueel nog een laatste lactaatmeting na 5 min cooldown.' },
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

const ProtocolTab = () => (
  <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
    <div className="p-4 border-b border-border">
      <h3 className="text-xl font-semibold">Testprotocol Lactaat Stappentest (Loopband)</h3>
    </div>
    <div className="p-6">
      <div className="bg-accent/10 border border-primary/20 rounded-lg p-4 mb-6 text-sm leading-relaxed">
        <strong className="text-primary">Wetenschappelijke basis:</strong> Dit protocol is gebaseerd op het gevalideerde stapsgewijze incrementele protocol (Heck et al., 1985; Mader, 1976). Stapblokken van 5 minuten garanderen een lactaat-steady-state per stap, wat nodig is voor betrouwbare drempelbepaling.
      </div>

      <h4 className="text-lg font-semibold mb-4">Voorbereiding (dag ervoor)</h4>
      {steps.map((s, i) => <ProtocolStep key={i} {...s} />)}

      <h4 className="text-lg font-semibold mb-4 mt-6">Testverloop</h4>
      {testSteps.map((s, i) => <ProtocolStep key={i} {...s} />)}
    </div>
  </div>
);

export default ProtocolTab;
