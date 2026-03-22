# LacTest — Claude Project Instructions

## Wat is dit project?

LacTest is een SaaS webapp voor coaches om lactaatdrempelanalyses uit te voeren bij atleten. De coach voert testdata in (tempo, lactaat mmol/L, hartslag per stap), de app berekent LT1/LT2 drempelwaarden en trainingszones. Resultaten zijn deelbaar via een publieke link met de atleet.

**Eigenaar:** Tom Leenaert (tomleenaert@gmail.com)
**Repo:** `TomLeenaert/lactat-peak-analyzer` (privé GitHub)
**Live:** https://mylactest.com
**Staging:** https://dev.mylactest.com (develop branch)

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS + RPC functies)
- **Hosting:** Cloudflare Pages
- **Design system:** Arctic Precision (eigen ontwerp, gebaseerd op Google Stitch export)
- **Fonts:** Space Grotesk (headings, 900 weight) + Inter (body)

---

## Design System — Arctic Precision

Geen emojis. Geen afgeronde hoeken. Geen zachte kleuren. Industrieel, precies, donker.

**Kleuren:**
```
Background:    #0e0e0e
Card/surface:  #131313
Surface-high:  #201f1f
Border:        #262626
Primary:       #bd9dff  (paars)
Mint/accent:   #00fdc1  (groen)
Orange:        #ff7440  (oranje)
Muted text:    rgba(255,255,255,0.35)
```

**Typografie:**
- Headings: `Space Grotesk`, weight 700–900, uppercase + letter-spacing
- Body/labels: `Inter`, weight 400–700
- Monospace voor waarden (tempo, hartslag, lactaat)

**Componenten patroon:**
```tsx
// Card
<div style={{ background: '#131313', border: '1px solid #262626', borderRadius: '8px', padding: '20px' }}>

// Section label
<p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>

// Gradient CTA knop
<button style={{ background: 'linear-gradient(135deg, #8b4aff 0%, #bd9dff 100%)', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 700 }}>

// Mint actie knop
<button style={{ background: 'rgba(0,253,193,0.06)', border: '1px solid rgba(0,253,193,0.25)', color: '#00fdc1', borderRadius: '6px' }}>
```

---

## Branching Regels

- **ALTIJD** werken op `develop` branch
- **NOOIT** direct pushen naar `main` (= productie)
- `develop` → automatisch deployed naar `dev.mylactest.com`
- `main` → automatisch deployed naar `mylactest.com`
- Merge develop → main via GitHub Desktop na goedkeuring Tom

---

## Database (Supabase)

**Project ID (productie):** `egpkewrqkworqvtijnyc`
**URL:** `https://egpkewrqkworqvtijnyc.supabase.co`

**Tabellen:**
```
profiles          - user_id, full_name, club_name, tokens (int), unlimited (bool)
athletes          - id, user_id, name, birth_date, sport, notes
test_results      - id, athlete_id, test_date, steps_json, results_json, protocol_json
shared_results    - id, token (hex), test_result_id, athlete_name, test_date, created_by
token_transactions - id, user_id, amount, reason, created_at
```

**RPC functies:**
```
use_token()                                    → verbruikt 1 token (of gratis als unlimited=true)
admin_grant_tokens(p_user_id, p_amount)        → geeft tokens aan user (admin only)
admin_set_unlimited(p_user_id, p_unlimited)    → toggle unlimited beta (admin only)
admin_get_users()                              → alle users met stats (admin only)
create_share_link(test_result_id, athlete_name, test_date) → geeft share token terug
```

**RLS:** Elke user ziet alleen eigen data. Gedeelde testresultaten zijn publiek leesbaar via share token.

---

## Bestandsstructuur (key files)

```
src/
  pages/
    Landing.tsx          - Publieke landingspagina
    Auth.tsx             - Login/registratie ("COACH ACCESS")
    Dashboard.tsx        - Atleten overzicht (bento cards)
    AthleteDetail.tsx    - Atleet profiel + test history
    AthleteTest.tsx      - Test sessie (protocol → data → resultaten)
    ShareView.tsx        - Publieke deelbare resultatenlink (geen login)
    Admin.tsx            - Gebruikersbeheer (alleen tomleenaert@gmail.com)

  components/
    AppNav.tsx           - Sticky topnav (logo, tokens, logout)
    BottomNav.tsx        - Mobiele tab nav (Lucide icons, mint glow active state)
    DataInputTab.tsx     - Stapdata invoer met NumPad bottom sheet
    NumPad.tsx           - Veldklaar numeriek invoerpaneel
    ProtocolTab.tsx      - Testprotocol instellen + richtlijnen
    ResultsTab.tsx       - LT1/LT2 hero cards + lactaatcurve + zones + share knop
    ZonesTab.tsx         - Hartslag vs tempo grafiek
    LactateChart.tsx     - Recharts lactaatcurve

  lib/
    lactate-math.ts      - Berekening LT1/LT2 + zones (polynoom fitting)
    protocol-types.ts    - ProtocolSettings type

supabase/
  migrations/            - SQL migrations (in volgorde uitvoeren bij nieuwe omgeving)
```

---

## Token / Businessmodel

- 1 token = 1 lactaatanalyse
- Prijs: €9.95 per analyse (toekomstig: bundels)
- Nieuwe gebruikers krijgen 3 gratis tokens
- **Beta testers:** `unlimited = true` → onbeperkt gratis via Admin panel
- Token badge in nav: toont aantal, of `∞` als unlimited (mint kleur)

---

## Share Link Feature

Coach klikt "Deel resultaten met atleet" op het resultaten-tabblad.
→ RPC `create_share_link()` maakt een unieke token aan
→ URL: `https://mylactest.com/share/{token}`
→ Atleet opent op telefoon — geen login nodig
→ Toont: atleet naam, datum, LT1/LT2 drempelwaarden, lactaatcurve, alle trainingszones

---

## Versie

`package.json` → `version: "0.3.0"`
Zichtbaar in AppNav (naast logo) en Landing page via `__APP_VERSION__` (Vite define).
Bij nieuwe features: verhoog versie in `package.json`.

---

## Huidige Status (v0.3.0)

**Klaar:**
- Arctic Precision redesign (volledig, geen emojis)
- BottomNav mobiel (Lucide icons, mint glow)
- NumPad veldklare invoer
- Dashboard bento cards
- AthleteDetail profiel
- ResultsTab met glow hero cards
- Share link voor atleten
- Unlimited beta tokens (toggle in Admin)
- Admin panel (users, tokens, beta toggle)
- dev.mylactest.com staging URL (Active in Cloudflare)

**To Do:**
- [ ] Taalswitch NL/EN/FR (i18next) — geen hardcoded tekst
- [ ] Atleet evolutiegrafiek (meerdere tests vergelijken)
- [ ] Landing page pricing fix ("per analyse" i.p.v. "per PDF")
- [ ] ZonesTab uitbreiden (hartslag zones uitgebreider)
- [ ] Stripe betalingen integreren

---

## Git Lock Probleem (opgelost)

Als Claude code schrijft via de sandbox en `git` faalt → laat het `index.lock` of `HEAD.lock` achter.
**Oplossing:** Claude verwijdert dit via de cowork delete tool. Jij commit via GitHub Desktop.
**Regel:** Claude schrijft bestanden, Tom commit.

---

## Belangrijke Links

| | URL |
|---|---|
| **Productie** | https://mylactest.com |
| **Staging** | https://dev.mylactest.com |
| **GitHub** | https://github.com/TomLeenaert/lactat-peak-analyzer |
| **Cloudflare** | https://dash.cloudflare.com → Workers & Pages → lactat-peak-analyzer |
| **Supabase** | https://supabase.com/dashboard/project/egpkewrqkworqvtijnyc |
| **Admin panel** | https://mylactest.com/admin |
