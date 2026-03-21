# LacTest — Deployment Guide

## Overzicht

| Omgeving | Branch | URL | Supabase project |
|----------|--------|-----|-----------------|
| **Productie** | `main` | lactest.app *(of je eigen domein)* | `lactest-prod` |
| **Staging** | `develop` | lactest-staging.pages.dev | `lactest-dev` |

---

## 1. Branch strategie

```
main        ← productie (enkel via PR of bewuste push)
  └── develop  ← staging (dagelijks werk)
        └── feature/xxx  ← nieuwe features
```

**Workflow:**
1. Nieuwe feature → maak branch `feature/mijn-feature` vanuit `develop`
2. Klaar → push naar `develop` (automatisch gebouwd op staging)
3. Alles getest op staging → merge `develop` → `main` (live)

---

## 2. Supabase: twee projecten aanmaken

### Stap 1 — Staging project aanmaken
1. Ga naar https://supabase.com/dashboard
2. Klik **New project** → noem het `lactest-dev`
3. Kopieer de **URL** en **anon key** uit Settings → API

### Stap 2 — Staging schema initialiseren
```bash
# Lokaal in je project map
supabase link --project-ref <staging-project-ref>
supabase db push
```
Hierdoor worden alle migrations uit `supabase/migrations/` uitgevoerd op staging.

### Stap 3 — Productie schema updaten
```bash
supabase link --project-ref egpkewrqkworqvtijnyc  # prod project ID
supabase db push
```

> **Regel:** Voer NOOIT handmatige SQL uit via de Supabase dashboard op productie.
> Gebruik altijd een migration file in `supabase/migrations/`.

---

## 3. Cloudflare Pages configureren

### Productie (al actief)
- Branch: `main`
- Build command: `npm run build`
- Output: `dist`
- Environment vars: prod Supabase URL + anon key

### Staging toevoegen
1. Ga naar je Cloudflare Pages project → **Settings → Builds & deployments**
2. Klik **Add branch deployment**
3. Branch: `develop`
4. Voeg aparte environment vars toe voor staging:
   - `VITE_SUPABASE_URL` = staging URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = staging anon key
   - `VITE_SUPABASE_PROJECT_ID` = staging project ID

---

## 4. Environment variables instellen

Kopieer `.env.example` naar `.env` en vul je waarden in:

```bash
cp .env.example .env
```

**Nooit** het `.env` bestand committen naar Git.

### Variabelen overzicht

| Variabele | Productie | Staging |
|-----------|-----------|---------|
| `VITE_SUPABASE_URL` | prod URL | dev URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | prod anon key | dev anon key |
| `VITE_SUPABASE_PROJECT_ID` | egpkewrqkworqvtijnyc | <dev-id> |

---

## 5. Database migrations

Nieuwe schema-wijzigingen toevoegen:

```bash
# Maak een nieuwe migration aan
supabase migration new beschrijving_van_wijziging

# Bewerk het gegenereerde bestand in supabase/migrations/
# Push naar de gewenste omgeving
supabase db push
```

Migration files worden automatisch genummerd op timestamp en uitgevoerd in volgorde.

---

## 6. Supabase Row-Level Security (RLS)

Alle tabellen hebben RLS ingeschakeld:
- `profiles` — gebruiker ziet enkel eigen profiel
- `athletes` — gebruiker beheert enkel eigen atleten
- `test_results` — gekoppeld aan eigen atleten, onbereikbaar voor anderen

**Check na elke nieuwe tabel:** zorg dat `ENABLE ROW LEVEL SECURITY` + policies aanwezig zijn.

---

## 7. Toekomstige uitbreidingen

### Betalingen (Stripe) — nog niet actief
- Stripe test mode → gebruik in staging
- Stripe live mode → enkel in productie
- Env vars: `VITE_STRIPE_PUBLISHABLE_KEY`

### Error monitoring (Sentry)
```bash
npm install @sentry/react
```
DSN toevoegen als `VITE_SENTRY_DSN` in Cloudflare Pages env vars.
In `ErrorBoundary.tsx` de `Sentry.captureException()` call activeren.

### Analytics (Plausible — GDPR-proof)
Voeg toe aan `index.html`:
```html
<script defer data-domain="lactest.app" src="https://plausible.io/js/script.js"></script>
```

---

## 8. Checklist voor een productie-deploy

- [ ] Feature getest op staging (`develop` branch)
- [ ] Geen console errors in browser
- [ ] `npm run build` loopt zonder fouten
- [ ] Supabase migrations gepusht naar productie
- [ ] Environment vars correct in Cloudflare Pages
- [ ] RLS gecontroleerd voor nieuwe tabellen
- [ ] Merge `develop` → `main` via Pull Request

---

## 9. Noodprocedure (rollback)

Als er iets mis gaat op productie:
1. Ga naar Cloudflare Pages → **Deployments**
2. Klik op een vorige deploy → **Rollback to this deployment**
3. Onderzoek het probleem op `develop` branch
4. Fix en deploy opnieuw via normale flow
