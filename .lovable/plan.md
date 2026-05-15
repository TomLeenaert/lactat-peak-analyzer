## Probleem

LinkedIn (en andere social platforms) toont een oude preview omdat:
1. Er geen `og:image` is gedefinieerd in `index.html` — social platforms vallen dan terug op een eerder gescrapete afbeelding.
2. LinkedIn cachet previews agressief (~7 dagen) per URL.

## Oplossing

### 1. OG-image genereren (1200×630)
Een nieuwe afbeelding die past bij het huidige hero-scherm:
- Donkere achtergrond (`#0c0d11`)
- MyLactest bloeddruppel-logo gecentreerd
- Witte titel "MyLactest"
- Subtitel in paars accent: "Ken je drempels. Train met data."
- Klein "Gratis · Geen creditcard nodig" pill onderaan

Opgeslagen als `public/og-image.jpg` (JPG voor kleinere bestandsgrootte, <300KB aanbevolen door LinkedIn).

### 2. Meta tags uitbreiden in `index.html`
Toevoegen:
```html
<meta property="og:image" content="https://mylactest.com/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="MyLactest — Ken je drempels. Train met data." />
<meta property="og:url" content="https://mylactest.com/" />
<meta name="twitter:image" content="https://mylactest.com/og-image.jpg" />
```

### 3. Cache vernieuwen na publish
Belangrijk om te weten: na publiceren moet je LinkedIn's cache forceren te verversen, anders blijft de oude preview komen ondanks de nieuwe meta tags. Dit doe je via:
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/ → URL plakken → "Inspect" — dit dwingt LinkedIn een nieuwe scrape.
- Hetzelfde voor Facebook (Sharing Debugger) en Twitter/X (Card Validator) als je daar ook deelt.

## Technische details

- De OG-image wordt door `imagegen` gegenereerd (premium quality voor leesbare typografie) op exact 1200×630 en geplaatst in `public/` zodat hij beschikbaar is op `https://mylactest.com/og-image.jpg`.
- `og:url` wordt expliciet gezet zodat LinkedIn niet rommelt met query-parameters.
- Geen wijzigingen nodig aan React-routes of backend; dit is puur statische `<head>` + één afbeelding.
