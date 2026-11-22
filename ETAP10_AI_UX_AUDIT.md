# ETAP 10 — Audyt UX i integracji AI (eBobo)

**Data:** 2026-11-22  
**Gałąź:** `feature/ebobo-frontend-mvp`  
**Bazowy tip przed Etapem 10:** `2375f21`  
**Werdykt:** **GOTOWE** (z uwagami backendowymi poniżej)

---

## 1. Werdykt

Frontend łączy deterministyczny silnik eligibility z wyjaśnieniem AI bez nadpisywania statusu. Pełna ścieżka Welcome → demo/onboarding → Mój Plan → Sprawy → Świadczenia → szczegóły → „Wyjaśnij mój wynik” działa na live FastAPI (ngrok). Race, abort, mismatch statusów i puste sekcje są zabezpieczone po stronie FE. Aplikacja pozostaje użyteczna przy błędach AI.

---

## 2. Pełna ścieżka użytkownika

| Krok | Wynik | Uwagi |
|---|---|---|
| Welcome | PASS | CTA sytuacji + komunikat „nie decyzja ZUS” |
| Demo / onboarding profilu | PASS | Profile S1–S3 w `/demo`; dane w Zustand |
| Mój Plan (`/home`) | PASS | Sytuacja odpowiada profilowi (ciąża / po porodzie) |
| Sprawy / checklista | PASS | Filtry i statusy spójne z Etapem 9 |
| Świadczenia | PASS | Statusy A–E z silnika, nie z AI |
| Eligibility (REST) | PASS | Live `/eligibility/check/{code}` |
| Wyjaśnij mój wynik | PASS | Live `/legal-advisor/explain/{code}` |
| Kolejny krok | PASS | Procedura / ankieta / kalkulator poza kartą AI |

**Źródło wyników:** live API (nie fixture). Tryb `EXPO_PUBLIC_API_MODE=rest`.

---

## 3. Scenariusze S1–S3 (live API)

### S1 — Kobieta w ciąży, umowa o pracę (`pregnant_employee`)

| Warstwa | Wynik |
|---|---|
| Eligibility `zasilek_macierzynski_urlop_macierzynski` | `likely_eligible` |
| Explain | `status: likely_eligible`, `source: ai`, `requires_additional_verification: false` |
| UI Plan | „Jestem w ciąży”, postęp checklisty |
| UI Explain | Badge AI, sekcja „Dlaczego…”, bez pustych kart |

### S2 — Rodzice po narodzinach (`both_parents_split`)

| Warstwa | Wynik |
|---|---|
| Eligibility `urlop_rodzicielski` | `requires_verification` + `missing_data` |
| Explain | `requires_verification`, `source: ai`, **`requires_additional_verification: true`** |
| UI | Ostrzeżenie dodatkowej weryfikacji, brakujące info, kroki, link do ankiety |

### S3 — Działalność gospodarcza (`self_employed`)

| Warstwa | Wynik |
|---|---|
| Eligibility macierzyński | `likely_eligible` + warning Z-3b/ZAM |
| Explain | `likely_eligible`, `source: ai`, **`requires_additional_verification: true`** |
| UI | Ostrzeżenie weryfikacji przy zachowanym statusie silnika |

---

## 4. AI / fallback / weryfikacja / puste sekcje / mismatch

| Case | Wynik |
|---|---|
| A. `source: "ai"` | PASS — subtelny badge „Wyjaśnienie przygotowane z pomocą AI” |
| B. `source: "fallback"` | PASS (schema + regresja) — bez badge AI, bez komunikatu awarii oceny |
| C. `requires_additional_verification: true` | PASS (S2, S3 live) — żółte ostrzeżenie |
| D. Puste sekcje | PASS — puste tablice nie renderują kart |
| E. Rozbieżny status | PASS — pełna treść explain ukryta; komunikat o niespójności; status silnika bez zmian |

AI **nie** zmienia `engineStatus` / karty eligibility. Brak prezentacji wyjaśnienia jako decyzji ZUS (stały disclaimer).

---

## 5. Aktualność danych i ochrona przed starymi odpowiedziami

| Scenariusz | Mechanizm | Wynik |
|---|---|---|
| Zmiana profilu / świadczenia | `profileKey` + `benefit.id` → abort + `requestGen++` + clear result | PASS |
| Stara odpowiedź po nowym gen | `shouldAcceptExplainResponse` | PASS (regresja) |
| Zły `benefit_code` w odpowiedzi | odrzucenie | PASS |
| Ponowne kliknięcie | clear result przed mutate; disabled podczas pending | PASS |
| Opuszczenie ekranu w trakcie | abort unmount; `code: aborted` nie pokazuje błędu UI | PASS |
| Retry | świeży payload z aktualnego `profile` | PASS |

---

## 6. Błędy i timeouty

| Case | Wynik |
|---|---|
| Loading / skeleton | PASS — spinner + „kilkanaście sekund” |
| Multi-click | PASS — pending ukrywa CTA |
| Timeout FE 25s | PASS — `timeoutMs` w kliencie explain; komunikat bez traceback |
| Abort vs timeout | PASS — `httpClient` rozróżnia `aborted` vs `timeout` |
| HTTP 404 | PASS live — komunikat użytkownika (bez „kalkulacji”) |
| HTTP 422 | PASS live — walidacja body |
| HTTP 500/502 | PASS (mapowanie komunikatu FE) |
| Zerwanie / network | PASS — komunikat sieciowy; eligibility zostaje |
| Retry | PASS |
| Nawigacja podczas ładowania | PASS — abort, brak fałszywej odpowiedzi |

**Eligibility nie jest kasowane przy błędzie AI.**

---

## 7. Problemy UX / integracyjne i poprawki FE

| # | Problem wykryty w audycie | Poprawka |
|---|---|---|
| 1 | Abort unmount pokazywał się jak timeout/błąd AI | `httpClient`: `aborted` vs `timeout`; `isUserAbortError` filtruje UI |
| 2 | Brak twardej bramki race/`benefit_code` | `explainAcceptance.ts` + użycie w `BenefitExplainSection` |
| 3 | Mismatch statusów nadal pokazywał pełny tekst AI | Ukrycie body; ostrzeżenie + retry |
| 4 | Tytuły sekcji nie zgodne z briefem Etapu 10 | Kolejność: Dlaczego / Braki / Co teraz / Inne / Podstawa |
| 5 | Link do ankiety zawsze przy krokach | Tylko gdy `missing_data_explained.length > 0` |
| 6 | Stary wynik AI przy retry / zmianie profilu | Clear `result` przy mutate i przy `profileKey` |
| 7 | Komunikat 404/422 sugerował „kalkulację” | Uogólnione komunikaty w `apiErrorMessage.ts` |

Bez redesignu, bez nowych funkcji biznesowych, bez zmian BE.

---

## 8. Zmienione pliki

- `src/features/benefits/BenefitExplainSection.tsx`
- `src/features/benefits/explainAcceptance.ts` *(nowy)*
- `src/services/api/httpClient.ts`
- `src/lib/apiErrorMessage.ts`
- `scripts/regression-legal-advisor.ts`
- `ETAP10_AI_UX_AUDIT.md`
- `docs/etap10-screenshots/*`

---

## 9. Zrzuty ekranu

Katalog: `docs/etap10-screenshots/`

- `etap10-s1-plan-pregnancy.png` — Mój Plan dla S1 (ciąża)
- `etap10-s1-benefits.png` — lista świadczeń
- `etap10-s1-ai-explain.png` — karta AI (`source: ai`)
- `etap10-s2-ai-verify.png` — S2 + ostrzeżenie dodatkowej weryfikacji
- `etap10-s1-plan.png` — wcześniejszy stan planu (profil S2, kontrola przełączania)

---

## 10. Testy techniczne

| Komenda | Wynik |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test:regression` | PASS (formalities + legal-advisor) |
| `npm run export:web` | PASS → `dist/` |

Regresja AI obejmuje: schemat ai/fallback, puste sekcje, alignment statusów, race gen, mismatch `benefit_code`, abort vs timeout, `request_log_entry_id` w schemacie (nie w UI).

---

## 11. Problemy wymagające backendu

1. **S1 explain** czasem zwraca puste `suggested_next_steps` przy `likely_eligible` — FE poprawnie ukrywa sekcję; kolejny krok zostaje w procedurze świadczenia, ale BE mógłby uzupełniać konkretne kroki.
2. **S3** `likely_eligible` + `requires_additional_verification: true` — sensowne przy DG/Z-3b; warto utrzymać spójne warningi w eligibility i explain.
3. Brak łatwego sposobu wymuszenia `source: "fallback"` w live bez wyłączenia OpenRouter — pokryte schema/regresją FE.
4. GET na explain → 405 (oczekiwane); osobny probe 500/502 zależny od stanu tunelu.

---

## 12. Numer commita

Commit Etapu 10: *(uzupełniany po `git commit` — patrz `git log -1 --oneline`)*.

Bazowy przed zmianami: `2375f21`.

---

## Kryterium sukcesu — checklista

- [x] Rodzic przechodzi proces i dostaje wynik uprawnień  
- [x] Jedno kliknięcie „Wyjaśnij mój wynik”  
- [x] Wyjaśnienie dotyczy aktualnego profilu i `benefit_code`  
- [x] AI nie zmienia decyzji silnika, nie generuje kwot, nie zastępuje ZUS  
- [x] Stabilność przy opóźnieniach i błędach API  
