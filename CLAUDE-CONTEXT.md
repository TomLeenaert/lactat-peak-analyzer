# LacTest — Claude Sessie Context

Kopieer onderstaande tekst en plak hem aan het begin van elke nieuwe Claude sessie.

---

> **Project: LacTest — Lactaat Drempel Analyse App**
>
> **Repo:** `TomLeenaert/lactat-peak-analyzer` (privé)
> **Stack:** React 18 + TypeScript + Vite + shadcn/ui + Tailwind + Supabase + Cloudflare Pages
>
> **⚠️ Branching — BELANGRIJK:**
> - Werk ALTIJD op de `develop` branch
> - Push NOOIT naar `main` — dat is productie (https://mylactest.com)
> - `develop` deploy automatisch naar: https://develop.lactat-peak-analyzer.pages.dev
> - Alleen Hormonia (mijn AI assistent) merget develop → main na goedkeuring
>
> **Supabase projecten:**
> - `lactest-prod` (productie) → project ID: `egpkewrqkworqvtijnyc`
> - `lactest-dev` (staging) → project ID: `lezrxfvaxuaaizoivdhs`
>
> **Omgevingsvariabelen (productie, niet aanraken):**
> - `VITE_SUPABASE_URL` → https://egpkewrqkworqvtijnyc.supabase.co
> - `VITE_SUPABASE_PUBLISHABLE_KEY` → sb_publishable_dCl7djdpuKakJco9yXNhwA_A9kseNme
> - `VITE_SUPABASE_PROJECT_ID` → egpkewrqkworqvtijnyc
>
> **Versie:** `0.3.0` (Arctic Precision redesign)
> **Versie tonen:** Staat in `package.json` → automatisch zichtbaar in nav + landing page via Vite define
>
> **Wat ik wil bouwen vandaag:** [HIER JE VRAAG INVULLEN]

---

## 🗺️ Roadmap / To Do

### ✅ Gedaan
- Token systeem (1 token = 1 analyse = €9.95)
- Admin board
- Mobile UX fixes (tabs, inputs, touch targets)
- Arctic Precision redesign (dark UI, paars/groen/oranje accenten)
- BottomNav voor mobiel
- NumPad voor veldklare invoer (lactaat + hartslag)
- Dashboard atleten-kaarten (vervangt tabel)
- AthleteDetail Arctic stijl
- ResultsTab met glow-effecten
- Versie-indicator in nav + landing page

### 🔜 To Do
- [ ] **Vaste staging URL instellen** — `dev.mylactest.com` of `develop.lactat-peak-analyzer.pages.dev` instellen als branch alias in Cloudflare Pages (nu krijgt elke develop push een willekeurige URL)
- [ ] **ZonesTab** Arctic redesign (glow-effecten consistent met ResultsTab)
- [ ] **Taalinconsistentie** — hardcoded NL tekst in Demo/ResultsTab/ZonesTab
- [ ] **Prijsmodel landing page** — zegt "per PDF" maar token = per analyse (niet per PDF)
- [ ] **Atleet evolutiegrafiek** — meerdere tests vergelijken in AthleteDetail
- [ ] **PDF rapport** — coach-klaar PDF exporteren na analyse

---

## 🌐 URLs

| Omgeving | Branch | URL |
|----------|--------|-----|
| **Productie** | `main` | https://mylactest.com |
| **Productie (alias)** | `main` | https://lactat-peak-analyzer.pages.dev |
| **Staging (vast — nog in te stellen)** | `develop` | `dev.mylactest.com` instellen in Cloudflare |
| **Staging (tijdelijk)** | `develop` | Wisselende URL per deploy — zie Cloudflare dashboard |
