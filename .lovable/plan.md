## Probleem

De route `/athlete/:id/test` rendert `src/pages/AthleteTest.tsx`, niet `TestPage.tsx`. Mijn vorige edits zaten in `TestPage.tsx`, dus je zag nooit effect. In `AthleteTest.tsx` staat:

```tsx
<main className="max-w-[900px] mx-auto px-4 py-2 pb-6">
```

Die `max-w-[900px] mx-auto` capt het hele scherm op 900px en centreert het → vandaar de grote lege banden links en rechts.

## Fix

**Bestand: `src/pages/AthleteTest.tsx`**
- `<main>` wijzigen naar volledige breedte: vervang `max-w-[900px] mx-auto px-4 py-2 pb-6` door `w-full px-2 py-2 pb-6` (minimale horizontale padding zodat content niet aan de schermrand kleeft).

**Bestand: `src/components/DataInputTab.tsx`**
- Verifiëren dat de grid `grid w-full grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_560px]` actief blijft. Geen wijziging nodig — de chat blijft 560 px vast, het data‑frame neemt alle resterende breedte (1fr).

**Optioneel (cleanup, geen functionele wijziging):**
- De eerdere wijzigingen in `src/pages/TestPage.tsx` en `src/App.css` laten staan; ze doen geen kwaad, maar zijn niet de oplossing voor deze route.

## Resultaat

Op desktop vult het data‑invulgedeelte de volledige breedte van het scherm op een paar pixels padding na, en de chat-kolom blijft 560 px aan de rechterkant. Geen centrering meer, geen witruimte links/rechts.