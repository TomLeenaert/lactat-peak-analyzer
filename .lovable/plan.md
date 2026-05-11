## Doel
Het data-invoer scherm strakker maken: alleen de tabel + chat rechts behouden. Alle randinfo en het Live-voorbeeld verdwijnen — die horen thuis op het volgende scherm (Analyse).

## Wijzigingen in `src/components/DataInputTab.tsx`

### 1. Action bar boven de tabel — uitkleden
Behouden:
- **Alleen** het "AFSTAND … m" veld (globale afstand per trede).

Verwijderen:
- "Protocol instellingen" knop + bijbehorende `<Sheet>` drawer.
- "JSON" import-knop + verborgen `<input type="file">` voor JSON.
- "RUST mmol/L" veld.
- Keyboard-hint blok ("Tab volgende cel / Enter nieuwe rij").
- De `flex: 1` spacer wordt overbodig — verwijderen.

### 2. Rechterkolom — alleen chat
Verwijderen:
- Het volledige "Live voorbeeld" paneel (header, metric-tiles LT1/LT2/Max Lac/Piek HR/Drempel, en de mini-LactateChart).
- De `livePreview` `useMemo` berekening + de import van `LactateChart` als die verder niet meer gebruikt wordt in dit bestand.
- De `Genereer rapport` knop verhuist naar de chat-paneel-header (rechts bovenaan, op dezelfde plek waar nu "● Online" staat), zodat de gebruiker hem niet kwijt is. Disabled-logica blijft (`needsValidation || filledCount < 3`).

De rechterkolom bevat dan enkel nog het chatpaneel (sticky), met de "Genereer rapport" knop in z'n header.

### 3. Props / state opruimen
- Props `protocol`, `setProtocol`, `setStepIncrement` worden niet meer gebruikt in deze component → uit de destructuring halen (interface mag blijven zodat `TestPage.tsx` ongewijzigd blijft).
- State `protocolOpen` weg.
- Lokale helpers/imports die enkel het verwijderde UI ondersteunden weg: `Settings2`, `FileJson`, `Keyboard`, `Sheet`/`SheetTrigger`/`SheetContent`/`SheetHeader`/`SheetTitle`, `ProtocolBar`, `polyEval`, eventueel `LactateChart` (afhankelijk van of die nog ergens in dit bestand wordt gebruikt — wordt geverifieerd vóór verwijdering).
- `fileInputRef` voor JSON + `handleJsonImport`/`processJsonFile` blijven indien ze nergens anders nodig zijn — worden verwijderd samen met de UI.

### 4. Niets aanpassen aan
- `TestPage.tsx` — die geeft props mee maar als de interface ze nog accepteert (optioneel) is dat oké. Anders maken we `protocol`, `setProtocol`, `setStepIncrement` expliciet optioneel.
- Berekenlogica, parse-test-image flow, chat-flow, of andere componenten.
- `index.css` of tokens.

## Resultaat
- **Boven**: kleine balk met enkel "AFSTAND 1600 m".
- **Links**: de stappen-tabel.
- **Rechts**: het chatpaneel met "Genereer rapport" in z'n header.
- Geen Live voorbeeld meer op dit scherm — dat blijft voor de Analyse-tab.
