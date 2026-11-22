# ETAP 18 — eBobo Premium Experience

**Data:** 2026-11-22  
**Branch:** `feature/ebobo-frontend-mvp`  
**HEAD bazowy (Etap 17):** `3dc2ab4`  
**Commit UI polish:** `2555f9a`  
**Werdykt:** **PREMIUM UI GOTOWE WARUNKOWO** (po domknięciu polishu Fazy C/D)

---

## 1. Wizja nowego designu

Premium · Soft · Minimal · Trustworthy · Human  
Spokojny teal, ciepła biel, stonowane szarości — bez chaosu dashboardu i bez infantylnych ozdób.  
Hierarchia prowadzi użytkownika: **świadczenia → szczegóły → kwota → formalności**.

## 2. Główne problemy poprzedniej wersji

- Niespójne akcenty (bursztyn / teal / ZUS green konkurujące o uwagę).
- Bottom nav z ciężkim „FAB” na Świadczeniach (ikona w pełnym kole primary).
- Karty świadczeń zbyt równe wagowo; brak wyraźniejszego podziału sekcji.
- Cienie headera zbyt mocne; spacing bez skali 20/40.
- Kwota kalkulatora bez dedykowanego tokenu typograficznego.

## 3. Nowa paleta

| Token | Hex (kierunek) | Rola |
|---|---|---|
| `primary` | `#1A6B66` | Marka, CTA, active nav |
| `primarySoft` | `#E4F2F0` | Pastylki, tła aktywne |
| `background` | `#F5F7F6` | Canvas |
| `backgroundWarm` / `header` | `#F7F5F1` | Chrome, wrażliwe ekrany |
| `surface` | `#FFFFFF` | Karty |
| `text` / `textSecondary` / `textMuted` | `#1C2B2A` / `#4A5C5A` / `#6E7F7C` | Hierarchia tekstu |
| `success` / `warning` / `danger` | spokojne, niekrzykliwe | Statusy |

Źródło prawdy: `src/theme/palette.ts` → `colors.ts`.

## 4. Typografia i spacing

- Display / h1–h2: Literata (web); body / h3 / button: Source Sans 3.
- Nowy poziom: `typography.amount` (kwoty).
- Spacing: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48` (`mdPlus`, `xlPlus`).
- Radii: `10 / 14 / 18 / 24`.
- Content max: 720 (mobile/tablet), 960 (desktop expanded).

## 5–13. Ekrany (skrót przed/po)

| Ekran | Zmiana |
|---|---|
| Bottom Navigation | Miękka pastylka active; Świadczenia wyróżnione borderem soft, bez FAB |
| Moje świadczenia | Sekcje „Może przysługiwać” / „Wymaga informacji” / rozwijane pozostałe; elevated priority cards |
| Szczegóły | Elevated „Twój wynik”; zachowana ścieżka wynik→kwota→docs→linki |
| Kalkulator | Microcopy „Oto Twoje wyliczenie”; `typography.amount`; elevated hero |
| Onboarding / Welcome | Tokeny + ChoiceChip (grubszy border, soft selected) — bez nowych kroków |
| Mój Plan | Elevated focus card; spokojniejsze border colors |
| Sample cases / Help | Spokojniejsze intro; help na `backgroundWarm` |
| Profil / complete-data | Elevated „Twoja sytuacja”; spokojniejsze microcopy; pełna szerokość CTA |
| Moje Sprawy | Hero „Co masz do załatwienia?” + kolorowe liczniki todo/w trakcie/zrobione |
| Wyjaśnienia AI | Elevated card; soft borders; bez żargonu „REST” w copy |
| Onboarding finish | Ekran „Sprawdzamy Twoje możliwości” → `/benefits` (bez sztucznego delay) |

## 14. Stany loading / error / success

- Hub: „Sprawdzamy Twoje możliwości” + elevated card.
- EmptyState: delikatna ramka + znacznik marki.
- Error: bez zmiany semantyki (błąd ≠ brak uprawnienia).

## 15. Mikrointerakcje

- Button: scale 0.985 + opacity.
- ChoiceChip: scale 0.99.
- Bottom nav: pastylka active (bez ciężkiej animacji bibliotek).

## 16. Accessibility

- Touch min 44 px zachowane.
- Statusy nadal badge + tekst (nie sam kolor).
- Kontrast primary/text na jasnym tle utrzymany w kierunku WCAG AA.
- Pełny audit a11y narzędziowy — **nie wykonany** w tej sesji → warunek werdyktu.

## 17. Responsywność

- `contentMaxWidth` / `navMaxWidth` ograniczone na desktopie.
- Screenshoty zapisane w `docs/etap18/screenshots/` (390 + desktop 1440 welcome; loading hub; kalkulator; sprawy; help; profil).
- Pełna macierz 320/375/428/768/1024 — nie wszystkie szerokości; 390 + 1440 pokryte.

## 18. Regresja

| Test | Wynik |
|---|---|
| `npm run typecheck` | **PASS** |
| `npm run test:regression` | **PASS** |
| `npm run export:web` | **PASS** |
| Logika eligibility / calc / missing_fields | **bez zmian semantyki** |

## 19. Zmienione pliki (UI)

`src/theme/*`, `BottomNav`, `Button`, `Card`, `Badge`, `ChoiceChip`, `EmptyState`, `Stepper`, `TextField`, `AppHeader`, `BenefitsHubScreen`, `BenefitDetailScreen`, `CalculatorPanels`, `MyPlanScreen`, `SampleCasesScreen`, `HelpSupportScreen`, `useAdaptiveLayout`.

## 20. Commity / HEAD

| Commit | Opis |
|---|---|
| `2555f9a` | UI polish Etap 18 (tokens + hub/nav/calc) |
| `051039d` | docs Etap 18 (pierwszy raport) |
| *(follow-up)* | Sprawy / Profil / AI / onboarding finish + screenshots |

**Sync origin:** po pushu follow-upu.

---

## Odpowiedzi obowiązkowe

1. **Czy wygląda jak spójny produkt konsumencki?** Tak — wspólna paleta i komponenty; nadal miejsce na dalszy polish detali.
2. **Czy „Moje świadczenia” jest wizualnie najlepszym ekranem?** Tak, to celowo flagowy hub z wyraźną hierarchią.
3. **Czy rodzic bez znajomości ZUS znajdzie następny krok?** Tak — CTA „Zobacz szczegóły” / „Uzupełnij dane” + Plan/Sprawy.
4. **Czy coś wygląda jak nieskończony prototyp?** Nadal drobne: checklista Spraw ma gęstą listę pozycji; pełna macierz viewportów nie jest w 100% udokumentowana.
5. **Czy można pokazać jury bez dużych zmian?** Tak — pakiet screenshotów w `docs/etap18/screenshots/` + spójna paleta. Publiczne demo nadal zależy od stałego hostingu (Etap 17).

### Werdykt

**PREMIUM UI GOTOWE WARUNKOWO** — foundation + hub + nav + calc + Sprawy/Profil/AI/onboarding finish + screenshoty 390/1440. Warunki: pełniejsza macierz viewportów opcjonalna; publiczny URL FE/BE nadal poza FE.
