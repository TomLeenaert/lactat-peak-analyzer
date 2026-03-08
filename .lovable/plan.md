

## Lactaat Inspanningstest Analyzer

Een complete React-app op basis van het geüploade HTML-bestand — een lactaat maximale inspanningstest calculator met wetenschappelijke berekeningsmethoden.

### Pagina's & Tabs

De app krijgt **5 tabs** (net als het origineel):

1. **📋 Protocol** — Stapsgewijs testprotocol met voorbereiding, testverloop en materiaallijst
2. **📊 Data Invoer** — Formulier voor atleetgegevens, rustlactaat, stapduur, stap-increment + dynamische tabel voor stappen (snelheid, lactaat, hartslag). Met "Voorbeeld laden" en "Wissen" knoppen
3. **🎯 Resultaten** — Lactaatcurve (Recharts) met 3e-graads polynoomfit, LT1/LT2 drempels, OBLA-lijnen, en gedetailleerde resultaatkaarten per drempel (OBLA, Baseline+0.5, Log-Log, Dmax, Modified Dmax)
4. **🏃 Zones** — 5-zone trainingsmodel (Seiler) met kleurenbalk, zonetabel (snelheid, tempo, hartslag, lactaat) + hartslag-vs-snelheid grafiek
5. **📚 Wetenschap** — Uitleg berekeningsmethoden en referenties

### Kernfunctionaliteit

- **Polynoomfit (3e graad)** met least-squares, R²-berekening
- **LT1-berekening**: OBLA 2.0, Baseline+0.5, Log-Log methode
- **LT2-berekening**: OBLA 4.0, Dmax, Modified Dmax
- **Trainingszones** automatisch berekend op basis van LT1/LT2
- **Grafieken** via Recharts (lactaatcurve + HR-curve)
- **Tempo-berekening** (min/km) overal

### Design

- Crème/teal kleurenpalet uit het origineel, met dark mode support
- Cards, result-boxes, zone-bar en method-tags conform het originele design
- Responsive grid layout
- Nederlandse taal

