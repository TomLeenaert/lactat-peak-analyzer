import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '@/assets/screen.png';
import stepGetSetImg from '@/assets/step-getset.jpg';
import stepTestImg from '@/assets/step-test.png';
import stepAnalyzeImg from '@/assets/step-analyze.jpg';
import stepTrainImg from '@/assets/step-train.png';
import LandingDemo from '@/components/LandingDemo';

import { useLang } from '@/contexts/LanguageContext';
import './Landing.css';

const COPY = {
  nl: {
    navHow: 'Hoe het werkt',
    navFeat: 'Mogelijkheden',
    navPrice: 'Vergelijking',
    navStart: 'Start gratis →',
    eyebrow: 'Gratis tijdens de bèta. Volledige analyse. Geen kaart nodig.',
    heroTitleA: 'Ken je drempels.',
    heroTitleB: 'Train met data.',
    heroDesc: 'MyLactest zet je veldtestdata om naar een volledig analyserapport met aerobe en anaerobe drempel en 5 trainingszones.',
    cmdLabel: 'start',
    cmdText: 'mylactest.app → analyseer → resultaten',
    cta1: 'Start je analyse →',
    cta2: 'Bekijk demo',
    featKicker: 'Wat is inbegrepen',
    featTitleA: 'Alles om slimmer te coachen.',
    featTitleB: 'Sneller. Wetenschappelijk.',
    featLead: 'Eén veldtest wordt een compleet prestatierapport. Gebouwd voor coaches die duidelijkheid willen, geen complexiteit.',
    feat: [
      { title: 'Mobiel. Op de piste.', desc: 'Voer je test uit en analyseer direct vanaf je telefoon. Geen lab. Geen spreadsheets. Geen gedoe.' },
      { title: 'Volledige lactaatcurve', desc: 'Nauwkeurige curve met datapunten, modelfit en belangrijke referentiemarkers. Helder inzicht in de fysiologie van je atleet.' },
      { title: 'Wetenschappelijke drempelanalyse', desc: 'Meerdere gevalideerde methoden gecombineerd tot één duidelijk resultaat. Geen black box. Robuuste, evidence-based resultaten.' },
      { title: '5 kant-en-klare trainingszones', desc: 'Directe zones voor tempo en hartslag. Train met precisie vanaf dag één.' },
      { title: 'Betaal per gebruik. Geen abonnement.', desc: 'Betaal enkel wanneer je een test uitvoert. Simpel. Transparant. Schaalt met jou.' },
      { title: 'Gebouwd voor echte tests', desc: 'Ontworpen voor coaches, clubs en atleten. Geen labomstandigheden nodig. Werkt waar je traint.' },
    ],
    cmpKicker: 'Vergelijking',
    cmpTitleA: 'Lab-niveau inzicht.',
    cmpTitleB: 'Zonder lab-niveau kosten.',
    cmpLead: 'Een professionele drempeltest kost al snel €300–500 en meerdere werkdagen. MyLactest doet het voor €9.95 in seconden.',
    cmpHeaders: ['Criterium', 'Labtest', 'MyLactest', 'Spreadsheet'],
    cmpRows: [
      ['Kostprijs', '€300–500', '€9.95', '€0 + manueel werk'],
      ['Doorlooptijd', '1–3 werkdagen', '<60 sec', '2–4 uur'],
    ],
    ctaTitleA: 'Stop met gokken.',
    ctaTitleB: 'Train op basis van data.',
    ctaDesc: 'Je eerste analyse in minder dan 5 minuten.',
    ctaBtn: 'Start gratis analyse →',
    ctaNote: '€9.95 enkel bij rapport-download — geen abonnement',
    sceneTitle: 'Nieuwe lactaattest',
    sceneAthlete: 'Sarah Vermeulen - Lopen',
    analyse: 'Analyseer drempels',
    analysing: 'Berekenen...',
    rpAero: 'Aerobe drempel',
    rpAna: 'Anaerobe drempel',
    rpFit: 'Uitstekend',
    exportLabel: 'Rapport klaar — bekijk resultaten',
    exportBtn: 'Bekijk resultaten',
    zl: 'Z1 Herstel',
    footerText: 'Gemaakt voor atleten',
    footerPrivacy: 'Privacy',
    footerTerms: 'Gebruiksvoorwaarden',
    footerContact: 'Contact',
    howKicker: 'Hoe het werkt',
    howTitle: 'Klaar.',
    howTitleEm: 'Test. Analyseer. Train.',
    stepLabels: ['Klaar!', 'Test.', 'Analyseer.', 'Train.'],
    stepHero: ['Jouw test. Jouw protocol.', 'Meet.', 'Data in. Duidelijkheid uit.', 'Zones, geen giswerk.'],
    steps: [
      { title: 'Stel je protocol in', desc: 'Kies je afstand, startsnelheid en stapgrootte. MyLactest genereert automatisch alle teststappen.' },
      { title: 'Doe de veldtest', desc: 'Laat je atleet lopen en meet het lactaat na elke stap.' },
      { title: 'Directe resultaten', desc: 'Voer alles in via je mobiele app. Geen papier meer.' },
      { title: 'Train met data', desc: 'De volledige lactaatcurve, drempels en 5 trainingszones klaar in minder dan 10 seconden.' },
    ],
  },
  en: {
    navHow: 'How it works',
    navFeat: 'Features',
    navPrice: 'Comparison',
    navStart: 'Start free →',
    eyebrow: 'Free during beta. Full analysis. No card required.',
    heroTitleA: 'Know your thresholds.',
    heroTitleB: 'Train with data.',
    heroDesc: 'MyLactest turns your field test data into a full analysis report with aerobic and anaerobic threshold and 5 training zones.',
    cmdLabel: 'start',
    cmdText: 'mylactest.app → analyse → results',
    cta1: 'Start your analysis →',
    cta2: 'View demo',
    featKicker: "What's included",
    featTitleA: 'Everything you need to coach smarter.',
    featTitleB: 'Faster. Scientifically.',
    featLead: 'Turn one field test into a complete performance blueprint. Built for coaches who want clarity, not complexity.',
    feat: [
      { title: 'Mobile. On the track.', desc: 'Run and analyse your test directly from your phone. No lab. No spreadsheets. No friction.' },
      { title: 'Full lactate curve', desc: 'Accurate curve with data points, model fit and key reference markers. Clear insight into your athlete\'s physiology.' },
      { title: 'Science-based threshold analysis', desc: 'Multiple validated methods combined into one clear outcome. No black box. Just robust, evidence-based results.' },
      { title: '5 ready-to-use training zones', desc: 'Instant zones for pace and heart rate. Train with precision from day one.' },
      { title: 'Pay per use. No subscription.', desc: 'Only pay when you run a test. Simple. Transparent. Scales with you.' },
      { title: 'Built for real-world testing', desc: 'Designed for coaches, clubs and athletes. No lab conditions required. Works where you actually train.' },
    ],
    cmpKicker: 'Comparison',
    cmpTitleA: 'Lab-level insight.',
    cmpTitleB: 'Without lab-level cost.',
    cmpLead: 'A professional threshold test often costs €300–500 and several business days. MyLactest does it for €9.95 in seconds.',
    cmpHeaders: ['Criteria', 'Lab test', 'MyLactest', 'Spreadsheet'],
    cmpRows: [
      ['Cost', '€300–500', '€9.95', '€0 + manual work'],
      ['Turnaround', '1–3 business days', '<60 sec', '2–4 hours'],
    ],
    ctaTitleA: 'Stop guessing.',
    ctaTitleB: 'Start training with data.',
    ctaDesc: 'Your first analysis in under 5 minutes.',
    ctaBtn: 'Start free analysis →',
    ctaNote: '€9.95 only at report download — no subscription',
    sceneTitle: 'New lactate test',
    sceneAthlete: 'Sarah Vermeulen - Running',
    analyse: 'Analyse thresholds',
    analysing: 'Analysing...',
    rpAero: 'Aerobic threshold',
    rpAna: 'Anaerobic threshold',
    rpFit: 'Excellent',
    exportLabel: 'Report ready — view results',
    exportBtn: 'View results',
    zl: 'Z1 Recovery',
    footerText: 'Made for athletes',
    footerPrivacy: 'Privacy',
    footerTerms: 'Terms of use',
    footerContact: 'Contact',
    howKicker: 'How it works',
    howTitle: 'Get set.',
    howTitleEm: 'Test. Analyze. Train.',
    stepLabels: ['Get set.', 'Test.', 'Analyze.', 'Train.'],
    stepHero: ['Your test. Your protocol.', 'Measure.', 'Data in. Clarity out.', 'Train zones, not guesses.'],
    steps: [
      { title: 'Set up your protocol', desc: 'Choose your distance, starting pace and step size. MyLactest automatically generates all test steps.' },
      { title: 'Run the field test', desc: 'Have your athlete run and measure lactate after each step.' },
      { title: 'Instant results', desc: 'Enter everything via your mobile app. No paper needed.' },
      { title: 'Train with data', desc: 'The full lactate curve, thresholds and 5 training zones ready in under 10 seconds. Ready for coach and athlete.' },
    ],
  },
};

const STEP_PHOTOS = [
  // Get set: coach discussing with athlete on athletics track
  stepGetSetImg,
  // Test: man jogging alone on athletics track
  stepTestImg,
  // Analyze: coach entering lactate data on smartphone on athletics track
  stepAnalyzeImg,
  // Train: zones visual from the app
  stepTrainImg,
];

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
  const { lang, setLang } = useLang();
  const t = COPY[lang];

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
        <a href="#" className="lp-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={logoSrc} alt="MyLactest" style={{ width: '34px', height: '34px', objectFit: 'contain', mixBlendMode: 'lighten' }} />
          MyLactest
        </a>
        <div className="lp-nav-links">
          <a className="lp-nav-link" href="#how-it-works">{t.navHow}</a>
          <a className="lp-nav-link" href="#features">{t.navFeat}</a>
        </div>
        <div className="lp-nav-right">
          <button
            className="lp-btn-demo"
            onClick={() => {
              const el = document.getElementById('demo');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t.cta2}
          </button>
          <button
            className="lp-btn-lang"
            onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
            title={lang === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}
          >
            {lang === 'nl' ? 'EN' : 'NL'}
          </button>
        </div>
      </nav>
      <section className="lp-hero-wrap" id="how">
        {/* Brand — centered above both columns */}
        <div className="lp-hero-brand">
          <img src={logoSrc} alt="MyLactest" className="lp-hero-logo" />
          <span className="lp-hero-logo-label">MyLactest</span>
        </div>

        <div className="lp-hero">
          <div className="lp-hero-left">
            <h1 className="lp-h1">
              {t.heroTitleA}
              <br />
              <em>{t.heroTitleB}</em>
            </h1>
            <p className="lp-hero-desc">{t.heroDesc}</p>
            <div className="lp-hero-eyebrow">
              <span className="lp-hero-eyebrow-dot" />
              <span>{t.eyebrow}</span>
            </div>
<div className="lp-hero-actions">
              <button className="lp-hero-cta-primary" onClick={() => navigate('/auth')}>{t.cta1}</button>
            </div>
          </div>

          <div className="lp-demo-window" id="demo-live">
            <div className="lp-demo-chrome">
              <div className="lp-demo-dots">
                <div className="lp-demo-dot red" />
                <div className="lp-demo-dot yellow" />
                <div className="lp-demo-dot green" />
              </div>
              <div className="lp-demo-urlbar">mylactest.app/analyse</div>
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
          <div className="lp-section-kicker">{t.howKicker}</div>
          <h2>{t.howTitle}<br /><em>{t.howTitleEm}</em></h2>
        </div>
        <div className="lp-stepper">
          <div className="lp-stepper-track" />
          {t.steps.map((step, i) => (
            <div key={i} className="lp-step">
              <div className="lp-step-dot">{t.stepLabels[i]}</div>
              <div className="lp-step-img">
                <img src={STEP_PHOTOS[i]} alt={step.title} className="lp-step-photo" loading="lazy" />
              </div>
              <h3 className="lp-step-title">{step.title}</h3>
              <p className="lp-step-desc">{step.desc}</p>
              <p className="lp-step-hero">{t.stepHero[i]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Interactive Demo ── */}
      <section className="lp-section" id="demo" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <LandingDemo />
      </section>

      <section className="lp-section" id="features">
        <div className="lp-section-kicker">{t.featKicker}</div>
        <h2>{t.featTitleA}<br />{t.featTitleB}</h2>
        <p className="lp-section-lead">{t.featLead}</p>
        <div className="lp-features-grid">
          {t.feat.map((f, i) => (
            <div key={i} className="lp-feature-card">
              <div className="lp-feat-icon">{i + 1}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="lp-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={logoSrc} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', mixBlendMode: 'lighten', opacity: 0.7 }} />
          <span>MyLactest</span>
        </div>
        <div className="lp-footer-links">
          <a href="/privacy">{t.footerPrivacy}</a>
          <a href="/terms">{t.footerTerms}</a>
          <a href="mailto:tom@lactest.app">{t.footerContact}</a>
        </div>
        <div>&copy; {new Date().getFullYear()} MyLactest — {t.footerText}</div>
      </footer>
    </div>
  );
};

export default Landing;
