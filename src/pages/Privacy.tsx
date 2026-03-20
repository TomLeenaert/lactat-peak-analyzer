import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#0c0d11', color: '#e8e9f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(12,13,17,0.90)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '58px',
      }}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '17px', fontWeight: 600 }}>
          Lac<span style={{ color: '#6644ff' }}>.</span>Test
        </a>
        <button onClick={() => navigate(-1)} style={{
          fontSize: '13px', color: 'rgba(255,255,255,0.5)', background: 'none',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px',
          padding: '5px 14px', cursor: 'pointer',
        }}>← Terug</button>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Privacybeleid</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '48px' }}>
          Laatst bijgewerkt: {new Date().toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <Section title="1. Wie zijn wij?">
          LacTest is een dienst aangeboden door Tom Leenaert, gevestigd in België. Je kan ons bereiken via{' '}
          <a href="mailto:tom@lactest.app" style={{ color: '#6644ff' }}>tom@lactest.app</a>.
        </Section>

        <Section title="2. Welke gegevens verzamelen we?">
          We verzamelen alleen wat nodig is om de dienst te leveren:
          <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
            <li><strong>Accountgegevens:</strong> e-mailadres en naam bij registratie.</li>
            <li><strong>Testdata:</strong> lactaatwaarden, tempo, hartslag en andere veldtestgegevens die je invoert.</li>
            <li><strong>Gebruiksdata:</strong> basisanalytics (paginabezoeken, geen tracking van persoonlijk gedrag).</li>
          </ul>
        </Section>

        <Section title="3. Waarvoor gebruiken we jouw gegevens?">
          <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
            <li>Om je account aan te maken en te beheren.</li>
            <li>Om je veldtestanalyses op te slaan en te tonen.</li>
            <li>Om de dienst te verbeteren.</li>
            <li>Om je te contacteren bij belangrijke updates over de dienst.</li>
          </ul>
          We verkopen jouw gegevens <strong>nooit</strong> aan derden.
        </Section>

        <Section title="4. Rechtsgrond (GDPR)">
          We verwerken je gegevens op basis van:
          <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
            <li><strong>Uitvoering van een overeenkomst:</strong> om de dienst te kunnen leveren.</li>
            <li><strong>Gerechtvaardigd belang:</strong> voor het verbeteren van de dienst.</li>
            <li><strong>Toestemming:</strong> voor optionele communicatie.</li>
          </ul>
        </Section>

        <Section title="5. Hoe lang bewaren we jouw gegevens?">
          We bewaren je gegevens zolang je account actief is. Je kan op elk moment je account en alle bijbehorende data laten verwijderen via{' '}
          <a href="mailto:tom@lactest.app" style={{ color: '#6644ff' }}>tom@lactest.app</a>.
        </Section>

        <Section title="6. Subverwerkers">
          We maken gebruik van de volgende diensten:
          <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
            <li><strong>Supabase</strong> (database en authenticatie) — VS/EU.</li>
            <li><strong>Netlify</strong> (hosting) — VS.</li>
          </ul>
          Beide diensten zijn AVG/GDPR-compliant.
        </Section>

        <Section title="7. Jouw rechten">
          Als EU-burger heb je het recht op:
          <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
            <li>Inzage in je gegevens.</li>
            <li>Correctie van onjuiste gegevens.</li>
            <li>Verwijdering van je gegevens ("recht op vergeten").</li>
            <li>Bezwaar tegen bepaalde verwerkingen.</li>
            <li>Overdraagbaarheid van je gegevens.</li>
          </ul>
          Stuur een e-mail naar <a href="mailto:tom@lactest.app" style={{ color: '#6644ff' }}>tom@lactest.app</a> om een van deze rechten uit te oefenen.
        </Section>

        <Section title="8. Cookies">
          We gebruiken enkel functionele cookies die noodzakelijk zijn voor de werking van de app (authenticatiesessie). Er worden geen tracking- of advertentiecookies gebruikt.
        </Section>

        <Section title="9. Wijzigingen">
          We kunnen dit privacybeleid aanpassen. Bij wezenlijke wijzigingen word je per e-mail verwittigd.
        </Section>

        <Section title="10. Contact & klachten">
          Vragen? Mail naar <a href="mailto:tom@lactest.app" style={{ color: '#6644ff' }}>tom@lactest.app</a>.
          Je hebt ook het recht om een klacht in te dienen bij de Belgische Gegevensbeschermingsautoriteit:{' '}
          <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noreferrer" style={{ color: '#6644ff' }}>
            gegevensbeschermingsautoriteit.be
          </a>.
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '36px' }}>
    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>{title}</h2>
    <div style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.8', fontSize: '15px' }}>{children}</div>
  </div>
);

export default Privacy;
