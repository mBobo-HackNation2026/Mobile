# ETAP 17 — Frontend Release Readiness (CODE FREEZE)

**Data:** 2026-11-22  
**Branch:** `feature/ebobo-frontend-mvp`  
**Baza przed Etap 17:** `dd2a6b0` (Etap 16 docs)

---

## 1. Werdykt

### FRONTEND GOTOWY WARUNKOWO — CODE FREEZE

Funkcjonalny zakres FE (ankieta, 9 świadczeń, missing_fields, kalkulator, compare, AI explain, formalities, sample-cases, help, nawigacja, obsługa błędów, build) jest zamknięty.

**Niespełnione warunki zewnętrzne (nie blokują code freeze FE, blokują deklarację „demo publiczne gotowe”):**

1. Brak stałego publicznego URL frontendu przetestowanego po wdrożeniu (EAS/hosting).
2. Backend w tej sesji działał przez **tymczasowy ngrok** — nie jest produkcyjnym adresem.
3. Expo Web w runtime woła `/zus-proxy` — publiczny hosting wymaga reverse proxy do FastAPI (lub świadomej zmiany konfiguracji ops).

Po spełnieniu powyższego przez ops/BE możliwa jest pełna deklaracja „aplikacja gotowa do jury online” bez dalszych prac funkcjonalnych FE.

---

## 2. HEAD i Git

| Pozycja | Wartość |
|---|---|
| Branch | `feature/ebobo-frontend-mvp` |
| HEAD przed Etap 17 | `dd2a6b0` |
| HEAD po Etap 17 | `e004275` |
| Sync origin | push Etap 17 w tej sesji |

Sekrety: `.env` gitignored; skan `dist/` — **brak** `OPENROUTER_API_KEY` / `sk-or-v1`.

---

## 3. Zmiany Etap 17

| Obszar | Zmiana |
|---|---|
| OpenAPI / formalities | Client zsynchronizowany z live GET `/api/v1/formalities/{code}` + `/general`; UI `BenefitFormalitiesPanel` |
| missing_fields | Pipeline `aggregateMissingFields` → `/complete-data` mapuje po `field`; `children_survived_count`; nieznane pola → bezpieczny komunikat |
| ProfileAnswersReview | Priority fields z silnika; edycja `childrenSurvivedCount` / hospitalizacji |
| Sample cases | Invalidate TanStack Query przy zmianie profilu demo |
| Regresja | `scripts/regression-missing-fields.ts` w `npm run test:regression` |
| Live smoke | `npm run smoke:live` — S1 eligibility+calc+9/9, S2 compare, formalities, explain |
| Docs | `CONTRACT.md`, `README.md`, `SUBMISSION.md` |

**Nie dodano** nowych modułów biznesowych ani przebudowy architektury.

---

## 4. Macierz integracji API

| Endpoint | FE | Live (Etap 17) |
|---|---|---|
| `GET /api/v1/health` | tak | PASS |
| `POST /api/v1/auth/*` | tak (sesja DEMO) | nie smoke’owane ponownie |
| `POST /eligibility/check/{code}` ×9 | `CatalogEligibilityAdapter` | PASS 9/9 (S1) |
| `POST /benefits/calculate/{code}` | kalkulator | PASS S1 `24161.20` / 140 dni |
| `POST /benefits/compare/urlop-rodzicielski` | kalkulator | PASS 3 warianty, 81.50%, 9 tyg. nieprzenoszalne |
| `POST /legal-advisor/explain/{code}` | szczegóły | PASS `source=ai` |
| `GET /formalities/{code}` | `BenefitFormalitiesPanel` | PASS |
| `GET /formalities/general` | client | PASS |
| `GET /mock-zus/*` | `/zus` | bez regresji w tej sesji |
| Legacy `procedure` z eligibility | UI fallback gdy formalities fail | zachowany |

Usunięto zbędne poleganie na historycznych ścieżkach formalities — kanoniczne jest `/api/v1/formalities/*`.

---

## 5. missing_fields

1. Silnik zwraca `missing_fields: [{ field, message }]`.
2. Catalog/Hybrid agregują i deduplikują po `field`.
3. `/complete-data` pokazuje znane pola raz; unknown → komunikat + pełna ankieta.
4. Zapis profilu → invalidate → ponowna ocena 9 → `/benefits`.
5. Semantyka: `null` ≠ `false` ≠ `0` (regresja).

---

## 6. Spójność flow i nawigacji

Zachowane: **Plan · Sprawy · Świadczenia · Kalkulator · Profil**.  
Po onboardingu: hub `/benefits`.  
Szczegóły → AI / kalkulator `?benefit=&from=benefit` / formalities / oficjalne linki.  
`/complete-data`, `/sample-cases`, `/help` dostępne.

---

## 7. Live S1 / S2

| Scenariusz | Wynik |
|---|---|
| S1 matką UoP — eligibility macierzyński | `likely_eligible`, missing=0 |
| S1 calculate | kwota + 140 dni |
| Katalog 9 | 9/9 HTTP 200 |
| S2 urlop rodzicielski eligibility | `requires_verification` (silnik — nie hardkod FE) |
| S2 compare | 3 warianty, rate 81.50, non_transferable 9 |
| Explain | AI OK |

**Uwaga:** smoke to wywołania REST zgodne z FE (nie pełny browser E2E). Publiczne URL FE **nie** testowane.

---

## 8. Sample cases / wrażliwe

- S1–S7 + braki → syntetyczne profile; invalidate cache przy zmianie.
- `preemie` / `stillbirth` — spokojny ton; link do `/help`; bez gratulacji.
- **Ograniczenie konkursowe:** brak dystrybucji chronionych PDF spraw ZUS w repo.

---

## 9. Oficjalne linki i NGO

- Regresja `officialLinks`: 9× HTTPS, allowlist, kanał ZUS/pracodawca, retired Z-3b/ZUR.
- `/help`: 5 NGO + odpis USC gov.pl (katalog bez numerów telefonów w UI).

---

## 10. Wdrożenie publiczne

| Element | Status |
|---|---|
| `npm run export:web` | **PASS** → `dist/` |
| `npm run deploy:web` | wymaga EAS + ops |
| Stały BE URL | **BRAK** (ngrok tymczasowy) |
| Proxy `/zus-proxy` na hostingu | **do ops** |
| Publiczne demo przetestowane | **NIE** |

Instrukcja: `README.md` + `SUBMISSION.md`.

---

## 11. Testy techniczne

| Test | Wynik |
|---|---|
| `npm run typecheck` | **PASS** |
| `npm run test:regression` | **PASS** (w tym missing-fields) |
| `npm run export:web` | **PASS** |
| `npm run smoke:live` | **PASS** (ngrok live) |
| Responsywność browser 320–1440 | **nie pełny audit UI** — brak krytycznych regresji funkcjonalnych; polish = osobne etapy |

---

## 12. Bezpieczeństwo (skrót)

- Brak sekretów w `dist`.
- Tokeny nie w URL.
- mObywatel / MockZUS oznaczone jako symulacja.
- Oficjalne linki przez allowlist HTTPS.
- Błąd API ≠ odmowa świadczenia; brak fikcyjnych kwot przy awarii.

---

## 13. Błędy i ograniczenia

1. Publiczne demo FE+BE — zależność ops.
2. Web bez proxy `/zus-proxy` nie dotrze do API.
3. S2 eligibility może zwracać `requires_verification` mimo compare — FE nie nadpisuje statusu.
4. Znany risk stawek 70% / 81,5% — ostrzeżenia FE (`compareHasCalculationDefect`).
5. Brak pełnego browser E2E / matrixy viewportów w tej sesji.

---

## 14. Zależności backend / ops

- Stały HTTPS FastAPI + CORS.
- Reverse proxy `/zus-proxy` → FastAPI (lub ekwiwalent EAS).
- Publikacja FE (`eas deploy` / hosting) i smoke na publicznym URL.
- Opcjonalnie: utrzymanie explain AI (OpenRouter po stronie BE/skryptów — nie w bundlu FE).

---

## 15. Code freeze — dozwolone dalej

**Dozwolone:** UI polish, typografia, kolory, ikony, bottom nav, spacing, a11y, animacje, naprawa regresji.

**Niedozwolone bez decyzji produktowej:** nowe moduły biznesowe, nowe endpointy FE, zmiana silnika/kalkulatora prawnego, szerokie przebudowy danych.

---

## 16. Commity Etap 17

*(uzupełniane po `git commit` / `git push`)*

| Commit | Opis |
|---|---|
| `e004275` | feat(etap17): freeze FE readiness — formalities, missing_fields, live smoke |

**Punkt odniesienia do polishu:** `e004275` (po sync z origin).
