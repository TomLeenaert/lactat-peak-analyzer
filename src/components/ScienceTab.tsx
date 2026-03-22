import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MethodTag = ({ type, children }: { type: 'obla' | 'dmax' | 'bsln'; children: React.ReactNode }) => {
  const colors = {
    obla: 'bg-primary/10 text-primary',
    dmax: 'bg-warning/15 text-warning',
    bsln: 'bg-green-500/10 text-green-600',
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-1 ${colors[type]}`}>{children}</span>;
};

const ScienceTab = () => (
  <Card>
    <CardHeader><CardTitle>Gebruikte berekeningsmethoden</CardTitle></CardHeader>
    <CardContent className="space-y-6 text-sm leading-relaxed">
      <div>
        <h4 className="text-base font-semibold mb-2">Polynoomfit (3e graad)</h4>
        <p className="text-muted-foreground">De lactaatwaarden worden gefit met een 3e-graads polynoom: <strong className="text-foreground">y = ax³ + bx² + cx + d</strong>. Dit is de standaardmethode in sportfysiologie (Cheng et al., 1992; Heck et al., 1985). De coëfficiënt van determinatie (R²) geeft de kwaliteit van de fit aan.</p>
      </div>

      <div>
        <h4 className="text-base font-semibold mb-2">LT1 — Aerobe drempel</h4>
        <p className="text-muted-foreground mb-2">Drie methoden worden parallel berekend:</p>
        <p className="text-muted-foreground"><MethodTag type="obla">OBLA 2.0</MethodTag> Vaste waarde van 2.0 mmol/L op de polynoomcurve (Kindermann et al., 1979; Skinner & McLellan, 1980). Eenvoudig maar niet individueel.</p>
        <p className="text-muted-foreground"><MethodTag type="bsln">Baseline+0.5</MethodTag> De snelheid waarbij lactaat 0.5 mmol/L boven de laagste actieve waarde stijgt (Zoladz et al., 1995). Meer individueel dan OBLA.</p>
        <p className="text-muted-foreground"><MethodTag type="dmax">Log-Log</MethodTag> Logaritmische transformatie van lactaat vs. snelheid, met segmented regression (Beaver et al., 1985). Meest objectief voor LT1.</p>
      </div>

      <div>
        <h4 className="text-base font-semibold mb-2">LT2 — Anaerobe drempel</h4>
        <p className="text-muted-foreground"><MethodTag type="obla">OBLA 4.0</MethodTag> Vaste waarde van 4.0 mmol/L. Enkel valide bij exact het Mader-protocol (5 min stappen, +0.4 m/s, 1% helling, 30s rust). Anders slechts indicatief (Mader & Heck, 1985).</p>
        <p className="text-muted-foreground"><MethodTag type="dmax">Dmax</MethodTag> Maximale loodrechte afstand van de polynoomcurve tot de lijn tussen eerste en laatste meetpunt (Cheng et al., 1992).</p>
        <p className="text-muted-foreground"><MethodTag type="dmax">Modified Dmax</MethodTag> Zoals Dmax, maar startpunt = het punt vóór de eerste lactaatstijging &gt;0.4 mmol/L (Bishop et al., 1998). Vaak nauwkeuriger voor atleten.</p>
      </div>

      <div>
        <h4 className="text-base font-semibold mb-2">Trainingszones</h4>
        <p className="text-muted-foreground">Het 5-zone model (Seiler, 2010) verdeelt de intensiteit op basis van LT1 en LT2:</p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Zone 1</strong> (Herstel): &lt;1.5 mmol/L<br />
          <strong className="text-foreground">Zone 2</strong> h(Aeroob): 1.5–2.0 mmol/L<br />
          <strong className="text-foreground">Zone 3</strong> (Tempo): 2.0–3.0 mmol/L<br />
          <strong className="text-foreground">Zone 4</strong> (Drempel): 3.0–4.0 mmol/L<br />
          <strong className="text-foreground">Zone 5</strong> (VO₂max): &gt;4.0 mmol/L
        </p>
      </div>

      <div>
        <h4 className="text-base font-semibold mb-2">Referenties</h4>
        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
          <li>Mader, A. et al. (1976). Zur Beurteilung der sportartspezifischen Ausdauerleistungsfähigkeit im Labor.</li>
          <li>Heck, H. et al. (1985). Justification of the 4-mmol/l lactate threshold. <em>Int J Sports Med</em>.</li>
          <li>Kindermann, W. et al. (1979). The significance of the aerobic-anaerobic transition.</li>
          <li>Cheng, B. et al. (1992). A new approach for the determination of ventilatory and lactate thresholds. <em>Int J Sports Med</em>.</li>
          <li>Bishop, D. et al. (1998). Reliability of a 1-h endurance performance test. <em>Med Sci Sports Exerc</em>.</li>
          <li>Beaver, W.L. et al. (1985). A new method for detecting anaerobic threshold. <em>J Appl Physiol</em>.</li>
          <li>Zoladz, J.A. et al. (1995). Non-linear relationship between O2 uptake and power output.</li>
          <li>Seiler, S. (2010). What is Best Practice for Training Intensity and Duration Distribution. <em>IJSPP</em>.</li>
          <li>Beneke, R. et al. (2011). Blood lactate diagnostics in exercise testing and training. <em>IJSPP</em>.</li>
        </ul>
      </div>
    </CardContent>
  </Card>
);

export default ScienceTab;
