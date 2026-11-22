# HACKATHON 2026 — Final Compliance Audit (eBobo)

**Data:** 2026-11-22  
**Projekt:** eBobo — Zasiłkowy Przewodnik Przyszłego Rodzica  
**HEAD bazowy:** `8a723bc` (+ niezacommitowane Etap 14–15)  
**Źródła wymagań:** `AGENTS.md` (brief produktowy), `WALIDACJA_ZUS_2026.md`, `CONTRACT.md`, publiczne strony ZUS/gov — **brak PDF briefu organizatora w workspace** (patrz WALIDACJA §2)

---

## Werdykt końcowy

# **WARUNKOWO**

Aplikacja ma spójną ścieżkę rodzica (świadczenia → kwota → dokumenty → oficjalne linki), działający export web oraz regresje FE.  
Oddanie konkursowe jest **warunkowe**, dopóki nie domknięte są: stabilny BE demo (nie localhost/niestabilny ngrok), pełne S1–S8 live, materiały oddania (slajdy/film/link demo) oraz braki oznaczone P0 poniżej.

---

## 1. Macierz wymagań organizatora

Legenda: **SPEŁNIONE** · **CZĘŚCIOWO** · **BRAK** · **NIEPOTWIERDZONE**

### 1.1 Świadczenia i ocena uprawnień

| # | Wymaganie | Ref. | Status | Dowód | Braki | Priorytet | Odp. |
|---|---|---|---|---|---|---|---|
| A1 | Ocena ciąży / chorobowe | brief + AGENTS | CZĘŚCIOWO | kod `zasilek_chorobowy_w_ciazy`, katalog 9× | Pełna matryca scenariuszy nieprzetestowana live | P0 | BE+FE |
| A2 | Świadczenie rehabilitacyjne | | CZĘŚCIOWO | kod + calculate + linki ZNp-7 | Live S-scenariusz | P1 | BE+FE |
| A3 | Zasiłek w wys. macierzyńskiego | | CZĘŚCIOWO | kod w katalogu | Live | P0 | BE |
| A4 | Macierzyństwo | | SPEŁNIONE* | eligibility + calculate (dowody WALIDACJA) | *przy działającym BE | P0 | BE+FE |
| A5 | Ojcostwo | | CZĘŚCIOWO | `urlop_ojcowski` | Live niezależności od matki | P0 | BE |
| A6 | Urlop rodzicielski | | SPEŁNIONE* | eligibility + compare UI | Defekt 81,5%×9 tyg. po stronie BE | P0 | BE |
| A7 | Uzupełniający urlop macierzyński | | CZĘŚCIOWO | kod + pola hospitalizacji w profilu | Pełne progi tygodni | P1 | BE |
| A8 | Adopcja / piecza | | CZĘŚCIOWO | kod + pola foster w ankiecie | Live kalkulacja adopcji | P0 | BE+FE |
| A9 | Martwe urodzenie | | CZĘŚCIOWO | kod + spokojny UI + link pogrzebowy | Scenariusz S7 live; lista NGO | P0 | FE+BE+mat. |
| A10 | 9 świadczeń w katalogu | | SPEŁNIONE | `BENEFIT_CODES` | — | P0 | FE+BE |

### 1.2 Kalkulator

| # | Wymaganie | Status | Dowód | Braki | Pri. | Odp. |
|---|---|---|---|---|---|---|
| B1 | Kalkulator matki | SPEŁNIONE* | calculate + CTA ze świadczenia | Live w tej sesji: API timeout | P0 | FE+BE |
| B2 | Kalkulator ojca | CZĘŚCIOWO | kod ojcowskiego / parent B w compare | Osobny flow ojca | P0 | FE+BE |
| B3 | Podział między rodziców | SPEŁNIONE* | compare UI + CTA | Defekt 9 tyg. @70% (BE) | P0 | BE |
| B4 | Łączenie pracy z rodzicielskim | CZĘŚCIOWO | pole `partTimeFraction…` w profilu | Brak pełnego UI w kalkulatorze REST | P0 | FE+BE |
| B5 | „Za życiem” | SPEŁNIONE | toggle w kalkulatorze + profil | — | P0 | FE |
| B6 | Liczba / wiek dzieci | CZĘŚCIOWO | pola profilu → payload | UI wieku w kalkulatorze ograniczone | P1 | FE |
| B7 | Adopcja w calculate | NIEPOTWIERDZONE | kod świadczenia | Brak live | P0 | BE |
| B8 | Indywidualna podstawa | SPEŁNIONE* | `basis` z API | — | P0 | BE |
| B9 | Przykłady konkursowe | BRAK / CZĘŚCIOWO | MockZUS profile | Brak referencyjnego porównania z paczką PDF | P0 | mat.+FE |

### 1.3 Procedury i linki

| # | Wymaganie | Status | Dowód | Braki | Pri. | Odp. |
|---|---|---|---|---|---|---|
| C1 | Dokumenty / terminy | CZĘŚCIOWO | `procedure` + Sprawy + deriveFormalities | GET `/formalities` niepotwierdzony | P0 | BE+FE |
| C2 | Płatnik: pracodawca vs ZUS | SPEŁNIONE | `resolvePaymentChannel` + OfficialLinksSection | Heurystyka, nie decyzja prawna | P0 | FE |
| C3 | Aktualne formularze (ZAM, bez Z-3b) | CZĘŚCIOWO | ostrzeżenia retired + linki katalogowe | Strony ZUS mogą nadal pokazywać stare wzory | P0 | FE+mat. |
| C4 | Oficjalne linki 9 kodów | SPEŁNIONE | `officialLinks.ts` + regresja | Część `needs_recheck` | P0 | FE |
| C5 | eZUS ≠ auto status sprawy | SPEŁNIONE | copy + requiresLogin | — | P0 | FE |
| C6 | Ryzyka utraty świadczeń | CZĘŚCIOWO | warnings z API | Brak dedykowanej sekcji ryzyk z `/formalities` | P1 | BE+FE |

### 1.4 Symulacje organizatora

| # | Wymaganie | Status | Dowód | Braki | Pri. | Odp. |
|---|---|---|---|---|---|---|
| D1 | mObywatel login DEMO | SPEŁNIONE | AuthConnected / auth API | Wyraźnie DEMO | P0 | FE+BE |
| D2 | Dane ubezpieczenia ZUS | CZĘŚCIOWO | `/zus` MockZUS | Nie prawdziwe PUE | P0 | FE+BE |
| D3 | Zadłużenie | CZĘŚCIOWO | pole `debtAmountZl` | Widok ewidencji | P1 | FE |
| D4 | e-ZLA podgląd | CZĘŚCIOWO / NIEPOTWIERDZONE | wzmianki w ZUS demo | Pełny UI e-ZLA | P1 | FE+BE |
| D5 | Połączenie PUE/eZUS | CZĘŚCIOWO | link zewnętrzny eZUS | Brak deep-link sprawy | P0 | FE |
| D6 | Wypełnianie wniosków | CZĘŚCIOWO | dokumenty / symulacja | Nie pełny kreator ZAM | P1 | FE |
| D7 | Odpis aktu USC | BRAK | — | Brak flow gov.pl odpis | P1 | FE |
| D8 | Upload/analiza PDF konkursowy | CZĘŚCIOWO | documents/analyze | Brak paczki PDF w repo; ograniczenia rozpowszechniania | P0 | FE+mat. |

### 1.5 Szczególne sytuacje / pomoc

| # | Wymaganie | Status | Dowód | Braki | Pri. | Odp. |
|---|---|---|---|---|---|---|
| E1 | Wsparcie charytatywne (strata, wcześniak…) | BRAK | — | Brak zweryfikowanej listy NGO | P0 | mat.+FE |
| E2 | Spokojny UI przy stracie | CZĘŚCIOWO | `calm` na pogrzebowym | Cała ścieżka S7 | P0 | FE |

### 1.6 Administracja parametrów

| # | Wymaganie | Status | Dowód | Braki | Pri. | Odp. |
|---|---|---|---|---|---|---|
| F1 | Zmiana stawek/okresów bez hardkodu FE | CZĘŚCIOWO | kwoty z API `rules_version` | Brak panelu admin parametrów w FE | P1 | BE |
| F2 | Panele logów ≠ edycja parametrów | SPEŁNIONE (świadomie) | — | Wymóg admina poza MVP FE | P2 | BE |

### 1.7 Przykładowe sprawy konkursowe

| # | Wymaganie | Status | Dowód | Braki | Pri. | Odp. |
|---|---|---|---|---|---|---|
| G1 | Wybór przykładowej sprawy | CZĘŚCIOWO | `/demo` profile | ≠ wnioski PDF organizatora | P0 | FE+mat. |
| G2 | Upload dokumentu → ubezpieczenie → calc → referencja | CZĘŚCIOWO / BRAK | analyze + calculate | Brak porównania z referencją organizatora | P0 | FE+BE+mat. |

### 1.8 Techniczne / prezentacyjne

| # | Wymaganie | Status | Dowód | Braki | Pri. | Odp. |
|---|---|---|---|---|---|---|
| H1 | Aplikacja web RWD | SPEŁNIONE* | Expo Web + export | Manual RWD screenshots brak | P0 | FE |
| H2 | REST API | SPEŁNIONE | CONTRACT.md | Stabilny hosting BE | P0 | BE |
| H3 | Repozytorium kodu | SPEŁNIONE | git | — | P0 | zespół |
| H4 | Link demonstracji (nie localhost) | NIEPOTWIERDZONE | EAS deploy scripts | Brak potwierdzonego URL demo | P0 | zespół |
| H5 | Screenshoty / opis / tytuł | NIEPOTWIERDZONE | — | Materiały oddania | P0 | zespół |
| H6 | Prezentacja ≤10 slajdów | BRAK | — | — | P0 | zespół |
| H7 | Film ≤3 min | BRAK | — | — | P0 | zespół |
| H8 | Oznaczenie funkcji AI | SPEŁNIONE | BenefitExplainSection + copy | — | P0 | FE |
| H9 | Demo bez niestabilnego tunelu | BRAK / RYZYKO | ngrok timeout w sesji | Potrzebny stały BE | P0 | BE+ops |

\* przy założeniu dostępnego backendu.

---

## 2. Scenariusze S1–S8

| ID | Scenariusz | Dostępność FE | Endpointy | Live wynik | Werdykt |
|---|---|---|---|---|---|
| S1 | Matka UoP → macierzyński → calc → docs → instytucja | TAK (ścieżka UI) | check, calculate, linki | **NIE** (API timeout) | **PARTIAL** |
| S2 | Oboje rodzice → compare | TAK | check, compare | NIE | **PARTIAL** |
| S3 | DG + zadłużenie | CZĘŚCIOWO (pola) | check, calculate | NIE | **PARTIAL** |
| S4 | Adopcja | CZĘŚCIOWO | check, calculate | NIE | **PARTIAL** |
| S5 | Praca podczas rodzicielskiego | SŁABO (brak pełnego UI fraction) | calculate? | NIE | **FAIL/PARTIAL** |
| S6 | Wcześniak / hospitalizacja | CZĘŚCIOWO (pola) | check | NIE | **PARTIAL** |
| S7 | Martwe urodzenie | CZĘŚCIOWO (UI+linki) | check, calculate | NIE | **PARTIAL** |
| S8 | Dokument organizatora | BRAK paczki PDF | analyze | NIE | **FAIL** |

Nie oznaczono żadnego S* jako PASS bez wykonania.

---

## 3. Testy techniczne (wykonane)

| Komenda | Wynik |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test:regression` | PASS |
| `npm run export:web` | PASS → `dist/` |
| Weryfikacja URL eZUS | PASS (treść portalu) |
| Live FastAPI (ngrok) | FAIL / timeout |

Nowe regresje: `regression-official-links.ts`, `regression-calculator-context.ts`.

---

## 4. Brakujące funkcjonalności (zbiorczo)

1. Stabilny, publiczny backend demo.  
2. Live przebieg S1–S8 + porównanie z referencjami.  
3. Pełne UI łączenia pracy z urlopem rodzicielskim.  
4. GET `/formalities` — potwierdzenie BE lub świadoma rezygnacja.  
5. Zweryfikowana lista organizacji pomocowych.  
6. Flow odpisu aktu USC.  
7. Materiały oddania: slajdy, film, link demo, screenshoty.  
8. Korekta BE: 9 nieprzenoszalnych tygodni @ 70% (nie 81,5%).  
9. Paczka dokumentów konkursowych w kontrolowanym dostępie (nie publicznym repo).

---

## 5. Podział problemów

### FE (naprawione / domknięte w Etap 14–15)

- Domyślny ekran = Świadczenia  
- Hub + szczegóły jako wizytówka flow  
- Kalkulator z kontekstem `benefit_code`  
- Rejestr oficjalnych linków + eZUS/pracodawca  
- Copy produktowe bez zbędnego DEMO/dev  
- Ostrzeżenia wycofanych formularzy  

### BE

- Stabilność calculate / ngrok  
- Defekt 81,5% na 9 tyg.  
- Obecność/kontrakt `/formalities`  
- Pełne pokrycie adopcja / hospitalizacja / praca+urlop  

### Materiały konkursowe / ops

- Brak PDF briefu w workspace  
- Link demo, slajdy, film  
- Przykłady referencyjne organizatora  

---

## 6. Blockery P0 przed oddaniem

1. **Stabilny URL demonstracji + BE** (nie niespokojny tunel).  
2. **Smoke S1 + S2 live** z zapisem kwot.  
3. **Materiały oddania** (slajdy ≤10, film ≤3 min, opis).  
4. **Komunikacja jury** o ograniczeniach: informacyjna ocena ≠ decyzja ZUS; znany defekt 9 tyg. jeśli BE niepoprawiony.  
5. **Nie udostępniać publicznie** objętych ograniczeniem dokumentów konkursowych.

---

## 7. Usprawnienia P1

- UI `partTimeFractionDuringParentalLeave` w kalkulatorze  
- Lista NGO (po weryfikacji)  
- Odpis USC (link gov.pl + copy)  
- Screenshoty 375 / 390 / 768 / 1440  
- Pełniejsze e-ZLA / zadłużenie w ZUS demo  
- Panel parametrów po stronie BE  

---

## 8. Rekomendacja przed oddaniem

1. Commit Etap 14+15 na `feature/ebobo-frontend-mvp`.  
2. Postawić BE na stałym hoście; podmienić `EXPO_PUBLIC_API_URL`.  
3. Przejechać S1 i S2 end-to-end; zapisać kwoty.  
4. `eas deploy` / opublikować `dist`.  
5. Przygotować 8–10 slajdów + film 2–3 min skupione na flow świadczenie→kwota→eZUS.  
6. W prezentacji otwarcie powiedzieć: ocena informacyjna; symulacje mObywatel/ZUS; znane ograniczenia BE.

---

## 9. Werdykt

| Kryterium | Ocena |
|---|---|
| Ścieżka rodzica FE | Gotowa |
| Zgodność z briefem produktowym (AGENTS) | Wysoka / częściowa na edge-case |
| Zgodność z pełnym pakietem organizatora | Niemożliwa do pełnego PASS (brak PDF + brak live S8) |
| Gotowość konkursowa | **WARUNKOWO** |

**GOTOWE DO ODDANIA** dopiero po domknięciu blockerów P0 §6 (demo URL + S1/S2 live + materiały).  
Obecny stan: **WARUNKOWO**.
