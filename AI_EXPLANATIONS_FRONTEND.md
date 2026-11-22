# Integracja wyjaśnień AI (legal-advisor) — frontend eBobo

**Data:** 2026-11-22  
**Gałąź:** `feature/ebobo-frontend-mvp`  
**Endpoint:** `POST /api/v1/legal-advisor/explain/{benefit_code}`  

---

## 1. Opis integracji

Frontend wysyła **ten sam payload** co `eligibility/check` (`profileToEligibilityCheckRequest`), bez wyniku eligibility.

Backend ponownie liczy uprawnienia i zwraca zrozumiałe wyjaśnienie (`source: ai | fallback`).

FE:

- nie zmienia statusu karty świadczenia na podstawie AI,
- porównuje `status` explain z `engineStatus` z silnika — przy rozjeździe ostrzeżenie diagnostyczne, wynik eligibility zostaje,
- timeout klienta **25 s** (+ proxy Metro 30 s).

---

## 2. Lokalizacja w UI

Ekran **szczegółów świadczenia** (`BenefitDetailScreen`), zaraz po sekcji „W skrócie”.

- `not_eligible` / `needs_review` / `requiresVerification` → nagłówek „Nie wszystko jasne? Wyjaśnimy Ci wynik” + CTA primary.
- `likely_eligible` → „Chcesz jaśniejsze wyjaśnienie?” + CTA secondary.
- Wywołanie **tylko na żądanie** („Wyjaśnij mój wynik”).
- Tryb `mock`: informacja, że wymagany jest REST.

---

## 3. Komponenty

| Element | Plik |
|---|---|
| Sekcja UI | `src/features/benefits/BenefitExplainSection.tsx` |
| Klient API | `src/services/api/legalAdvisorExplain.ts` |
| Schemat + alignment | `src/services/api/legalAdvisorExplainSchemas.ts` |
| Integracja | `BenefitDetailScreen.tsx` |
| Design system | `Card`, `Badge`, `Button`, `LegalDisclaimer` |

Karta wyniku: wyjaśnienie → brakujące dane → kroki → inne świadczenia (linki) → rozwijana podstawa prawna.  
`request_log_entry_id` nie jest pokazywany użytkownikowi.

---

## 4. Loading, AI, fallback

- Loader: „Przygotowujemy wyjaśnienie Twojej sytuacji…”
- `source: "ai"` → badge „Wyjaśnienie przygotowane z pomocą AI”
- `source: "fallback"` → treść bez alarmu
- `requires_additional_verification` → komunikat o oficjalnych źródłach
- Błąd / timeout → komunikat + „Spróbuj ponownie”; eligibility bez zmian
- Abort przy zmianie świadczenia/profilu i przy unmount

---

## 5. Wyniki testów

| Test | Wynik |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test:regression` (+ `regression-legal-advisor.ts`) | PASS |
| `npm run export:web` | PASS |
| Live health | PASS `200` |
| Live explain (macierzyński) | PASS `200`, `source: ai` |
| UI mobile 390 — CTA + wynik AI | PASS |
| Desktop 1440 — nawigacja / widok | PASS (smoke) |

Pokrycie skryptem regresji: schemat AI/fallback, puste tablice, alignment statusów, flaga `requires_additional_verification`.  
Scenariusze HTTP 404/422/timeout — obsługa przez istniejący `apiRequest` + UI retry (smoke live OK; pełna matryca błędów nie mockowana w przeglądarce).

---

## 6. Zmienione pliki

- `src/services/api/config.ts`
- `src/services/api/httpClient.ts` (`timeoutMs`)
- `src/services/api/legalAdvisorExplain.ts`
- `src/services/api/legalAdvisorExplainSchemas.ts`
- `src/services/api/index.ts`
- `src/services/api/CONTRACT.md`
- `src/services/api/mapEligibilityCheckToBenefit.ts` (`engineStatus`)
- `src/services/api/CatalogEligibilityAdapter.ts`
- `src/services/api/schemas.ts`
- `src/types/benefits.ts`
- `src/features/benefits/BenefitExplainSection.tsx`
- `src/features/benefits/BenefitDetailScreen.tsx`
- `metro.config.js` (timeout proxy 30 s)
- `scripts/regression-legal-advisor.ts`
- `package.json` (`test:regression`)
- `docs/ai-explanations/*`
- `AI_EXPLANATIONS_FRONTEND.md`

---

## 7. Zrzuty

- `docs/ai-explanations/explain-mobile-390.png`
- `docs/ai-explanations/explain-desktop-1440.png`

---

## 8. Status połączenia z API

**Live OK** (sesja implementacji): ngrok FastAPI odpowiada; explain zwraca treść AI dla profilu UoP / insured.

---

## 9. Ograniczenia

- Wyjaśnienie dostępne w trybie REST; mock tylko informuje o braku silnika.
- Przy długim explain użytkownik może opuścić ekran — odpowiedź jest ignorowana (generation counter).
- Link „Uzupełnij ankietę” jest ogólny; nie mapujemy dowolnych next_steps na fikcyjne akcje.
- Restart Metro wskazany po zmianie `metro.config.js` (timeout proxy).

---

## 10. Numer commita

`8bd4b2f` — `feat: add on-demand AI explanations on benefit details`
