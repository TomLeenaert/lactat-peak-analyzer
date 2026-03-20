import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const COPY = {
  navHow: 'Hoe het werkt',
  navFeat: 'Mogelijkheden',
  navPrice: 'Vergelijking',
  navStart: 'Start gratis ->',
  eyebrow: 'Geen abonnement. Betaal €9.95 per test. Drempels en zones in seconden.',
  heroTitleA: 'Ken je drempels.',
  heroTitleB: 'Train met data.',
  heroDesc:
    'LacTest zet je veldtestdata om naar een volledig analyserapport met aerobe en anaerobe drempel, 5 trainingszones en een coach-klaar PDF.',
  cmdLabel: 'start',
  cmdText: 'lactest.app -> analyseer -> export.pdf',
  cta1: 'Start je analyse ->',
  cta2: 'Bekijk demo',
  featKicker: 'Wat is inbegrepen',
  featTitleA: 'Alles om slimmer te coachen,',
  featTitleB: 'in één testrapport.',
  featLead: 'Jij doet de veldtest. LacTest doet de rest — van polynoomfit tot coach-klaar PDF.',
  cmpKicker: 'Vergelijking',
  cmpTitleA: 'Lab-niveau inzicht.',
  cmpTitleB: 'Zonder lab-niveau kosten.',
  cmpLead: 'Een professionele drempeltest kost al snel €300–500 en meerdere werkdagen. LacTest doet het voor €9.95 in seconden.',
  ctaTitleA: 'Stop met gokken.',
  ctaTitleB: 'Train op basis van data.',
  ctaDesc: 'Je eerste analyse in minder dan 5 minuten. Betaal enkel bij export.',
  ctaBtn: 'Start gratis analyse ->',
  ctaNote: '€9.95 enkel bij rapport-download — geen abonnement',
  sceneTitle: 'Nieuwe lactaattest',
  sceneAthlete: 'Sarah Vermeulen - Lopen',
  analyse: 'Analyseer drempels',
  analysing: 'Berekenen...',
  rpAero: 'Aerobe drempel',
  rpAna: 'Anaerobe drempel',
  rpFit: 'Uitstekend',
  exportLabel: 'Rapport klaar — genereer PDF',
  exportBtn: 'Download PDF',
  zl: 'Z1 Herstel',
  footer: 'Gemaakt voor atleten',
} as const;

const ROWS = [
  ['7:04 /km', '1.2', '128'],
  ['6:19 /km', '1.4', '136'],
  ['5:43 /km', '1.8', '145'],
  ['5:11 /km', '2.4', '154'],
  ['4:48 /km', '3.1', '162'],
  ['4:27 /km', '4.0', '169'],
  ['4:03 /km', '6.2', '178'],
  ['3:38 /km', '9.4', '187'],
];

const Landing = () => {
  const navigate = useNavigate();

  const [showEntry, setShowEntry] = useState(false);
  const [rowsVisible, setRowsVisible] = useState(0);
  const [showAnalyse, setShowAnalyse] = useState(false);
  const [loadingAnalyse, setLoadingAnalyse] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [drawCurve, setDrawCurve] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [showThresh1, setShowThresh1] = useState(false);
  const [showThresh2, setShowThresh2] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const t = COPY;

  useEffect(() => {
    const timers: number[] = [];

    const clearAndReset = () => {
      setShowEntry(false);
      setRowsVisible(0);
      setShowAnalyse(false);
      setLoadingAnalyse(false);
      setShowResults(false);
      setDrawCurve(false);
      setShowDots(false);
      setShowThresh1(false);
      setShowThresh2(false);
      setShowZones(false);
      setShowExport(false);
    };

    const schedule = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
    };

    const run = () => {
      clearAndReset();
      let at = 0;
      schedule(at, () => setShowEntry(true));
      at += 200;

      ROWS.forEach((_, i) => {
        schedule(at + i * 320, () => setRowsVisible(i + 1));
      });
      at += ROWS.length * 320 + 400;

      schedule(at, () => setShowAnalyse(true));
      at += 900;

      schedule(at, () => setLoadingAnalyse(true));
      at += 1400;

      schedule(at, () => {
        setShowEntry(false);
        setShowResults(true);
      });
      at += 400;

      schedule(at, () => setDrawCurve(true));
      at += 800;

      schedule(at, () => setShowDots(true));
      at += 400;

      schedule(at, () => setShowThresh1(true));
      at += 400;

      schedule(at, () => setShowThresh2(true));
      at += 500;

      schedule(at, () => setShowZones(true));
      at += 600;

      schedule(at, () => setShowExport(true));
      at += 2800;

      schedule(at, run);
    };

    schedule(800, run);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div className="landing-page">
      <nav className="lp-nav">
        <a href="#" className="lp-nav-logo">Lac<span className="lp-nav-logo-dot">.</span>Test</a>
        <div className="lp-nav-links">
          <a className="lp-nav-link" href="#how-it-works">{t.navHow}</a>
          <a className="lp-nav-link" href="#features">{t.navFeat}</a>
          <a className="lp-nav-link" href="#pricing">{t.navPrice}</a>
        </div>
        <div className="lp-nav-right">
          <button className="lp-btn-start" onClick={() => navigate('/auth')}>{t.navStart}</button>
        </div>
      </nav>

      <section className="lp-hero-wrap" id="how">
        <div className="lp-hero">
          <div className="lp-hero-left">
            <div className="lp-hero-eyebrow">
              <span className="lp-hero-eyebrow-dot" />
              <span>{t.eyebrow}</span>
            </div>
            <h1 className="lp-h1">
              {t.heroTitleA}
              <br />
              <em>{t.heroTitleB}</em>
            </h1>
            <p className="lp-hero-desc">{t.heroDesc}</p>
            <div className="lp-hero-cmd">
              <span className="lp-hero-cmd-label">{t.cmdLabel}</span>
              <span className="lp-hero-cmd-text">{t.cmdText}</span>
            </div>
            <div className="lp-hero-actions">
              <button className="lp-hero-cta-primary" onClick={() => navigate('/auth')}>{t.cta1}</button>
              <button className="lp-hero-cta-secondary" onClick={() => { const el = document.getElementById('how-it-works'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>{t.cta2}</button>
            </div>
          </div>

          <div className="lp-demo-window" id="demo-live">
            <div className="lp-demo-chrome">
              <div className="lp-demo-dots">
                <div className="lp-demo-dot red" />
                <div className="lp-demo-dot yellow" />
                <div className="lp-demo-dot green" />
              </div>
              <div className="lp-demo-urlbar">lactest.app/analyse</div>
            </div>
            <div className="lp-demo-body">
              <div className="lp-demo-sidebar">
                <div className="lp-demo-sidebar-item active">A</div>
                <div className="lp-demo-sidebar-item">U</div>
                <div className="lp-demo-sidebar-item">R</div>
                <div className="lp-sidebar-spacer" />
                <div className="lp-demo-sidebar-item">S</div>
              </div>
              <div className="lp-demo-main">
                <div className={`lp-demo-scene ${showEntry ? 'visible' : ''}`}>
                  <div className="lp-scene-title">{t.sceneTitle}<span className="lp-scene-subtitle">{t.sceneAthlete}</span></div>
                  <table className="lp-data-table">
                    <thead>
                      <tr><th>Tempo</th><th>Lactaat</th><th>HR</th></tr>
                    </thead>
                    <tbody>
                      {ROWS.map((row, i) => (
                        <tr key={row[0]} className={`lp-data-row ${i < rowsVisible ? 'show' : ''}`}>
                          <td className="lp-td-pace">{row[0]}</td>
                          <td>{row[1]}</td>
                          <td className="lp-td-hr">{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className={`lp-analyse-btn ${showAnalyse ? 'show' : ''} ${loadingAnalyse ? 'loading' : ''}`}>
                    {loadingAnalyse ? `... ${t.analysing}` : t.analyse}
                  </button>
                  <div className={`lp-loading-bar ${loadingAnalyse ? 'show' : ''}`}>
                    <div className="lp-loading-bar-fill" style={{ width: loadingAnalyse ? '100%' : '0%' }} />
                  </div>
                </div>

                <div className={`lp-demo-scene ${showResults ? 'visible' : ''}`}>
                  <div className="lp-results-header">
                    <div className="lp-pill-wrap">
                      <div className="lp-result-pill"><span className="lp-rp-label">{t.rpAero}</span><span className="lp-rp-val teal">5:06 /km</span><span className="lp-rp-sub">~153 bpm</span></div>
                      <div className="lp-result-pill"><span className="lp-rp-label">{t.rpAna}</span><span className="lp-rp-val orange">4:14 /km</span><span className="lp-rp-sub">~172 bpm</span></div>
                      <div className="lp-result-pill"><span className="lp-rp-label">R2</span><span className="lp-rp-val purple">0.999</span><span className="lp-rp-sub">{t.rpFit}</span></div>
                    </div>
                  </div>
                  <svg className="lp-chart" viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg">
                    <line x1="30" y1="75" x2="350" y2="75" className="lp-obla-orange" />
                    <line x1="30" y1="99" x2="350" y2="99" className="lp-obla-green" />
                    <g className={`lp-chart-thresh ${showThresh1 ? 'show' : ''}`}>
                      <line x1="186" y1="10" x2="186" y2="115" />
                      <text x="189" y="18">Aerobic 5:06</text>
                    </g>
                    <g className={`lp-chart-thresh2 ${showThresh2 ? 'show' : ''}`}>
                      <line x1="248" y1="10" x2="248" y2="115" />
                      <text x="251" y="18">Anaerobic 4:14</text>
                    </g>
                    <path
                      className={`lp-chart-curve ${drawCurve ? 'draw' : ''}`}
                      d="M40,112 C60,110 80,108 100,105 C118,102 132,98 148,93 C160,88 168,83 178,77 C186,72 192,67 200,60 C214,48 226,36 240,24 C252,14 264,8 276,5 C288,3 300,3 312,4"
                    />
                    <g style={{ opacity: showDots ? 1 : 0 }} className="lp-chart-dots">
                      <circle cx="40" cy="112" r="3" /><circle cx="70" cy="110" r="3" /><circle cx="100" cy="105" r="3" /><circle cx="132" cy="97" r="3" />
                      <circle cx="165" cy="86" r="3" /><circle cx="200" cy="62" r="3" /><circle cx="240" cy="24" r="3" /><circle cx="280" cy="5" r="3" />
                    </g>
                  </svg>
                  <div className={`lp-zone-strip ${showZones ? '' : 'hidden'}`}>
                    <div style={{ flex: 3.5, background: '#4FC3F7' }} />
                    <div style={{ flex: 2, background: '#29B6F6' }} />
                    <div style={{ flex: 1.5, background: '#FFA726' }} />
                    <div style={{ flex: 1, background: '#FF7043' }} />
                    <div style={{ flex: 1, background: '#EF5350' }} />
                  </div>
                  <div className="lp-zone-labels"><span>{t.zl}</span><span>Z5 VO2max</span></div>
                  <div className={`lp-export-row ${showExport ? 'show' : ''}`}>
                    <span>{t.exportLabel}</span>
                    <button>{t.exportBtn}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── How it works ── */}
      <section className="lp-section lp-how-section" id="how-it-works">
        <div className="lp-center-head">
          <div className="lp-section-kicker">Hoe het werkt</div>
          <h2>Van veldtest naar<br /><em>volledig rapport</em></h2>
        </div>
        <div className="lp-stepper">
          <div className="lp-stepper-track" />
          {[
            {
              num: 1,
              title: 'Stel je protocol in',
              desc: 'Kies je afstand, startsnelheid en stapgrootte. LacTest genereert automatisch alle teststappen.',
              icon: '⚙️',
            },
            {
              num: 2,
              title: 'Doe de veldtest',
              desc: 'Laat je atleet lopen en meet het lactaat na elke stap. Voer alles in via je mobiele app — geen papier meer.',
              icon: '🏃',
            },
            {
              num: 3,
              title: 'LacTest berekent alles',
              desc: 'Relax. De volledige lactaatcurve, drempels en zones zijn klaar in minder dan 10 seconden.',
              icon: '📊',
            },
            {
              num: 4,
              title: 'Download je rapport',
              desc: 'Exporteer een professioneel PDF met curve, zones en trainingsaanbevelingen — klaar voor coach en atleet.',
              icon: '📄',
            },
          ].map(step => (
            <div key={step.num} className="lp-step">
              <div className="lp-step-dot">{step.num}</div>
              <div className="lp-step-img">
                <span className="lp-step-img-icon">{step.icon}</span>
              </div>
              <h3 className="lp-step-title">{step.title}</h3>
              <p className="lp-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-section-kicker">{t.featKicker}</div>
        <h2>{t.featTitleA}<br />{t.featTitleB}</h2>
        <p className="lp-section-lead">{t.featLead}</p>
        <div className="lp-features-grid">
          <div className="lp-feature-card"><div className="lp-feat-icon">1</div><h3>Volledige lactaatcurve</h3><p>Polynoomfit met R²-score, datapunten en OBLA-referentielijnen.</p></div>
          <div className="lp-feature-card"><div className="lp-feat-icon">2</div><h3>Drempels via 3 methoden</h3><p>OBLA basislijn, OBLA 2.0/4.0 en Modified Dmax naast elkaar.</p></div>
          <div className="lp-feature-card"><div className="lp-feat-icon">3</div><h3>5 zones op basis van je drempels</h3><p>Tempo, hartslag en vermogen per zone — direct bruikbaar.</p></div>
          <div className="lp-feature-card"><div className="lp-feat-icon">4</div><h3>Hartslag vs. tempografiek</h3><p>Visualiseer trainingsbelasting en vermoeidheidsprogressie doorheen de test.</p></div>
          <div className="lp-feature-card"><div className="lp-feat-icon">5</div><h3>Professioneel PDF-rapport</h3><p>Coach-klaar rapport met grafieken, drempels en zones.</p></div>
          <div className="lp-feature-card"><div className="lp-feat-icon">6</div><h3>AI-coachingsnota</h3><p>Gepersonaliseerde trainingsaanbeveling op basis van het atleetprofiel.</p></div>
        </div>
      </section>

      <section className="lp-section" id="pricing">
        <div className="lp-section-kicker">{t.cmpKicker}</div>
        <h2>{t.cmpTitleA}<br />{t.cmpTitleB}</h2>
        <p className="lp-section-lead">{t.cmpLead}</p>
        <div className="lp-compare-grid">
          <div>Criterium</div><div>Labtest</div><div>LacTest</div><div>Spreadsheet</div>
          <div>Kostprijs</div><div>€300–500</div><div>€9.95</div><div>€0 + manueel werk</div>
          <div>Doorlooptijd</div><div>1–3 werkdagen</div><div>{'<'}60 sec</div><div>2–4 uur</div>
        </div>
      </section>

      <section className="lp-cta" id="start">
        <h2>{t.ctaTitleA}<br />{t.ctaTitleB}</h2>
        <p>{t.ctaDesc}</p>
        <button onClick={() => navigate('/auth')}>{t.ctaBtn}</button>
        <small>{t.ctaNote}</small>
      </section>

      <footer className="lp-footer">
        <div>LacTest</div>
        <div className="lp-footer-links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Gebruiksvoorwaarden</a>
          <a href="mailto:tom@lactest.app">Contact</a>
        </div>
        <div>&copy; {new Date().getFullYear()} LacTest — {t.footer}</div>
      </footer>
    </div>
  );
};

export default Landing;
