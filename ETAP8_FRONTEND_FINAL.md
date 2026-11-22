# ETAP 8 — Finalna stabilizacja frontendu eBobo

**Data:** 2026-11-22  
**Gałąź:** `feature/ebobo-frontend-mvp`  
**Bazowy commit:** `ece9f3f` (Etap 7)  
**Commit Etapu 8 (kod + raport):** `5ec1e89`  

**Werdykt:** frontend gotowy do demonstracji jury przy działającym FastAPI. W trakcie Etapu 8 tunel ngrok zwracał **HTTP 502** — ścieżka użytkownika, stany błędów i lokalny plan DEMO działają; live calculate/compare nie dało się ponownie potwierdzić w tej sesji (referencja: Etap 7 PASS).

---

## 1. Wykonane poprawki

### FE-01 — Prezentacja wyników kalkulatora (P0)

- Rozdzielono **defekt wyliczenia** od **ostrzeżeń informacyjnych/prawnych**.
- `hasCalculationDefectWarning` / `compareHasCalculationDefect` nie oznaczają już każdej odpowiedzi z `warnings` jako „wstępnej”.
- Informacyjne teksty o 81,5% i 9 tyg. @70% pozostają widoczne jako ostrzeżenia, bez badge „wstępna”.
- Defekt: tekst o błędnym zastosowaniu 81,5% do nieprzenoszalnych tygodni **lub** pola `rate_percentage_parent_*` ≈ 81,5 przy `weeks === non_transferable`.
- Schemat compare przyjmuje opcjonalne `rate_percentage_parent_a/b` (bez wymuszania kontraktu).
- Kwoty nadal wyłącznie z API — bez lokalnego przeliczania.
- Regresja jednostkowa w `scripts/regression-formalities.ts`.

### FE-02 — Disclaimer prawny (P0)

- Nowy `LegalDisclaimer` + stałe w `calculatorPresentation.ts`.
- Pełny tekst zgodny z briefem Etapu 8.
- Widoczny: kalkulator (wyniki + ekran), hub świadczeń, szczegóły (wariant `verification` przy `needs_review`), Mój plan.

### FE-03 — DG / ZAM / Z-3b (P1)

- Mapowanie planu API: preferencja **ZAM**, oznaczanie wycofanych **Z-3b/ZUR/ZAO** jako nieaktualnych wzorów (nie jako pewny obowiązek).
- Dokumenty z polem `when` prezentowane jako zależne od sytuacji.
- Podstawy prawne z `plan.legal_basis` w krokach procedury.
- Ekran dokumentów: komunikat o wycofaniu Z-3b + bieżący ZAM (bez hardkodu kwot).
- Live ocena DG z FastAPI: **niedostępna w tej sesji (502)** — zgłoszenie BE poniżej.

### FE-04 — Stabilność API (P0)

Zweryfikowano przy niedostępnym silniku (502):

| Scenariusz | Wynik |
|---|---|
| Backend OK | Niezweryfikowany w tej sesji (ngrok 502); Etap 7 PASS |
| HTTP 500/502 | Komunikat użytkownika + „Spróbuj ponownie” / „Sprawdź ponownie” |
| Timeout | Obsłużony w `apiErrorMessage` (`code === 'timeout'`) |
| Zerwane połączenie / niedostępność | `network_error` → czytelny komunikat; lokalny plan działa |
| Przywrócenie | Refetch health + mutation retry (przyciski obecne) |
| Brak fikcyjnych kwot | Kalkulator: błąd obliczenia, **brak** 28 187,60 / innych kwot demo |

`ApiHealthBanner` nadal oddziela stan usługi od błędu pojedynczego żądania.

### FE-05 / FE-06 — Ekrany i S1–S3

Przetestowano web: Welcome → Onboarding → Demo S1/S2/S3 → Mój plan → Moje sprawy → Dokumenty → Kalkulator.  
Responsywność: 375 / 390 / 768 / 1440 px (screenshoty w `docs/etap8/`).  
Android/iOS: **nie testowano** w Etapie 8.

---

## 2. Zmienione pliki

- `src/features/calculator/calculatorPresentation.ts`
- `src/features/calculator/CalculatorPanels.tsx`
- `src/features/calculator/CalculatorScreen.tsx`
- `src/services/api/parentalCompare.ts`
- `src/services/api/mapEligibilityCheckToBenefit.ts`
- `src/components/ui/LegalDisclaimer.tsx` *(nowy)*
- `src/features/benefits/BenefitDetailScreen.tsx`
- `src/features/benefits/BenefitsHubScreen.tsx`
- `src/features/plan/MyPlanScreen.tsx`
- `scripts/regression-formalities.ts`
- `docs/etap8/*` *(zrzuty)*
- `ETAP8_FRONTEND_FINAL.md`

---

## 3. Wyniki testów technicznych

| Test | Wynik |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test:regression` | PASS (m.in. FE-01 presentation) |
| `npm run export:web` | PASS → `dist/` |
| Web 375 / 390 / 768 / 1440 | PASS (smoke + screenshoty) |
| Android / iOS | Nie uruchamiano |

---

## 4. Wyniki S1–S3

### S1 — Kobieta w ciąży, UoP (`pregnant_employee`)

- Profil: ciąża, etat, ubezpieczenie.
- Mój plan: etap „Jestem w ciąży”, lokalna oś DEMO (badania, ZAM, terminy).
- Świadczenia / kalkulator: API 502 → błąd + retry, **bez** przykładowych kwot.
- Nawigacja i checklista lokalna: OK.

### S2 — Rodzice po narodzinach (`both_parents_split`)

- Profil: „Dziecko już się urodziło”, ~1 miesiąc, `fullDoseClaimedWithin21Days`.
- Plan: inne zadania (np. USC) niż S1 — dane profilu wpływają na lokalny plan.
- Compare live: niedostępne (502); UI porównania i disclaimer gotowe; heurystyka FE-01 pokryta testem regresji (70% na 9 tyg. ≠ wstępna).

### S3 — Działalność gospodarcza (`self_employed`)

- Profil DG wczytany; Moje sprawy: lokalna checklista z **ZAM**, bez prezentacji Z-3b jako bieżącego.
- Dokumenty: nota o wycofaniu ZUR/ZAO/Z-3b + formularz ZAM.
- Ocena FastAPI dla DG: 502 — brak live dokumentów z silnika w tej sesji.

---

## 5. Status integracji z FastAPI

| Endpoint / obszar | Status Etap 8 |
|---|---|
| Health via ngrok / `/zus-proxy` | **FAIL 502** (sesja Etapu 8) |
| Eligibility / calculate / compare | Niedostępne w sesji; **Etap 7: PASS** po poprawkach BE (m.in. 28 187,60 / 7 610,78 / 44 367,41) |
| FE kontrakt + prezentacja | Gotowe; nie maskuje awarii |

**Wnioski:** frontend nie zależy od lokalnych formuł. Do jury wymagany jest **działający tunel/backend**.

---

## 6. Pozostałe ograniczenia

- Brak live ponownej weryfikacji kwot w Etapie 8 (502).
- Brak testów natywnych Android/iOS w tym etapie.
- Lokalny plan DEMO ≠ decyzja ani ocena silnika (świadomie rozdzielone w UI).
- Pola `rate_percentage_parent_*` opcjonalne — gdy BE ich nie poda, FE nie zgaduje defektu poza tekstem ostrzeżeń o defekcie.

---

## 7. Problemy wymagające interwencji backendu / ops

1. **P0 ops:** przywrócić FastAPI za ngrok (`EXPO_PUBLIC_API_URL`) — obecnie 502 Bad Gateway.
2. **Kontrakt (opcjonalne, FE już toleruje):** jawne `rate_percentage_parent_a/b` w `compare/urlop-rodzicielski` ułatwia rozróżnienie 81,5% vs 70% na 9 tyg. bez heurystyki tekstowej.
3. **DG / formularze:** jeśli silnik nadal zwraca Z-3b jako wymagany druk — poprawić reguły BE (FE oznacza jako nieaktualne, ale źródłem prawdy powinien być BE).
4. **Stabilność:** sporadyczny `ECONNRESET` z Etapu 7 — monitorować tunel; FE pokazuje błąd sieci, nie maskuje.

---

## 8. Numer commita

`5ec1e89` — `fix(etap8): stabilize calculator presentation and jury demo readiness`  
(aktualizacja numeru w tym pliku może być w kolejnym mikro-commicie docs)

---

## Zrzuty dla jury

Katalog: `docs/etap8/`

- `welcome-390.png`
- `onboarding-390.png`
- `benefits-api-down-390.png` — awaria API bez fikcyjnych kwot
- `calculator-disclaimer-1440.png` / `calculator-error-no-fake-amount.png`
- `moj-plan-s2-375.png`
- `sprawy-s3-768.png`

---

## Kryteria zakończenia

| Kryterium | Status |
|---|---|
| Kalkulator poprawnie prezentuje odpowiedzi FastAPI | Gotowość FE; live 502 w sesji |
| Wyliczenia ≠ decyzja ZUS | PASS (disclaimer) |
| Ostrzeżenia zrozumiałe, bez fałszywej „wstępnej” | PASS (test + kod) |
| Brak zawieszenia przy awarii API | PASS |
| Pełna ścieżka użytkownika | PASS (web) |
| Testy techniczne | PASS |
| Brak regresji Etapów 4–6 | PASS (smoke) |
