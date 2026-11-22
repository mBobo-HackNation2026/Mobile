# eBobo — zadanie dla agenta programistycznego (P0)

**Rola:** Senior Frontend Engineer (Expo / React Native / Web / TypeScript) współpracujący z backendem FastAPI.
**Cel:** Domknąć integrację silnika oceny 9 świadczeń, kalkulatora i porównania urlopu rodzicielskiego w istniejącym eBobo. Nie przepisuj produktu od zera.

## 1. Kontekst i źródła prawdy

Projekt: eBobo, HackNation 2026, wyzwanie ZUS. Istniejący frontend według ostatniego raportu zawiera onboarding, „Mój plan”, świadczenia, kalkulator, kalendarz, mapę DEMO, profil, ZUS/PDF DEMO oraz responsywny Web. Statusy raportowe **nie są dowodem**, że każda integracja rzeczywiście działa.

Na początku przeczytaj lokalne `AGENTS.md`, dokument „Mój Plan Rodzica”, README oraz istniejący kod. Jeśli dostępny jest ujednolicony brief P0, potraktuj go jako dokument pomocniczy. Przy sprzeczności odnotuj ją; zakres poniżej wyznacza tę iterację. **Nie zgaduj schematów API na podstawie README.** Zweryfikuj działające `/openapi.json` i odpowiedzi serwera.

**Stack bez zmian:** Expo SDK 58, React Native + React Native Web, Expo Router, TypeScript strict, StyleSheet/design tokens, Zustand, TanStack Query, React Hook Form + Zod, date-fns; backend FastAPI.

**Zasady nienaruszalne:**
- Źródłem oceny prawa, warunków, rozwiązań, podstaw prawnych, kwot, okresów i stawek jest backend. Nie implementuj ani nie poprawiaj algorytmów prawnych w FE.
- `EXPO_PUBLIC_API_MODE=rest`: dla eligibility/calculate/compare nie może istnieć *cichy* fallback na mock po błędzie sieci. Pokazuj błąd i możliwość ponowienia; DEMO musi być jawne.
- `EXPO_PUBLIC_API_MODE=mock`: dozwolone fixture'y wyraźnie oznaczone jako DEMO. W trybie REST profile demo mogą wypełniać dane wejściowe, ale nie zwracać gotowych wyników.
- Nie stosuj OCR, nie umieszczaj klucza OpenRouter w bundlu, nie dodawaj frameworka, nie przebudowuj nawigacji bez potrzeby.
- Nie implementuj wysyłki wniosków do ZUS ani produkcyjnej integracji mObywatel; istniejące funkcje poza zakresem zachowaj.

## 2. Kolejność pracy — audyt, potem implementacja

1. Zmapuj faktyczne pliki i przepływy: routes, onboarding, store, serwisy API, hooki Query, formularze, katalog świadczeń, kalkulator, compare, sesje, plan i cache. Nie twórz dubli działających integracji.
2. Zweryfikuj `/openapi.json`: request/response, enumy statusów, pola wymagane i opcjonalne, null, `warnings`, `plan`, `possible_solutions`, błędy 401/404/422. Zbuduj/dopasuj typowane modele TS i adaptery API. Jeżeli backend/OpenAPI jest niedostępny, nie wymyślaj kontraktu: odnotuj blokadę, realizuj niezależne zmiany i wskaż brakującą specyfikację.
3. Utwórz tabelę 9 świadczeń × `eligibility` × `calculate` z dowodem rzeczywistego wywołania lub przyczyną blokady.
4. Uzupełnij istniejącą ankietę, wyniki, szczegóły, kalkulator i compare. Następnie zintegruj z Planem, formalnościami i kalendarzem w zakresie wynikającym z rzeczywistych danych.
5. Wykonaj testy automatyczne i ręczny flow Web, napraw regresje i przekaż raport.

## 3. API — pełny zakres

- `POST /api/v1/eligibility/check/{benefit_code}`
- `POST /api/v1/benefits/calculate/{benefit_code}`
- `POST /api/v1/benefits/compare/urlop-rodzicielski`
- `POST /api/v1/auth/session`
- `POST /api/v1/auth/mobywatel/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

**Dokładnie 9 kodów świadczeń:**
1. `zasilek_macierzynski_urlop_macierzynski`
2. `zasilek_w_wysokosci_zasilku_macierzynskiego`
3. `urlop_ojcowski`
4. `urlop_rodzicielski`
5. `zasilek_chorobowy_w_ciazy`
6. `swiadczenie_rehabilitacyjne`
7. `uzupelniajacy_urlop_macierzynski`
8. `urlop_na_warunkach_urlopu_macierzynskiego`
9. `zasilek_pogrzebowy_martwe_urodzenie`

Nazwy i kody można przechowywać w konfiguracji FE, ale nie reguły oceny ani wyliczone kwoty. Każdy kod powinien być dostępny do indywidualnego sprawdzenia; brakujące oceny oznacz jako „nie sprawdzono”, nie jako „nie przysługuje”.

## 4. UX i struktura aplikacji

Zachowaj dolne zakładki: **Plan | Kalendarz | Świadczenia | Mapa | Profil**.
- **Plan → Mój plan:** centrum zadań, terminów i przejść do świadczeń/kalkulatora/formalności. Oddziel lokalne zadania zdrowotne i DEMO od wyników prawnych API.
- **Świadczenia → Moje uprawnienia:** lista ocen zgrupowana na „prawdopodobnie spełniasz”, „potrzebne dane”, „możliwa alternatywa”, „nie spełniasz sprawdzonych warunków”. Ustal dokładne mapowanie na enumy API, nie na heurystykę wieku dziecka.
- **Kalkulator:** osobna trasa uruchamiana ze świadczeń i Planu (bez szóstej dolnej zakładki); compare jako jego część.
- **Kalendarz/Formalności:** wykorzystaj tylko potwierdzone dane terminów i dokumentów. Jeżeli API ich nie zwraca, pokaż brak informacji, nie generuj reguł prawnych.
- **Mapa:** zostaw DEMO katalog/OSM, ulubione i wydarzenia; bez MapLibre/NFZ w P0.
- **Profil:** możliwość edycji danych i kontrola sesji.

Docelowy flow: **welcome (bez logowania) → sytuacja rodzinna → krótka ankieta → Mój plan / Moje uprawnienia → szczegóły statusu i braków → symulacja kwoty → porównanie rodziców (jeśli dotyczy) → formalności/terminy.**

## 5. Ankieta, model danych i stan

Rozszerz istniejący RHF/Zod z progressive disclosure. Zbieraj tylko pola rzeczywiście potrzebne do wybranego świadczenia albo kalkulatora, zależnie od OpenAPI:
- rodzina: planowanie, ciąża, po porodzie, adopcja/piecza; daty, liczba dzieci;
- zatrudnienie: forma, ubezpieczenie chorobowe, okres ubezpieczenia, ustanie zatrudnienia, zadłużenie;
- sytuacje szczególne: wcześniactwo, hospitalizacja, „Za życiem”, drugi rodzic, wyczerpanie zasiłku chorobowego, adopcja, szczególne okoliczności śmierci dziecka;
- finansowe: zarobki/dochód, podstawa składek, okres pracy i dane drugiego rodzica — dopiero przy kalkulacji.

Obsłuż **„Nie wiem”**, `null` i brak danych bez zamiany na `false` lub `0`. Pozwól wracać, edytować i zapisać szkic. Nie sugeruj, że deklaracja użytkownika to potwierdzenie danych ZUS. Po zmianie danych unieważnij zależne oceny i kwoty (poprawne query keys, invalidation i cache); nie pokazuj starych wyników jako aktualnych.

## 6. Lista i szczegóły uprawnień

Wyniki muszą pochodzić z `eligibility/check`. Preferuj świadczenia istotne dla sytuacji rodziny, ale zachowaj dostęp do wszystkich 9 i jawne rozróżnienie „sprawdzone” / „nie sprawdzone”.

Na karcie: nazwa, status, krótkie uzasadnienie, braki/przeszkody, możliwa alternatywa, CTA do szczegółu.

Szczegół w kolejności: status → znaczenie wyniku → spełnione/niespełnione warunki → brakujące dane → rozwiązania → plan/okres → dokumenty/terminy, jeśli dostępne → podstawy prawne → ostrzeżenia. Uwzględnij `plan: null`, `plan.weeks: null`, `duration_description`, `rate_percentage: null`, `lump_sum_amount_zl` (jeśli występuje), `possible_solutions[].related_benefit_code`, `warnings`. Alternatywa ma prowadzić do właściwego świadczenia. Ostrzeżenia pokaż również przy wyniku pozytywnym.

## 7. Kalkulator i porównanie rodziców

`calculate/{benefit_code}`: wybór świadczenia, wymagane przez API pola, obliczenie, kwota/okres (jeśli są znane), podstawa, założenia i warnings. Obsłuż świadczenia procentowe, kwoty jednorazowe, okresy w dniach lub tygodniach, nieznane okresy, zmienne stawki rehabilitacyjnego i niewyliczalną pełną sumę. **Nigdy nie mapuj `null` na `0 zł`.** Nie przeliczaj wartości na własną rękę.

**Obowiązkowe ostrzeżenie przy hipotetycznej kwocie:**
> To symulacja kwoty przy przyjętych założeniach. Nie oznacza potwierdzenia prawa do świadczenia.

`compare/urlop-rodzicielski`: pokaż trzy warianty z odpowiedzi BE (maksymalny udział pierwszego rodzica, maksymalny drugiego, podział po równo), tygodnie rodziców, szacowane kwoty obu, sumę rodzinną i warnings. Nie oznaczaj wariantu z największą sumą jako automatycznie najlepszego. Ekran ma być opisany jako **wstępne porównanie** z uwagi na znane uproszczenia stawek 81,5%/70% i dziewięciu tygodni nieprzenoszalnych.

## 8. Sesje, błędy i bezpieczeństwo

Sprawdź istniejące session / mObywatel DEMO / me / refresh / logout, nie duplikuj. Ocena publiczna nie wymaga konta. Po logout usuń dane poprzedniego profilu z Zustand, persystencji i cache TanStack Query; unikaj przecieków między sesjami. Obsłuż API offline, `401`, `404`, `422`, puste wyniki, częściowe dane, niepełny `plan`, ostrzeżenia i ponowienie zapytania. Użytkownik nie widzi surowych błędów FastAPI. Tryb DEMO zawsze czytelny.

## 9. Scenariusze do demonstracji

Dane wejściowe (nie gotowe wyniki): mama na etacie, rodzice dzielący urlop, ojciec, ciąża i ubezpieczenie, samozatrudnienie z zadłużeniem, hospitalizacja noworodka, adopcja/piecza, ustanie zatrudnienia, szczególna sytuacja rodzinna. W REST oceny i kwoty pochodzą wyłącznie z serwera. Gdy BE nie obsługuje niuansu, nie prezentuj wyniku jako w pełni rozstrzygającego.

## 10. Testy i Definition of Done

Sprawdź co najmniej:
- guest onboarding i poprawne dane warunkowe;
- wszystkie 9 kodów przez rzeczywisty `eligibility`, oraz `calculate` dla kodów obsługiwanych zgodnie z OpenAPI;
- wynik pozytywny, przeszkoda, brak danych, alternatywa, warnings;
- `null` dla planu, tygodni, stawki i kwoty; jednorazowe świadczenie kwotowe;
- symulacja kwoty przy braku potwierdzonego prawa;
- trzy warianty compare (rodzic A/B, tygodnie, kwoty, suma, ostrzeżenia);
- edycja ankiety i odświeżenie wyników, izolacja sesji i logout;
- brak cichego fallbacku w REST, API offline oraz 401/404/422;
- przepływ Web w widoku desktop i mobile + regresja Plan/Kalendarz/Mapa/Profil.

Testy natywne raportuj wyłącznie, jeśli zostały naprawdę wykonane. Nie uznawaj samego HTTP 200 za potwierdzenie merytorycznej zgodności z prawem. Jeśli środowisko testowe nie działa, odnotuj wyraźnie, czego nie dało się zweryfikować.

## 11. Do uzgodnienia z BE, nie do naprawiania w FE

Zgłoś ograniczenia dotyczące wyjątków od wyczekiwania, hospitalizacji noworodka, minimalnego urlopu adopcyjnego, waloryzacji rehabilitacyjnego, krótkiego zatrudnienia, premii/przerw, stawek 81,5%/70% i 9 tygodni, a także weryfikacji **reguły uzupełniającego urlopu macierzyńskiego i terminu zasiłku pogrzebowego**. Zapytaj, które pola finansowe BE realnie uwzględnia i jakie dane formalności zwraca.

## 12. Obowiązkowy raport końcowy

Przekaż: (1) listę zmienionych plików, (2) zrealizowane integracje i endpointy, (3) tabelę 9 świadczeń — eligibility / calculate / wynik testu, (4) wynik compare, (5) wyniki Web i ewentualnie natywnych, (6) błędy OpenAPI i ograniczenia BE, (7) wszystkie pozostałe mocki/DEMO, (8) znane ryzyka, (9) niewykonane testy i powody. Oznacz osobno **zaimplementowane**, **przetestowane z realnym BE** i **zablokowane**.

**Zacznij od krótkiego audytu repo i planu zmian, potem od razu wdrażaj P0. Nie poprzestawaj na samym audycie. Nie usuwaj ani nie zastępuj działających funkcjonalności, jeśli wystarczy integracja lub poprawka.**
