# Memory: index.md
Updated: now

# MyLactest App - Architecture

## Branding
- Name: **MyLactest** (everywhere, no version display)
- Logo: 44px in nav bar, larger on auth page
- No version numbers shown anywhere in the UI

## Design tokens
- Uses HSL semantic tokens from index.css (teal/warm palette)

## Structure
- `/auth` → login/register (email+password)
- `/reset-password` → password reset
- `/dashboard` → club overview + athletes list (protected)
- `/athlete/:id` → athlete detail + test history (protected)
- `/athlete/:id/test` → new test (protected)
- `/athlete/:id/test/:testId` → view existing test (protected)

## Database (Supabase/Cloud)
- `profiles` (user_id, full_name, club_name) - auto-created on signup
- `athletes` (user_id, name, birth_date, sport, notes)
- `test_results` (athlete_id, test_date, protocol_json, steps_json, results_json)
- All tables have RLS: users only see own data

## Key decisions
- One club per coach (stored in profiles.club_name)
- Test data saved as JSON (protocol, steps, results)
- Auth via email+password with password reset flow
- 3-step test nav: GET SET → TEST → ANALYZE (Results+Zones combined)
