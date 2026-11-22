# FRONTEND_DEMO_READINESS — Etap 4

**Gałąź:** `feature/ebobo-frontend-mvp`  
**Bazowy commit:** `f655805`  
**Stan roboczy:** zmiany Etapu 4 FE **niezacommitowane** (patrz lista plików)  
**Data:** 2026-11-22  

**Cel:** stabilny frontend demonstracyjny bez własnego silnika prawnego i bez maskowania błędów API fikcyjnymi kwotami.

---

## 1. Wykryte i naprawione problemy (FE)

| Problem | Naprawa |
|---------|---------|
| Kwoty compare/calculate z ostrzeżeniami 81,5%/9 tyg. wyglądały jak „pewne” | Badge **„Kwota wstępna — do weryfikacji”**, gdy API zwraca ostrzeżenia o stawkach; brak lokalnego przeliczania |
| Brak osobnej prezentacji 9 tyg. nieprzenoszalnych @ 70% | Blok informacyjny z polem `non_transferable_weeks_per_parent` + jasna zasada 70% (bez wyliczania kwoty w FE) |
| Wariant 81,5% vs 100%/70% mało czytelny | Chip + etykieta wariantu wejściowego w kalkulatorze |
| Błędy 500 / timeout / sieć zbyt techniczne | `apiErrorMessage` + `normalizeApiError` + komunikaty `httpClient` po polsku, bez stack trace |
| Brak „Spróbuj ponownie” przy błędzie calculate/compare | Przyciski ponowienia przy błędach operacji |
| `ApiHealthBanner` mylił health z błędem operacji | Rozróżnienie: health = dostępność usługi; operacje mają własne komunikaty |
| Techniczne etykiety `[FastAPI]` utrudniały UX | Zachowane markery źródła + tekst „Z oceny Twojej sytuacji” / „Podpowiedź demonstracyjna” |
| Słaba nawigacja między Plan → Sprawy → Świadczenia → Kalkulator | Szybkie linki w Mój plan i Moje sprawy |
| Przy błędzie świadczeń brak ścieżki awaryjnej | CTA do lokalnego Mój plan DEMO |
| Scenariusze demo bez etykiet S1–S3 | Meta profili w `fixtures.ts` (daty nadal względne) |

**Nie zmieniano:** kontraktu API, logiki FastAPI, generatorów planu (brak trzeciego silnika).

---

## 2. Zmienione pliki

- `src/features/calculator/CalculatorScreen.tsx`
- `src/features/calculator/calculatorPresentation.ts` *(nowy)*
- `src/components/ui/ApiHealthBanner.tsx`
- `src/lib/apiErrorMessage.ts`
- `src/services/api/normalizeApiError.ts`
- `src/services/api/httpClient.ts`
- `src/services/api/deriveFormalitiesFromBenefits.ts`
- `src/features/plan/planTasksToChecklist.ts`
- `src/features/plan/MyPlanScreen.tsx`
- `src/features/benefits/BenefitsHubScreen.tsx`
- `src/app/(main)/sprawy.tsx`
- `src/app/(main)/plan.tsx`
- `src/services/mock/fixtures.ts`
- `FRONTEND_DEMO_READINESS.md` *(ten plik)*
- (wcześniej w drzewie, poza Etapem 4): `WALIDACJA_ZUS_2026.md`

---

## 3. Wyniki testów technicznych

| Test | Wynik |
|------|-------|
| `npm run typecheck` | **PASS** |
| `npm run test:regression` | **PASS** (checklist merge + ISO + markery źródła) |
| `npm run export:web` | **PASS** → `dist/` |
| Pusta checklista po merge | **nie wróciła** (regresja formalności OK) |

Test przeglądarkowy ekranów: eksport webowy OK; pełny klik-flow zależny od żywego Expo + BE (proxy `8081` health OK w trakcie smoke).

---

## 4. Scenariusze S1–S3

Daty profili demo: **względne** (`demoDate(±N)`).

| Scenariusz | Profil | FE ścieżka | Live API (smoke 2026-11-22) | Werdykt |
|------------|--------|------------|-----------------------------|---------|
| **S1** Kobieta w ciąży UoP | `pregnant_employee` | Welcome/demo → plan → sprawy → świadczenia → kalkulator | `eligibility/check` macierzyński → **`likely_eligible`**; `calculate` macierzyński → **HTTP 500** | **Częściowy** — UI gotowe; kwota macierzyńskiego zablokowana przez BE |
| **S2** Rodzice po narodzinach | `both_parents_split` | Plan → świadczenia → compare 9 tyg. → kalkulator | `eligibility` rodzicielski → **`requires_verification`**; `compare` → **HTTP 500**; `calculate` rodzicielski (70%) → **200** (`31570.11` / 224 dni) | **Częściowy** — FE pokazuje 9 tyg. @ 70% info; compare niedostępny |
| **S3** DG | `self_employed` | Ankieta/demo → świadczenia → dokumenty / weryfikacja | `eligibility` macierzyński → **`likely_eligible`** + ostrzeżenie o Z-3b/ZAM po 24.10.2026 | **OK (eligibility)** — FE wyświetli warning; calculate nie wymagany do podstawowej ścieżki S3 |

**Zasada:** scenariusza nie oznaczono jako pełnego sukcesu, jeśli krytyczny endpoint zwrócił błąd.

---

## 5. Stan integracji FastAPI

| Endpoint | Stan zaobserwowany |
|----------|-------------------|
| `GET /health` (przez `/zus-proxy` :8081) | OK |
| `POST /eligibility/check/{code}` | Działa (S1/S3 + rodzicielski) |
| `POST /benefits/calculate/urlop_rodzicielski` | Działa (przykład 70%) |
| `POST /benefits/calculate/zasilek_macierzynski_*` | **Niestabilny / 500** |
| `POST /benefits/calculate/urlop_ojcowski` | **500** (w tym smoke) |
| `POST /benefits/calculate/zasilek_pogrzebowy_*` | **500** (w tym smoke) |
| `POST /benefits/compare/urlop-rodzicielski` | **500** (w tym smoke) |

FE w REST: **brak cichego mocka** kwot; przy 500 pokazuje komunikat + ponów.

Gdy API zwróci ostrzeżenia o 81,5%/9 tyg., FE **nie** oznacza wyniku jako zweryfikowanego (gotowość na poprawiony kontrakt odpowiedzi BE bez zmiany FE kontraktu).

---

## 6. Blokery demonstracji

1. **Niestabilność `calculate` / `compare` po stronie FastAPI** — główny bloker scenariusza „policz macierzyński / porównaj podział” na żywo.  
2. **Otwarta poprawka BE 81,5% × 9 tyg.** — FE już oznacza wynik jako wstępny; po fixie BE warning może zniknąć i badge wróci do „Wynik z silnika”.  
3. **Zależność od tunelu/proxy** — bez health UI działa (plan DEMO), bez kwot.

---

## 7. Pozostałe ograniczenia

- `/home` = lokalny plan DEMO; świadczenia/kalkulator = FastAPI (celowy podział).  
- Upload PDF / wiedza mogą mieć jawny fallback DEMO.  
- Brak wysyłki wniosku do ZUS (symulacja).  
- Paczka dokumentów organizatora nadal poza repo (patrz `WALIDACJA_ZUS_2026.md`).

---

## 8. Kryterium sukcesu Etapu 4 (FE)

| Kryterium | Status |
|-----------|--------|
| Pełna ścieżka nawigacji Welcome → … → Kalkulator bez zawieszenia UI | **TAK** |
| Spersonalizowany plan (lokalny + formalności) | **TAK** |
| Poprawne **wyświetlenie** odpowiedzi kalkulatora, gdy API działa | **TAK** (rodzicielski 70% w smoke) |
| Brak awarii całego UI przy padzie BE | **TAK** (komunikat + retry + plan DEMO) |
| Pełne S1/S2 z kwotami macierzyński/compare | **NIE** — blokada FastAPI 500 |

**Wniosek:** frontend jest gotowy do demo **pod warunkiem**, że backend ustabilizuje `calculate`/`compare`. Do tego czasu należy pokazywać eligibility + plan + (jeśli działa) rodzicielski calculate oraz otwarcie komunikować awarie kwot.
