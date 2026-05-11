## Doel
LT1 (aerobe drempel) realistischer maken zodat hij niet onnaturlijk laag uitvalt door een te lage baseline of uitschieter, en de coach waarschuwen wanneer de afstand tussen LT1 en LT2 atypisch is.

## Wijzigingen in `src/lib/lactate-math.ts`

### 1. Baseline-floor van 1.5 mmol/L voor Baseline+0.5
In de hoofdfunctie `calculate(...)`, daar waar nu `lt1_bsln` berekend wordt (regel ~487):

- Nieuwe afgeleide waarde introduceren: `baselineLac = Math.max(restLac, 1.5)`.
- LT1 baseline-methode wordt: `findSpeedAtLactateOrNull(coeffs, baselineLac + 0.5, xMin, xMax)`.
- `restLac` zelf laten we ongemoeid (blijft de gerapporteerde rustlactaat); enkel de drempel-berekening krijgt de floor.
- Als de floor effectief werd toegepast (`restLac < 1.5`), een `info`-warning toevoegen:
  > "Gedetecteerde baseline (X.X mmol/L) lag onder 1.5 — een ondergrens van 1.5 mmol/L is gebruikt voor de Aerobic Threshold om vertekening door een te lage eerste trede te vermijden."

Hiervoor breiden we het `CalcWarning.code` union uit met een nieuwe code `BASELINE_FLOORED`.

### 2. Cross-check pace-verschil LT1 ↔ LT2
Na het berekenen van `lt1_best` en `lt2_best`, het verschil in pace per km berekenen:

```text
pace1 = 60 / lt1_best   (min/km)
pace2 = 60 / lt2_best
deltaSecPerKm = (pace1 - pace2) * 60
```

Indien `deltaSecPerKm > 60` (en beide snelheden > 0): warning toevoegen met nieuwe code `LT_GAP_LARGE`:
> "Ongewoon groot verschil tussen drempels (Δ ≈ Xs/km). Controleer of de Aerobic Threshold niet kunstmatig laag is door een uitschieter in de beginpunten."

Typische waarden 30–45 s/km worden niet gemeld; >60 s/km wel.

### 3. Typing
`CalcWarning['code']` uitbreiden met `'BASELINE_FLOORED' | 'LT_GAP_LARGE'`. Alle bestaande consumers iterëren simpelweg over warnings en tonen `message` — geen UI-aanpassingen nodig (warnings verschijnen automatisch in de bestaande warnings-lijst in AnalyzeTab/ResultsTab).

## Niet aanpassen
- Geen wijzigingen in de berekening van LT2 / Modified Dmax.
- Geen wijzigingen in UI-componenten, zones, of de chatbot — de nieuwe warnings vloeien door de bestaande `results.warnings` pipeline.
- `restLac` veld in resultaten blijft de werkelijke gemeten/ingevoerde waarde (voor transparantie in rapport).

## Verificatie
- Bestaande testcase `test-lactate.js` runnen om regressie te checken.
- Snelle sanity: dataset met restLac = 1.0 mmol/L → LT1 moet nu op snelheid bij 2.0 mmol/L liggen (1.5 + 0.5) i.p.v. 1.5 mmol/L, en een `BASELINE_FLOORED`-warning verschijnen.
- Dataset met LT1 = 10 km/h en LT2 = 14 km/h → Δ ≈ 103 s/km → `LT_GAP_LARGE`-warning.
