# ETAP 14 — Final UI/UX Polish eBobo

**Data:** 2026-11-22  
**Baza przed zmianami:** `8a723bc`  
**Werdykt:** **GOTOWE** (FE polish; bez zmian BE / eligibility / kalkulatora)

---

## 1. Cel

Dopracować produkt wizualnie i funkcjonalnie do oddania konkursowego:

- Świadczenia jako pierwszy ekran po onboardingu i dla powracających.
- Hub świadczeń jako wizytówka produktu.
- Premium bottom navigation z wyróżnieniem „Świadczenia”.
- Oczyszczenie copy DEMO/dev z głównego UI bez wprowadzania w błąd.
- Spójność Plan / Sprawy / Kalkulator / Profil / stany UI.

---

## 2. FE-01 — Domyślny ekran = Świadczenia

| Wejście | Docelowa trasa |
|---|---|
| Koniec onboardingu | `/benefits` |
| Auth (gość / mObywatel) + onboarding ukończony | `/benefits` |
| Auth + onboarding nieukończony | `/welcome` |
| Welcome → „Przejdź…” | `/benefits` |
| Complete-data po zapisie | `/benefits` |
| Back fallback w `Screen` | `/benefits` |

Helper: `src/lib/appHome.ts` (`resolvePostEntryHref`, `APP_HOME_HREF`).

Deep linki i edycja profilu / ankiety bez zmian wymuszających wyjście z aktywnej ścieżki.
Silnik 9× eligibility bez zmian.

---

## 3. FE-02 — Hub świadczeń jako wizytówka

Plik: `src/features/benefits/BenefitsHubScreen.tsx`

Struktura:

1. Nagłówek „Twoje świadczenia” + krótki lead.
2. Lekkie chipy podsumowania (liczby z `countEligibilityBuckets`, nie hardkod).
3. Karty `likely_eligible` pierwsze + CTA „Zobacz szczegóły”.
4. Sekcja wymaga informacji / możliwości z CTA „Uzupełnij informacje” tam, gdzie `nextStepHref` prowadzi do `/complete-data`.
5. Rozwijane „Pozostałe świadczenia” dla `not_eligible`.
6. Szybkie przejścia: Plan · Kalkulator · Sprawy.
7. `LegalDisclaimer` (bez technicznego „Wersja reguł” / DemoBanner na hubie).

Loading: stabilna karta „Sprawdzamy Twoje możliwości” (bez pustego dashboardu).
Błędy API oddzielone od oceny uprawnień (`unchecked` chip).

---

## 4. FE-03 — Bottom navigation

- Te same 5 zakładek: Plan · Sprawy · Świadczenia · Kalkulator · Profil.
- Ikony Lucide (outline): `CalendarDays`, `ListChecks`, `FileCheck`, `Calculator`, `UserRound`.
- Pasek max-width 520 px, wyśrodkowany na szerokich ekranach.
- Active state pastylką; zakładka Świadczenia z wypełnioną ikoną (primary).
- Safe area zachowane; brak remountu katalogu przy przełączaniu (wspólny `useCatalogEligibility`).

Sidebar: usunięto badge „Demo”; tagline „Przewodnik świadczeń”.

---

## 5. FE-04 — Copy produktowe

Usunięto / złagodzono z głównych powierzchni:

- „DEMO”, „FastAPI”, „adapter”, „local fallback” w komunikatach użytkownika.
- Głośne banery Demo na hubie świadczeń.
- Sidebar „Demo”.

Zachowano:

- Ostrzeżenia, że ocena nie jest decyzją ZUS.
- Oznaczenie symulacji logowania / danych ZUS.
- Informację, że lokalne wskazówki planu nie zastępują oceny.

Zaktualizowano m.in.: `DemoBanner`, `ApiHealthBanner`, `LegalDisclaimer`, `mapEligibilityCheckToBenefit` (teksty prezentacji), `MyPlanScreen`, onboarding, complete-data, review/detail.

---

## 6. FE-06–09 — Polish pozostałych ekranów

| Ekran | Zmiana |
|---|---|
| Mój Plan | Lead „Co masz teraz zrobić”; lokalne wskazówki bez etykiety DEMO; bez duplikacji katalogu |
| Profil | CTA: świadczenia → uzupełnij dane → plan; „Wyczyść dane lokalne” zamiast „Restart demo” |
| Complete-data | Soft banner; po zapisie → `/benefits` |
| Kalkulator | Bez zmiany logiki; wspólny krótszy disclaimer |

---

## 7. Weryfikacja techniczna

| Check | Wynik |
|---|---|
| `npx tsc --noEmit` | OK |
| Zmiany BE / kontrakty API | brak |
| 9× eligibility | bez zmian mechanizmu |
| `null` / `false` / `0` semantyka | bez zmian |

---

## 8. Checklist odbioru (Etap 14)

- [x] Po onboardingu → Świadczenia
- [x] Powracający z ukończoną ankietą → Świadczenia (auth entry)
- [x] Przerwany onboarding → welcome / kontynuacja
- [x] Hub: podsumowanie + likely first + remaining collapsible
- [x] Bottom nav premium + wyróżnienie Świadczeń
- [x] Copy bez zbędnego DEMO/dev na głównych ekranach
- [x] Disclaimer informacyjny zachowany
- [x] Typecheck OK
- [ ] Ręczny przegląd szerokości 320–1440 (web) — do potwierdzenia na urządzeniu / przeglądarce

---

## 9. Pliki kluczowe

- `src/lib/appHome.ts` (nowy)
- `src/features/benefits/BenefitsHubScreen.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/layout/navItems.ts`
- `src/features/onboarding/OnboardingWizard.tsx`
- `src/features/auth/LoginScreen.tsx`
- `src/features/auth/AuthConnectedScreen.tsx`
- `src/features/plan/MyPlanScreen.tsx`
- `src/services/api/mapEligibilityCheckToBenefit.ts`

---

## 10. Następny krok (opcjonalnie)

1. Commit Etapu 14 (na życzenie).
2. Szybki smoke web: Welcome → ankieta → Świadczenia → Plan → Sprawy → Kalkulator → Profil.
3. Etap 13B (mapowanie `missing_fields`), jeśli jurorzy mają testować precyzyjne uzupełnianie pól.
