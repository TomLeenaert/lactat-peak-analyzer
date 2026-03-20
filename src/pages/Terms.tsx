import { useNavigate } from 'react-router-dom';

const Terms = () => {
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
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Gebruiksvoorwaarden</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '48px' }}>
          Laatst bijgewerkt: {new Date().toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <Section title="1. Aanvaarding van de voorwaarden">
          Door LacTest te gebruiken ga je akkoord met deze gebruiksvoorwaarden. Als je niet akkoord gaat, gebruik de dienst dan niet.
        </Section>

        <Section title="2. Beschrijving van de dienst">
          LacTest is een webapplicatie voor de analyse van lactaattestdata. De app berekent aerobe en anaerobe drempels op basis van ingevoerde veldtestgegevens en genereert trainingszones en rapporten.
        </Section>

        <Section title="3. Account">
          <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
            <li>Je bent verantwoordelijk voor het veilig houden van je wachtwoord.</li>
            <li>Je mag je account niet delen met anderen.</li>
            <li>Je mag de dienst enkel gebruiken voor wettige doeleinden.</li>
          </ul>
        </Section>

        <Section title="4. Prijs en betaling">
          <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
            <li>Het aanmaken van een account en invoeren van testdata is gratis.</li>
            <li>Het downloaden van een PDF-rapport kost <strong>€9.95 per rapport</strong>.</li>
            <li>Er is geen abonnement. Je betaalt enkel wat je downloadt.</li>
            <li>Alle prijzen zijn inclusief BTW.</li>
          </ul>
        </Section>

        <Section title="5. Medische disclaimer">
          <strong style={{ color: '#ff9800' }}>Belangrijk:</strong> LacTest is een hulpmiddel voor coaches en atleten, geen medisch hulpmiddel. De resultaten zijn bedoeld als ondersteuning bij trainingsplanning en vervangen geen medisch advies. Raadpleeg een arts of sportarts bij twijfel over je gezondheid of prestaties.
        </Section>

        <Section title="6. Nauwkeurigheid van resultaten">
          De berekende drempels zijn gebaseerd op wetenschappelijk onderbouwde methoden (OBLA, Dmax, Modified Dmax). De nauwkeurigheid is mede afhankelijk van de kwaliteit van de ingevoerde testdata. LacTest kan niet garanderen dat de resultaten in alle gevallen overeenkomen met labmetingen.
        </Section>

        <Section title="7. Intellectuele eigendom">
          Alle software, algoritmen en ontwerpen van LacTest zijn eigendom van Tom Leenaert. Jouw testdata blijft van jou.
        </Section>

        <Section title="8. Aansprakelijkheid">
          LacTest is niet aansprakelijk voor schade die voortvloeit uit het gebruik van de app of uit beslissingen genomen op basis van de resultaten. Gebruik de app op eigen risico.
        </Section>

        <Section title="9. Beëindiging">
          We behouden ons het recht voor om accounts te deactiveren bij misbruik of overtreding van deze voorwaarden.
        </Section>

        <Section title="10. Toepasselijk recht">
          Deze voorwaarden worden beheerst door het Belgisch recht. Geschillen vallen onder de bevoegdheid van de rechtbanken van België.
        </Section>

        <Section title="11. Contact">
          Vragen over deze voorwaarden? Mail naar{' '}
          <a href="mailto:tom@lactest.app" style={{ color: '#6644ff' }}>tom@lactest.app</a>.
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

export default Terms;
