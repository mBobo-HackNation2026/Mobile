# eBobo — Brief dla agenta Frontend + UX/Product

**Projekt:** eBobo  
**Konkurs:** HackNation 2026  
**Wyzwanie:** Zasiłkowy Przewodnik Przyszłego Rodzica (ZUS)  
**Rola agenta:** Frontend Engineer + UX Designer + Product Designer  
**Priorytet:** Funkcjonalność ułatwiająca uzyskiwanie świadczeń.

---

## 1. Misja produktu

eBobo to cyfrowy przewodnik pomagający przyszłym i obecnym rodzicom **ustalić, o jakie świadczenia mogą się ubiegać, zrozumieć warunki ich otrzymania i przejść przez proces składania wniosków**.

Nie budujemy katalogu świadczeń ani zwykłego kalkulatora.

Budujemy aplikację, która na podstawie sytuacji użytkownika odpowiada:

1. **Co mi przysługuje?**
2. **Dlaczego mi przysługuje albo dlaczego nie?**
3. **Co mogę zrobić, jeśli obecnie nie spełniam warunków?**
4. **Czy istnieje legalna alternatywna droga uzyskania wsparcia?**
5. **Jaki wniosek muszę złożyć, gdzie, kiedy i z jakimi dokumentami?**
6. **Ile mogę otrzymać i jak moje decyzje wpłyną na wysokość świadczenia?**

### Główna zasada

**Nie kończymy na odpowiedzi „przysługuje” lub „nie przysługuje”. Zawsze, kiedy istnieje uzasadniona możliwość, pokazujemy użytkownikowi kolejny konkretny krok.**

Jeżeli nie istnieje potwierdzona droga, komunikujemy to jasno, bez obiecywania niemożliwych rezultatów.

Aplikacja nie wydaje decyzji ZUS. Prezentuje indywidualną ocenę opartą na dostępnych danych i aktualnych regułach.

---

## 2. Główna wartość produktu

Największą wartością eBobo jest:

**Wykrywanie potencjalnie dostępnych świadczeń oraz pomoc w przełamywaniu barier formalnych, informacyjnych i — tam, gdzie pozwala na to prawo — związanych z warunkami uprawnienia.**

Przykładowo użytkownik:

- nie wiedział, że może ubiegać się o świadczenie;
- nie wiedział, który z rodziców może skorzystać z określonego uprawnienia;
- nie ma wymaganego dokumentu;
- nie zna terminu złożenia wniosku;
- nie wie, czy jego forma zatrudnienia daje odpowiednią ochronę;
- może mieć prawo do innego świadczenia, mimo braku prawa do pierwotnie wybranego;
- może zgodnie z prawem zmienić pewne okoliczności dotyczące przyszłego uprawnienia.

eBobo powinno te sytuacje rozpoznawać i przedstawiać użytkownikowi zrozumiałe działania.

**Ważne:** brak dokumentu, brak potwierdzenia danych i rzeczywisty brak prawa do świadczenia są różnymi problemami. Interfejs nie może ich utożsamiać.

---

## 3. Obowiązujący stack frontendowy

Frontend już działa w następującym stacku:

- Expo SDK 58
- React Native
- React Native Web
- TypeScript strict
- Expo Router
- StyleSheet + design tokens
- Zustand
- TanStack Query
- React Hook Form
- Zod
- date-fns

### Zasady techniczne

- Nie zmieniaj istniejącego stacku bez uzgodnienia.
- Nie twórz osobnego frontendu w Next.js.
- Nie wprowadzaj nowego frameworka UI lub stylowania bez uzasadnienia.
- Rozwijaj istniejący system design tokens.
- Wszystkie ekrany powinny współdziałać na WWW, Androidzie i iOS.
- Wersja webowa jest obowiązkowym elementem konkursowej demonstracji.
- Zachowuj TypeScript strict i unikaj niekontrolowanego używania `any`.

Backend projektu:

- Python 3.12.7
- FastAPI
- Pydantic v2
- SQLAlchemy
- SQLite z możliwością przejścia na PostgreSQL
- PyMuPDF do odczytu PDF

Frontend komunikuje się z backendem przez REST API.

**Cała logika prawna, ocena uprawnień, obliczenia świadczeń i wyznaczanie terminów należą do backendu.**

Frontend odpowiada za zebranie danych, prezentację wyników i poprowadzenie użytkownika przez kolejne działania.

---

## 4. Najważniejszy proces użytkownika

Podstawowa ścieżka produktu:

**Start → Poznanie sytuacji rodzica → Analiza uprawnień → Wykrycie możliwości i przeszkód → Wskazanie rozwiązań → Przygotowanie wniosku → Plan dalszych działań.**

Kalkulator stanowi część tego procesu, kiedy jest potrzebny do podjęcia decyzji.

### Etap 1 — Poznajemy sytuację

Użytkownik:

- wypełnia krótką ankietę;
- wybiera przykładowy profil;
- korzysta z symulowanego pobrania danych ZUS;
- lub przesyła dokument PDF.

System powinien umożliwiać łączenie tych źródeł i poprawianie danych.

### Etap 2 — Analizujemy potencjalne uprawnienia

Backend ocenia świadczenia, a frontend pokazuje zrozumiałe wyniki.

### Etap 3 — Wyjaśniamy przeszkody

Jeśli brakuje warunku, system przedstawia go użytkownikowi.

Pokazuje, czy problem można rozwiązać, czy wymaga dodatkowej weryfikacji i czy ma znaczenie dla przyszłych czy już powstałych uprawnień.

### Etap 4 — Wskazujemy dostępne rozwiązania

Użytkownik otrzymuje konkretne, potwierdzone prawnie możliwości.

Nie wolno proponować działań pozornych, obchodzących prawo ani gwarantować świadczenia bez podstaw.

### Etap 5 — Pomagamy w formalnościach

Użytkownik otrzymuje właściwe dokumenty, terminy, instrukcje i wskazanie instytucji.

Tam, gdzie przewidziano to w demonstracji, może przejść do symulowanego formularza.

### Etap 6 — Prowadzimy dalej

Użytkownik widzi, co już zrobił i co pozostaje do załatwienia.

---

## 5. Model prezentacji uprawnień

To najważniejszy element interfejsu.

Każde świadczenie powinno otrzymywać indywidualny stan, wynikający z danych backendu.

### Stan A — Prawdopodobnie spełniasz warunki

Komunikat:

„Na podstawie podanych informacji spełniasz sprawdzone warunki tego świadczenia”.

Pokazujemy:

- nazwę świadczenia;
- uzasadnienie oceny;
- ewentualną wysokość i czas trwania;
- wymagane dokumenty;
- właściwą instytucję;
- terminy;
- następne działanie.

Główne CTA: **„Zobacz, jak złożyć wniosek”**.

### Stan B — Nie spełniasz obecnie warunku, ale istnieje możliwe rozwiązanie

Komunikat:

„Obecnie nie spełniasz jednego z warunków. Sprawdź, jakie masz możliwości”.

Pokazujemy:

- który warunek nie jest spełniony;
- dlaczego ma znaczenie;
- czy istnieje legalne działanie umożliwiające spełnienie warunku;
- od kiedy działanie może wywołać skutki;
- czy dotyczy ono przyszłego uprawnienia, czy obecnej sytuacji;
- związane z nim ograniczenia i ryzyka;
- inne potencjalnie dostępne świadczenia.

Główne CTA: **„Sprawdź możliwe rozwiązania”**.

Nie prezentuj hipotetycznego działania jako gwarancji uzyskania świadczenia.

### Stan C — Nie ustalono dostępnej drogi

Komunikat:

„Na podstawie dostępnych informacji nie znaleźliśmy drogi do uzyskania tego świadczenia w tej sytuacji”.

Pokazujemy:

- powód negatywnej oceny;
- podstawę prawną;
- ewentualne alternatywne świadczenia;
- informację o możliwości indywidualnej konsultacji.

Unikaj komunikatów sugerujących, że użytkownik popełnił błąd.

### Stan D — Brakuje danych do oceny

Komunikat:

„Potrzebujemy jeszcze jednej informacji, żeby sprawdzić Twoje uprawnienie”.

Pokazujemy:

- konkretną brakującą informację;
- dlaczego jest potrzebna;
- możliwość jej uzupełnienia;
- opcję „Nie wiem”.

Główne CTA: **„Uzupełnij informacje”**.

### Stan E — Wymagana indywidualna weryfikacja

Niektóre sytuacje wymagają potwierdzenia przez ZUS lub inny właściwy podmiot.

Pokazujemy:

- co już zostało ustalone;
- czego nie można bezpiecznie rozstrzygnąć;
- jakie dokumenty lub dane są potrzebne;
- gdzie użytkownik może uzyskać potwierdzenie.

**Ważne:** są to stany prezentacji produktu. Backend może udostępniać prostsze statusy i dodatkowe pola o przeszkodach oraz możliwych działaniach. Nie wymuszaj własnej logiki prawnej tylko po to, by przypisać status wizualny.

---

## 6. Główne ekrany aplikacji

### 6.1. Start / onboarding

Cel: przekonać użytkownika, że otrzyma konkretną pomoc.

Główny komunikat:

**„Sprawdź, jakie świadczenia Ci przysługują i jak je uzyskać”.**

Pierwsze wybory:

- Planuję dziecko.
- Jestem w ciąży.
- Dziecko już się urodziło.
- Przyjmuję dziecko na wychowanie.

Możliwe źródła danych:

- Wypełnij krótką ankietę.
- Użyj przykładowego profilu.
- Połącz z ZUS — symulacja.
- Prześlij dokument do analizy.

Nie wymagaj rejestracji przed rozpoczęciem demonstracji.

### 6.2. Ankieta sytuacji rodzica

Cel: zebranie minimum informacji pozwalających ocenić uprawnienia.

Pytania warunkowe dotyczą między innymi:

- etapu rodzicielstwa;
- rodzaju zatrudnienia;
- tytułu i okresów ubezpieczenia;
- rzeczywistej lub przewidywanej daty porodu;
- liczby dzieci;
- sytuacji drugiego rodzica;
- wykorzystanych urlopów;
- szczególnych okoliczności istotnych prawnie.

Wymagania UX:

- niewiele pytań na jednym ekranie;
- pasek postępu;
- wyjaśnienia trudnych pojęć;
- możliwość poprawienia odpowiedzi;
- obsługa odpowiedzi „Nie wiem”;
- brak niepotrzebnego powtarzania pytań;
- możliwość uzupełnienia danych później.

Projektuj ankietę w taki sposób, aby jej zakres mógł być rozszerzany w miarę rozwoju silnika uprawnień.

### 6.3. Moje świadczenia — najważniejszy ekran

To główna strona aplikacji po analizie.

**Nie zaczynamy od ogólnego dashboardu z wykresami. Zaczynamy od pokazania użytkownikowi, jakie ma możliwości.**

Przedstaw świadczenia w grupach:

- świadczenia, do których prawdopodobnie spełnia warunki;
- świadczenia z możliwymi do rozwiązania przeszkodami;
- świadczenia wymagające dodatkowych informacji;
- świadczenia, do których nie ustalono uprawnienia.

Każda karta powinna zawierać:

- nazwę świadczenia;
- czytelny status;
- krótkie uzasadnienie;
- najważniejszy następny krok;
- możliwość otwarcia szczegółów.

Nie używaj samego koloru do komunikowania statusu.

Nie prezentuj wszystkich możliwych świadczeń jako jednakowo ważnych. Uwzględnij etap rodzicielstwa, terminy i sytuację użytkownika.

### 6.4. Szczegóły świadczenia

Ekran powinien odpowiadać na następujące pytania:

**Dlaczego?**

- Jakie warunki spełniam?
- Których nie spełniam?
- Czego jeszcze nie wiadomo?

**Co mogę zrobić?**

- Jakie działania są dostępne?
- Czy istnieje alternatywna ścieżka?
- Jakie są ograniczenia?

**Jak uzyskać świadczenie?**

- Jaki wniosek?
- Jakie załączniki?
- Gdzie złożyć?
- Do kiedy?
- Co zrobić po złożeniu?

**Ile mogę otrzymać?**

- Kwota, okres i warianty, jeżeli wynik można ustalić.
- Możliwość przejścia do kalkulatora.

**Skąd ta informacja?**

- Źródło prawne.
- Data obowiązywania reguły.
- Zakres i ograniczenia symulacji.

### 6.5. Możliwe rozwiązania

To kluczowa funkcja wyróżniająca eBobo.

Jeżeli istnieje przeszkoda w uzyskaniu świadczenia, pokaż osobny widok prowadzący przez dostępne możliwości.

Przykładowa struktura:

**Problem:** Nie potwierdzono ubezpieczenia chorobowego.

**Dlaczego to istotne:** Ubezpieczenie chorobowe może stanowić warunek danego świadczenia.

**Możliwe działania:** Tylko działania potwierdzone przez silnik reguł backendu i właściwe źródła.

**Ograniczenia:** Niektóre działania mogą działać wyłącznie na przyszłość; nie można zakładać możliwości wstecznego uzyskania prawa.

**Alternatywy:** Inne potencjalnie dostępne świadczenia lub uprawnienia drugiego rodzica.

**Następny krok:** Weryfikacja danych, właściwe zgłoszenie lub kontakt z odpowiednią instytucją.

Wyraźnie odróżniaj:

- uzupełnienie brakującego dokumentu;
- skorygowanie błędnych danych;
- legalną zmianę sytuacji na przyszłość;
- skorzystanie z innego świadczenia;
- sytuację, której nie da się rozwiązać wskazanym działaniem.

Nie każdy niespełniony warunek można zmienić.

### 6.6. Moje sprawy — kreator wniosków

Drugi najważniejszy obszar produktu.

**Użytkownik nie powinien samodzielnie szukać formularza, zgadywać, jak go wypełnić i ustalać, gdzie go wysłać.**

Dla każdego świadczenia prezentuj procedurę:

1. Przygotuj wymagane informacje.
2. Sprawdź dokumenty.
3. Wybierz właściwy formularz.
4. Uzupełnij lub sprawdź dane.
5. Zweryfikuj termin i adresata.
6. Przejdź do właściwego sposobu złożenia.
7. Oznacz działanie jako wykonane.

Jeżeli udostępniono symulację złożenia wniosku, jednoznacznie ją oznacz.

**Nie pokazuj komunikatu „Wniosek został wysłany do ZUS”, jeśli wykonano wyłącznie symulację.**

Uwzględnij, że formularze zmieniają się w czasie. Brief ZUS informuje, że od 24 października 2026 r. formularze ZUR i ZAO zostały połączone z ZAM, a Z-3b zlikwidowano.

Nie hardkoduj nieaktualnych formularzy.

### 6.7. Kalkulator świadczeń

Kalkulator pozostaje ważnym i obowiązkowym elementem konkursu, ale pełni funkcję wspierającą.

Powinien pomagać użytkownikowi:

- oszacować wysokość świadczenia;
- poznać czas jego trwania;
- porównać warianty wypłaty;
- przeanalizować podział uprawnień pomiędzy rodziców;
- sprawdzić skutki łączenia urlopu rodzicielskiego z pracą;
- uwzględnić szczególne przypadki, w tym adopcję.

Projektuj jeden zintegrowany kalkulator z opcjami właściwymi dla danej sytuacji.

Nie twórz frontendowych formuł prawnych.

Wynik zawsze pochodzi z backendu i powinien zawierać informację o przyjętych założeniach.

### 6.8. Mój plan / kalendarz

Cel: pilnowanie kolejnych działań.

Dla użytkownika ważniejsza jest odpowiedź „Co muszę teraz zrobić?” niż rozbudowany kalendarz.

Pokazuj:

- najbliższy istotny termin;
- listę zadań;
- wymagane dokumenty;
- adresata wniosku;
- status wykonania;
- ostrzeżenia o ryzyku przekroczenia terminu.

Kalendarz jest dodatkowym widokiem tej samej listy działań.

### 6.9. Dane ZUS i dokumenty

Umożliwiaj:

- wyświetlenie symulowanych danych ubezpieczeniowych;
- podgląd okresów ubezpieczenia;
- wyświetlenie informacji o świadczeniach;
- prezentację e-ZLA;
- prezentację informacji o zadłużeniu składkowym;
- wybór przykładowej sprawy;
- upload dokumentów PDF;
- sprawdzenie i korektę odczytanych danych.

Każdą integrację demonstracyjną jednoznacznie oznacz jako **symulację**.

Nie prezentuj przykładowych danych jako informacji pobranych z rzeczywistego konta ZUS.

Wgraj/wybierz PDF → backend analizuje → użytkownik weryfikuje dane → backend ocenia uprawnienia → frontend pokazuje wynik.

---

## 7. Nawigacja i architektura informacji

Proponowana główna nawigacja:

**Moje świadczenia | Moje sprawy | Kalkulator | Profil**

W „Moich sprawach” umieść checklisty i kalendarz terminów.

W „Profilu” umożliwiaj poprawę danych, ponowną analizę uprawnień i dostęp do symulowanych danych ZUS.

Nawigacja mobilna może korzystać z dolnego paska, a wersja desktopowa z bocznego menu.

To propozycja produktowa. Przed implementacją sprawdź istniejące rozwiązania i zachowaj ich spójność.

---

## 8. Przykładowe scenariusze UX do wdrożenia

### Scenariusz A — Użytkownik prawdopodobnie spełnia warunki

1. Wprowadza dane.
2. System identyfikuje możliwe świadczenie.
3. Użytkownik widzi uzasadnienie.
4. Otwiera szczegóły.
5. Otrzymuje listę wniosków i dokumentów.
6. Sprawdza termin oraz miejsce złożenia.
7. Przechodzi do właściwej procedury.

**Cel:** jak najmniej kroków od ustalenia uprawnienia do przygotowania wniosku.

### Scenariusz B — Użytkownik nie spełnia warunku

1. Wprowadza dane.
2. System wykrywa przeszkodę.
3. Użytkownik widzi, dlaczego świadczenie jest obecnie niedostępne.
4. Otwiera możliwe rozwiązania.
5. System pokazuje wyłącznie potwierdzone prawnie działania.
6. Użytkownik może sprawdzić skutki zmiany danych.
7. Otrzymuje plan dalszych kroków.

**Cel:** brak prawa do świadczenia nie powinien automatycznie kończyć interakcji.

### Scenariusz C — Alternatywne uprawnienie drugiego rodzica

1. Użytkownik nie spełnia warunków określonego świadczenia.
2. System sprawdza, czy istnieją niezależne uprawnienia drugiego rodzica.
3. Prosi o niezbędne dodatkowe informacje.
4. Pokazuje ocenę alternatywnego świadczenia.
5. Prowadzi do wymaganych formalności.

Przykładem jest rozpatrywanie uprawnień ojca niezależnie od braku ubezpieczenia chorobowego matki, tam gdzie przepisy to dopuszczają.

### Scenariusz D — Niekompletne dane

1. Użytkownik nie zna okresu ubezpieczenia.
2. System nie wydaje negatywnego rozstrzygnięcia.
3. Pokazuje, jakiej informacji brakuje.
4. Użytkownik może ją wpisać, poprawić lub skorzystać z mockowanych danych ZUS.
5. System ponawia ocenę.

### Scenariusz E — Analiza dokumentu konkursowego

1. Juror wybiera przykładową sprawę lub przesyła PDF.
2. Aplikacja pokazuje odczytane dane.
3. Umożliwia ich weryfikację.
4. Backend ustala status ubezpieczenia i wynik kalkulacji.
5. Frontend pokazuje uzasadnienie i powiązane formalności.

To istotny element demonstracji wymagany przez ZUS.

---

## 9. Zasady UX i komunikacji

### Prostota

Projektuj dla osoby, która może być zmęczona, zestresowana, opiekować się noworodkiem i korzystać z aplikacji na telefonie.

- Krótkie instrukcje.
- Jedno dominujące działanie na ekranie.
- Minimalna liczba wymaganych pól.
- Czytelne statusy.
- Duże elementy dotykowe.
- Możliwość powrotu do przerwanej czynności.

### Zrozumiałe komunikaty

Unikaj niezrozumiałych komunikatów systemowych.

Zamiast samego „Brak uprawnienia” pokaż:

„Nie możemy obecnie potwierdzić prawa do tego świadczenia, ponieważ nie mamy informacji o Twoim ubezpieczeniu chorobowym”.

A następnie:

„Sprawdź, jak uzupełnić tę informację”.

### Nie obiecuj rezultatu

Stosuj sformułowania:

- „Na podstawie danych spełniasz sprawdzone warunki”.
- „Możesz mieć prawo do...”.
- „Sprawdź możliwość...”.
- „To wymaga potwierdzenia”.
- „Symulowana wysokość świadczenia”.

Unikaj automatycznych zapewnień:

- „ZUS na pewno przyzna Ci świadczenie”.
- „Wystarczy wykonać ten krok, aby otrzymać pieniądze”.
- „Gwarantowana wypłata”.

### Wrażliwe sytuacje

Uwzględnij sytuacje poronienia, martwego urodzenia, śmierci dziecka, wcześniactwa i poważnej choroby.

Nie wyświetlaj automatycznie radosnych komunikatów, gratulacji lub nieadekwatnych ilustracji w tych ścieżkach.

Zachowaj spokojny, rzeczowy język.

---

## 10. Współpraca z backendem

Backend jest źródłem prawdy o uprawnieniach.

Frontend nie może samodzielnie ustalać, czy dana zmiana zatrudnienia, ubezpieczenia lub terminu prowadzi do uzyskania świadczenia.

### Wymagane dane z API

Dla każdego świadczenia frontend potrzebuje:

- identyfikatora i nazwy świadczenia;
- statusu oceny;
- spełnionych warunków;
- niespełnionych warunków;
- brakujących danych;
- możliwych działań naprawczych;
- alternatywnych świadczeń;
- ryzyk i ograniczeń;
- wymaganych dokumentów;
- formularzy;
- właściwego adresata;
- terminów;
- ewentualnego wyliczenia kwoty i czasu;
- podstawy prawnej i wersji reguł.

To wymagania dotyczące kontraktu, nie założenie, że backend już je implementuje.

### Oczekiwane operacje

Uzgodnij z agentem backendowym endpointy do:

- oceny uprawnień;
- pobierania szczegółów świadczenia;
- pobierania możliwych rozwiązań;
- generowania planu działań;
- kalkulacji i porównywania wariantów;
- pobierania mockowanych danych ZUS;
- analizy dokumentów;
- pobierania informacji o formularzach.

Wykorzystuj TanStack Query do stanu serwerowego.

Zustand pozostaw do stanu lokalnego aplikacji.

Formularze buduj w React Hook Form + Zod.

Typy API synchronizuj z Pydantic/OpenAPI.

Nie twórz na frontendzie niezależnego silnika reguł.

---

## 11. Priorytety implementacji

### P0 — najważniejsze

**A. Ankieta i źródła danych**

- Onboarding.
- Formularz warunkowy.
- Mockowany profil ZUS.
- Uzupełnianie brakujących danych.

**B. Silnik możliwości — warstwa UX**

- Lista świadczeń.
- Statusy uprawnień.
- Wyjaśnienia warunków.
- Informacje o przeszkodach.
- Dostępne rozwiązania.
- Alternatywne świadczenia.

**C. Prowadzenie przez formalności**

- Szczegóły świadczenia.
- Właściwe wnioski.
- Dokumenty i załączniki.
- Gdzie złożyć.
- Do kiedy złożyć.
- Spersonalizowany plan.

**D. Zintegrowany kalkulator**

- Warianty świadczeń.
- Podział uprawnień między rodzicami.
- Łączenie pracy z urlopem.
- Podstawowe przypadki szczególne.

**E. Demonstracja konkursowa**

- Responsywna strona WWW.
- Wybór lub upload dokumentów PDF.
- Testowe profile i sprawy.
- Symulowane integracje.
- Kompletny przepływ demonstracyjny.

### P1 — po ukończeniu głównych ścieżek

- Bardziej rozbudowane kreatory formularzy.
- Zaawansowana oś czasu.
- Przypomnienia push.
- Dodatkowe objaśnienia wspierane AI.
- Rozbudowane wizualizacje porównawcze.
- Rozszerzona obsługa szczególnych przypadków.

### P2 — poza głównym celem hackathonu

- Forum rodziców.
- Społeczność.
- Wyszukiwarka placówek.
- Dziennik zdrowia i rozwoju dziecka.

Nie poświęcaj P0 na implementację P2.

---

## 12. Wymagania techniczne i jakościowe

Każdy ekran musi mieć:

- stan ładowania;
- stan błędu;
- stan pusty;
- działanie z niekompletnymi danymi;
- jasną walidację;
- obsługę braku połączenia;
- responsywny układ;
- podstawową dostępność.

W przypadku operacji na wrażliwych danych:

- zbieraj tylko niezbędne informacje;
- nie umieszczaj prawdziwych danych osobowych w demonstracyjnych fixture'ach;
- nie zapisuj dokumentów w publicznych zasobach;
- jasno komunikuj zakres użycia danych;
- nie zakładaj, że mockowanie integracji daje dostęp do rzeczywistych danych użytkownika.

Nie publikuj dokumentów testowych ZUS w otwartym repozytorium, jeżeli obowiązują ograniczenia ich rozpowszechniania.

---

## 13. Kryteria ukończenia MVP

Frontend MVP uznajemy za ukończony, jeżeli użytkownik może:

1. Rozpocząć bez obowiązkowej rejestracji.
2. Podać dane lub wybrać demonstracyjny profil.
3. Uzyskać indywidualną ocenę świadczeń.
4. Zrozumieć, dlaczego świadczenie jest dostępne lub niedostępne.
5. Zobaczyć niespełnione warunki.
6. Sprawdzić prawnie uzasadnione możliwości działania, jeśli istnieją.
7. Poznać alternatywne uprawnienia, jeśli występują.
8. Otrzymać instrukcję przygotowania wniosku.
9. Sprawdzić wymagane dokumenty, instytucję i termin.
10. Obliczyć świadczenie w obsługiwanym scenariuszu.
11. Przetestować przykładowy dokument PDF.
12. Przejść całą ścieżkę w responsywnej aplikacji webowej.

Wszystkie wyświetlane wyniki muszą być spójne z odpowiedziami backendu.

---

## 14. Pierwszy kamień milowy

**Zbuduj jeden kompletny pionowy przepływ, zanim rozpoczniesz wiele osobnych ekranów.**

Rekomendowany pierwszy scenariusz:

1. Użytkownik wybiera przykładową sytuację rodzica.
2. Wypełnia brakujące informacje.
3. Aplikacja wyświetla listę potencjalnych świadczeń.
4. Jedno świadczenie ma warunki spełnione.
5. Drugie zawiera przeszkodę wymagającą wyjaśnienia.
6. Użytkownik otwiera przeszkodę.
7. System pokazuje dostępne, zweryfikowane działania albo brak takiej możliwości.
8. Użytkownik otwiera instrukcję złożenia odpowiedniego wniosku.
9. Widzi dokumenty, termin i właściwą instytucję.

W tej ścieżce powinno działać prawdziwe połączenie Expo–FastAPI.

Nie przedstawiaj wymyślonych porad prawnych jako rzeczywistych wyników silnika. Do czasu gotowości backendu stosuj uzgodnione, jawnie oznaczone fixture'y.

---

## 15. Jak powinien pracować agent

### Przed implementacją

- Sprawdź istniejące repozytorium.
- Zidentyfikuj obecne ekrany, komponenty, routing i tokeny.
- Sprawdź dostępne API.
- Przygotuj propozycję przepływu użytkownika.
- Ustal zależności z agentem backendowym.

### Podczas implementacji

- Wprowadzaj zmiany etapami.
- Reużywaj istniejące komponenty.
- Sprawdzaj TypeScript strict.
- Testuj wersję webową i układy mobilne.
- Nie dubluj logiki biznesowej.
- Dokumentuj brakujące pola API.
- Priorytetyzuj działający przepływ nad dekoracjami.

### Po implementacji

Przekaż:

- ukończone ekrany;
- opis działającego przepływu;
- zależności od backendu;
- wyniki weryfikacji technicznej;
- problemy UX;
- brakujące funkcjonalności;
- rekomendowany następny etap.

Nie deklaruj ukończenia funkcji, której nie sprawdzono.

---

## 16. Źródła

Korzystaj z dokumentów przekazanych w projekcie eBobo:

- Brief wyzwania ZUS „Zasiłkowy Przewodnik Przyszłego Rodzica”, szczególnie strony 11–16.
- Poradnik dla rodziców i opiekunów dzieci ZUS 2026.
- Kodeks pracy — przekazany wyciąg.
- Ustawa zasiłkowa — przekazany wyciąg.
- Rozporządzenia dotyczące wniosków i dokumentów.
- Załącznik dotyczący długości i wysokości świadczeń.
- Opracowanie 22 nagrań głosowych i potrzeb rodziców.

Materiały z nagrań są źródłem potrzeb użytkowników, nie podstawą prawną.

Jeżeli backend nie potwierdza danej ścieżki prawnej, nie projektuj jej jako gwarantowanej możliwości uzyskania świadczenia.

---

## 17. Nadrzędna zasada podejmowania decyzji

Przed dodaniem każdej funkcji zadaj sobie pytania:

**Czy to pomaga rodzicowi uzyskać świadczenie?**

**Czy pomaga zrozumieć, dlaczego świadczenie jest niedostępne?**

**Czy pokazuje legalny i rzeczywiście możliwy kolejny krok?**

**Czy upraszcza formalności, dokumenty lub terminy?**

Jeżeli funkcjonalność nie realizuje żadnego z tych celów i nie jest wymagana przez organizatora, prawdopodobnie nie należy do MVP.

### Docelowe doświadczenie użytkownika

Rodzic nie powinien kończyć korzystania z eBobo z samą wiedzą, że „istnieje jakiś zasiłek”.

Powinien kończyć z jasną odpowiedzią:

**„Wiem, jakie mam możliwości, czego mi brakuje, co mogę z tym zrobić oraz jaki konkretny krok powinienem podjąć jako następny”.**

**To jest główny cel produktu i najważniejsze kryterium jakości pracy agenta Frontend + UX/Product.**
