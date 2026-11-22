# ETAP 18 — eBobo Premium Experience

**Data:** 2026-11-22  
**Branch:** `feature/ebobo-frontend-mvp`  
**HEAD bazowy (Etap 17):** `3dc2ab4`  
**Commit UI polish:** `2555f9a`  
**Werdykt:** **PREMIUM UI GOTOWE WARUNKOWO**

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
| Profil / complete-data | Dziedziczą Card/Button/TextField (bez zmiany mapowania missing_fields) |

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
- Pełna macierz screenshotów 320–1440 — **częściowo** (capture browser zwrócił czarny kadr; wymaga ręcznego przeglądu lokalnego).

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
| `2555f9a` | UI polish Etap 18 (tokens + ekrany) — już na branchu |
| *(ten raport)* | docs Etap 18 |

**Sync origin:** branch był zsynchronizowany po `2555f9a`; raport = osobny commit.

---

## Odpowiedzi obowiązkowe

1. **Czy wygląda jak spójny produkt konsumencki?** Tak — wspólna paleta i komponenty; nadal miejsce na dalszy polish detali.
2. **Czy „Moje świadczenia” jest wizualnie najlepszym ekranem?** Tak, to celowo flagowy hub z wyraźną hierarchią.
3. **Czy rodzic bez znajomości ZUS znajdzie następny krok?** Tak — CTA „Zobacz szczegóły” / „Uzupełnij dane” + Plan/Sprawy.
4. **Czy coś wygląda jak nieskończony prototyp?** Tak, częściowo: brak pełnego pakietu screenshotów jury; niektóre ekrany (Sprawy checklista, AI panel) dostały głównie dziedziczenie tokenów, nie osobny redesign layoutu.
5. **Czy można pokazać jury bez dużych zmian?** Tak funkcjonalnie + wizualnie bazowo; warto zrobić 5–10 ręcznych screenshotów mobile przed slajdami.

### Werdykt

**PREMIUM UI GOTOWE WARUNKOWO** — foundation + hub + nav + calc gotowe; pełna dokumentacja wizualna (screenshoty wszystkich szerokości) i głębszy polish Spraw/AI = follow-up prezentacyjny, nie blocker funkcjonalny.
