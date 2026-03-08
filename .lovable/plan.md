

# Plan: Club, Atleten & Testhistoriek met Supabase

## Overzicht

Een coach logt in, beheert één club met atleten, en kan per atleet meerdere lactaattests opslaan en bekijken.

## 1. Supabase Setup

### Database tabellen

```text
profiles (id=auth.uid, full_name, club_name, created_at)
    │
athletes (id, user_id→auth.users, name, birth_date, sport, notes, created_at)
    │
test_results (id, athlete_id→athletes, test_date, protocol_json, steps_json, results_json, notes, created_at)
```

- **profiles**: clubnaam en coachnaam
- **athletes**: atleten gekoppeld aan de ingelogde coach
- **test_results**: volledige testdata (protocol, stappen, berekende resultaten) als JSON

### RLS policies
- Elke tabel: gebruiker ziet/bewerkt alleen eigen data (`user_id = auth.uid()`)
- `test_results`: via join op `athletes.user_id`

## 2. Authenticatie

- Login/registratie pagina (`/auth`) met email+wachtwoord
- Wachtwoord reset flow (`/reset-password`)
- Protected routes: redirect naar `/auth` als niet ingelogd
- Auth context provider rond de app

## 3. Nieuwe pagina's & navigatie

```text
/auth              → Login / Registratie
/reset-password    → Wachtwoord reset
/dashboard         → Club overzicht + atletenlijst
/athlete/:id       → Atleet detail + testhistoriek
/athlete/:id/test  → Nieuwe test uitvoeren (huidige functionaliteit)
/                   → Redirect naar /dashboard als ingelogd
```

- Navigatiebalk bovenaan met club naam, "Atleten" link, en logout knop

## 4. Dashboard pagina (`/dashboard`)

- Club naam tonen (uit profiel)
- Tabel met atleten: naam, sport, laatste testdatum, aantal tests
- Knop "Atleet toevoegen" → dialog met naam, geboortedatum, sport, notities
- Klikken op atleet → `/athlete/:id`

## 5. Atleet detail pagina (`/athlete/:id`)

- Atleet info (naam, sport, notities) met bewerkknop
- **Testhistoriek tabel**: datum, LT1, LT2, aantal stappen
- Klikken op test → resultaten bekijken (bestaande Results/Zones/Chart tabs)
- Knop "Nieuwe test" → `/athlete/:id/test` (huidige test flow, opslaat naar DB)
- Knop "Atleet verwijderen" met bevestiging

## 6. Test flow aanpassing

- Na "Berekenen" verschijnt een "Opslaan" knop
- Slaat protocol, stappen en resultaten op als JSON in `test_results`
- Na opslaan: redirect naar atleet detail pagina

## 7. Technische aanpak

- **Supabase client**: `src/integrations/supabase/client.ts`
- **Auth context**: `src/contexts/AuthContext.tsx`
- **React Query**: voor data fetching (athletes, tests)
- **Bestaande code** blijft intact; de huidige `Index.tsx` wordt hergebruikt als test-component binnen de nieuwe routing

## Stappen (volgorde)

1. Supabase koppelen + tabellen aanmaken (migrations)
2. Auth pagina + context + protected routes
3. Dashboard met atleten CRUD
4. Atleet detail met testhistoriek
5. Test flow koppelen aan atleet + opslaan naar DB

