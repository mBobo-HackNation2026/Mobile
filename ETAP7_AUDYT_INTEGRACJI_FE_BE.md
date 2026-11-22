# ETAP7 — Audyt integracji FE + BE i gotowość do demo

**Frontend tip:** `6a3ab2e` (`feature/ebobo-frontend-mvp`)  
**Data audytu:** 2026-11-22  
**Środowisko:** Expo Web (`localhost:8081`) + proxy `/zus-proxy` → FastAPI  
**Zakres:** weryfikacja bez zmian kodu  

---

## A. Werdykt

### **WARUNKOWO**

Aplikacja **nadaje się do prezentacji jury**, pod warunkiem że:

1. Tunel / proxy FastAPI jest żywy przez cały czas demo (zaobserwowano chwilowy `ECONNRESET` na health).  
2. Prelegent jasno mówi: wyniki to **szacunek silnika**, nie decyzja ZUS.  
3. W scenariuszu DG komunikuje ostrzeżenie o formularzu **ZAM / eZUS** (Z-3b zniesione).

**Kluczowe naprawy BE z Etapu 3/4 — POTWIERDZONE w tej sesji:**

| Wcześniejszy błąd | Stan teraz |
|-------------------|------------|
| `calculate` macierzyński HTTP 500 | **NAPRAWIONE** — HTTP 200, `28187.60 zł` |
| `compare` HTTP 500 | **NAPRAWIONE** — HTTP 200, 3 warianty |
| 81,5% na nieprzenoszalnych 9 tyg. | **NAPRAWIONE** — Rodzic B 9 tyg. @ **70%** = `7610.78 zł` |

---

## B. Stan integracji API

Baza: `http://localhost:8081/zus-proxy`

| Endpoint | Metoda | Wejście (skrót) | HTTP | Czas | Wynik kluczowy | PASS/FAIL |
|----------|--------|-----------------|------|------|----------------|-----------|
| `/api/v1/health` | GET | — | 200 | ~0.6 s | `status: ok`, app eBobo | **PASS** |
| `127.0.0.1:8000/api/v1/health` | GET | — | 000 | — | bezpośredni port niedostępny | **FAIL*** |
| `/api/v1/eligibility/check/zasilek_macierzynski_urlop_macierzynski` | POST | UoP, insured, pregnant | 200 | ~0.67 s | `likely_eligible`, 20 tyg. | **PASS** |
| `/api/v1/eligibility/check/urlop_rodzicielski` | POST | after birth, full dose | 200 | — | `requires_verification` + warning 81,5% | **PASS**** |
| `/api/v1/eligibility/check/urlop_ojcowski` | POST | after birth, father | 200 | — | `likely_eligible` | **PASS** |
| `/api/v1/eligibility/check/...` DG debt=0 | POST | dzialalnosc | 200 | ~0.37 s | `likely_eligible` + warn Z-3b/ZAM | **PASS** |
| `/api/v1/eligibility/check/...` DG debt=5000 | POST | dzialalnosc | 200 | — | `not_eligible` (art. 2a zadłużenie) | **PASS** |
| `/api/v1/benefits/calculate/zasilek_macierzynski_urlop_macierzynski` | POST | 7000, 100% | 200 | ~0.79 s | 140 dni, **28187.60** | **PASS** |
| `/api/v1/benefits/calculate/urlop_rodzicielski` | POST | 7000, 70% | 200 | ~0.38 s | 224 dni, **31570.11** | **PASS** |
| `/api/v1/benefits/calculate/urlop_rodzicielski` | POST | 7000, 81.5% | 200 | ~0.41 s | 224 dni, **36756.63** | **PASS** |
| `/api/v1/benefits/calculate/urlop_ojcowski` | POST | 7000 | 200 | ~0.44 s | 14 dni, **2818.76** | **PASS** |
| `/api/v1/benefits/calculate/zasilek_pogrzebowy_martwe_urodzenie` | POST | — | 200 | ~0.37 s | ryczałt **7000.00** | **PASS** |
| `/api/v1/benefits/compare/urlop-rodzicielski` | POST | A7000/B6000, 81.5% | 200 | ~0.40 s | 3 warianty; 9 tyg. @ 70% | **PASS** |
| `/api/v1/benefits/compare/urlop-rodzicielski` | POST | full_dose=false | 200 | — | wszystkie stawki 70% | **PASS** |
| calculate children_count=0 | POST | invalid | 422 | — | Pydantic ge=1 | **PASS** |
| calculate income=-1000 | POST | invalid | 422 | — | ge=0 | **PASS** |
| calculate income="abc" | POST | invalid | 422 | — | decimal_parsing | **PASS** |

\* FE w Web używa `/zus-proxy`, nie bezpośredniego `:8000` — OK dla demo Web.  
\*\* Status ostrożny, nie błąd techniczny.

---

## C. Kalkulator — wartości oczekiwane vs rzeczywiste

**Formuła referencyjna (7000 zł):**  
`7000 × (1 − 0,1371) = 6040,30` → dziennie `201,34`

| Test | Oczekiwane | Rzeczywiste API | Źródło reguły | Status |
|------|------------|-----------------|---------------|--------|
| **A** Macierzyński 100%, 1 dziecko | 140 dni, **28 187,60 zł** | 140 / **28187.60** / 100% | Poradnik ZUS 2026 — 20 tyg.; ZUS.pl wysokość 100% | **PASS** |
| **A2** Macierzyński + flaga 81,5% | Endpoint macierzyński = okres urlopu macierzyńskiego | nadal 140 / 100% / 28187.60 | 81,5% dotyczy łącznego rozliczenia z rodzicielskim | **PASS*** |
| **B** Rodzicielski 70% | 32 tyg. = 224 dni @ 70% → **31 570,11** | 224 / **31570.11** / 70% | Poradnik — rodzicielski 70% bez uśrednienia | **PASS** |
| **C** Rodzicielski 81,5% | 224 dni @ 81,5% → **36 756,63** | 224 / **36756.63** / 81.50% | ZUS.pl — wariant uśredniony | **PASS** |
| **D** 9 tyg. nieprzenoszalne @ 70% (dochód B 6000) | `172,58 × 0,70 × 63` ≈ **7610,78** | compare: `amount_parent_b_zl=7610.78`, `rate_percentage_parent_b=70.00` | ZUS.pl *Wysokość* — 9 tyg. zawsze 70%; art. 31 ust. 3f (warning API) | **PASS** |
| **E** Compare 81,5% | 3 warianty; suma A_max = 36756.63+7610.78=**44367.41** | dokładnie te wartości + warning wyjaśniający | jak wyżej | **PASS** |
| **E2** Compare bez full dose | wszystkie 70% | `rate_percentage=70.00`, warianty 70/70 | ZUS.pl wariant zmienny | **PASS** |
| **F** Dane niepoprawne | 422 / komunikat | 422 Pydantic | walidacja API | **PASS** |
| Ojcowski | 14 dni, **2818,76** | 14 / **2818.76** | Poradnik — 2 tyg. 100% | **PASS** |
| Pogrzebowy | **7000** | **7000.00** | ZUS.pl / Poradnik | **PASS** |

\* Świadome: `calculate` samego macierzyńskiego nie obniża do 81,5% — uśrednienie widać w `urlop_rodzicielski` + `compare`. FE pokazuje to jako osobne świadczenia.

**Uwaga FE:** mimo poprawnych kwot compare, FE nadal może oznaczyć sumę jako „wstępna”, bo ostrzeżenie API zawiera frazy `81,5` / `9 tyg.` i wpada w heurystykę `hasUnverifiedRateWarning`. Kwoty są poprawne — to kosmetyka prezentacji (P1).

---

## D. Scenariusze S1–S3

| Scenariusz | Kroki sprawdzone | Wynik |
|------------|------------------|-------|
| **S1** Ciąża UoP | Eligibility macierzyński `likely_eligible` 20 tyg.; calculate 28187.60; UI kalkulator pokazuje kwotę; dashboard /home działa (demo plan) | **PASS** (API + FE calc) |
| **S2** Po narodzinach | Macierzyński `likely_eligible`; ojcowski `likely_eligible`; rodzicielski `requires_verification` (ostrzeżenie o 81,5%); compare 9 tyg. @ 70% = 7610.78; FE pokazuje podział | **PASS** z zastrzeżeniem statusu weryfikacji rodzicielskiego |
| **S3** DG | debt=0 → `likely_eligible` + warning ZAM/Z-3b; debt=5000 → `not_eligible` (art. 2a) | **PASS** |

Pełny klik-flow Welcome→…→Kalkulator: nawigacja Expo Web OK; ścieżka opiera się na profilu demo + REST (bez regresji pustej checklisty w testach automatycznych).

---

## E. Wykryte błędy / ryzyka

| Priorytet | Problem | Odtworzenie | Lokalizacja | Zalecenie |
|-----------|---------|-------------|-------------|-----------|
| **P0 ops** | Chwilowy brak proxy (`ECONNRESET`) mimo wcześniejszego health OK | Wejście na `/home` w trakcie audytu | Metro `/zus-proxy` / FastAPI | Przed demo: health loop + restart BE/Expo; pokazać „Sprawdź ponownie” |
| **P1 FE** | Compare oznacza sumę jako „wstępna” mimo poprawnych stawek 70% na 9 tyg. | Warning API zawiera „81,5” + „9 tygodni” | `calculatorPresentation.ts` | Zawęzić heurystykę ostrzeżeń po fixie BE |
| **P1 produkt** | Ostrzeżenie Z-3b/ZAM bez pewnego zastąpienia | Eligibility DG | BE warning | Skrypt demo: „sprawdź aktualny ZAM na zus.pl” |
| **P2** | `:8000` bezpośredni nie odpowiada | curl 127.0.0.1:8000 | runtime | Nieistotne dla Web (proxy); ważne dla native bez proxy |

**Nie znaleziono** regresji pustej checklisty ani fikcyjnych kwot przy 500 (FE nadal blokuje cichy mock).

---

## F. UI/UX

| Obszar | Ocena |
|--------|-------|
| Kalkulator Etap 5 | Hero kwoty, sekcje A–D, compare z 9 tyg. — **OK** |
| Dashboard Etap 6 | Sekcje etap / focus / terminy / quick actions — **OK** |
| Spójność | Wspólne `AppSection` / banery — **OK** |
| Responsywność | Web mobile + desktop w smoke — **OK** (brak osobnych testów native) |
| Błędy API | Baner „Silnik niedostępny” + retry — **OK** (zrzut poniżej) |

Zrzuty: `docs/etap7/`

- `calculator-compare-9w-70.png` — Rodzic B 9 tyg. **7610.78 zł**, suma 44367.41  
- `calculator-compare-form.png` — formularz porównania  
- `stability-api-down-banner.png` — obsługa niedostępnego silnika na Mój plan  

---

## G. Gotowość konkursowa (brief ZUS / AGENTS.md)

| Wymaganie MVP | Status |
|---------------|--------|
| Start bez rejestracji | Spełnione |
| Ankieta / profil demo | Spełnione |
| Indywidualna ocena świadczeń | Spełnione (9× check) |
| Wyjaśnienie dlaczego / przeszkody | Spełnione (statusy A–E) |
| Możliwe rozwiązania / alternatywy | Częściowo (zależne od pól BE) |
| Instrukcja wniosku / dokumenty / termin | Częściowo (plan API + DEMO) |
| Kalkulator wariantów + podział rodziców | **Spełnione** (po fixie BE) |
| PDF / demo dokumenty | Nie re-testowane w Etapie 7 (poza zakresem krytycznym calc) |
| Web responsywny | Spełnione |
| Brak obietnicy decyzji ZUS | Spełnione (disclaimery) |

---

## H. Rekomendacje (max 5) przed prezentacją

1. **Ops:** 10 min przed demo — `health` przez `/zus-proxy` w pętli; mieć restart Expo + BE.  
2. **Scenariusz jury:** S2 (po porodzie) → świadczenia → kalkulator macierzyński 28 187,60 → compare z widocznym **7610,78 @ 70%** na 9 tyg.  
3. **FE (opcjonalnie po audycie):** złagodzić badge „wstępna” gdy compare już zwraca osobne `rate_percentage_parent_b=70`.  
4. **Komunikat DG:** przygotować jedno zdanie o ZAM / eZUS zamiast Z-3b.  
5. **Nie obiecywać** „ZUS przyzna” — trzymać język „na podstawie danych spełniasz sprawdzone warunki”.

---

## Testy techniczne FE

| Komenda | Wynik |
|---------|-------|
| `npm run typecheck` | **PASS** |
| `npm run test:regression` | **PASS** |
| `npm run export:web` | **PASS** → `dist/` |
| Android/iOS native | **NIE WYKONANO** (tylko Expo Web) |

---

## Odpowiedzi na pytania sterujące

1. **Czy FE ↔ BE działa?** Tak, przez `/zus-proxy` (z ryzykiem chwilowych zerwań).  
2. **Czy najważniejsze funkcje działają?** Tak — eligibility, calculate, compare, plan, nawigacja.  
3. **Czy wcześniejsze błędy naprawione?** Tak — 500 macierzyński/compare oraz 81,5%×9 tyg.  
4. **Czy obliczenia poprawne?** Tak względem formuły 13,71%/30 i Poradnika/ZUS.pl (dla przetestowanych wariantów).  
5. **Czy pełny proces bez błędów?** Warunkowo — przy stabilnym API tak; przy `ECONNRESET` UI nie pada, ale brakuje wyników silnika.  
6. **Czy nadaje się dla jury?** **Tak, warunkowo** — z żywym BE i świadomym skryptem prezentacji.

---

*Audyt Etapu 7 — bez zmian w kodzie aplikacji.*
