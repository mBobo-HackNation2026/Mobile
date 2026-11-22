# WALIDACJA_ZUS_2026 — Etap 3

**Projekt:** eBobo · HackNation 2026 · Zasiłkowy Przewodnik Przyszłego Rodzica  
**Commit aplikacji:** `f655805`  
**Data walidacji:** 2026-11-22  
**Zakres:** merytoryka uprawnień / kalkulatora / dokumentów / terminów vs źródła organizatora i ZUS; **bez zmiany logiki świadczeń**.

---

## 1. Werdykt dla jury (skrót)

| Obszar | Wiarygodność przed prezentacją |
|--------|--------------------------------|
| Podstawa wymiaru (13,71%, /30) i kwoty 100% macierzyńskiego / ojcowskiego | **Wiarygodne** (zgodne z Poradnikiem / ZUS.pl + ręczne obliczenia) |
| Wymiar 20 tyg. / 140 dni (1 dziecko), 41 tyg. rodzicielskiego, 14 dni ojcowskiego | **Wiarygodne** |
| Zasiłek pogrzebowy 7000 zł, Z-12, 12 miesięcy | **Wiarygodne** |
| Wariant 81,5% + 9 nieprzenoszalnych tygodni w `compare` / częściowo w `calculate` | **Wymaga korekty BE** — kwoty zawyżają stawkę 81,5% na 9 tyg. ojca |
| Eligibility dla typowych profili UoP (live wcześniej) | **Częściowo wiarygodne** — statusy i okresy OK; pełna matryca UoP/zlecenie/DG nie domknięta live w tej sesji |
| Formalności ZAM vs Z-3b po 24.10.2026 | **Ryzyko** — FE ostrzega o ZAM; Poradnik (1.04.2026) nadal wspomina Z-3b; BE bywa niespójny |
| Spójność FE ↔ FastAPI | **Akceptowalna z zastrzeżeniem** — plan lokalny DEMO vs wyniki API są rozdzielone etykietami, ale dwa źródła mogą mylić |
| Stabilność API w trakcie walidacji | **Krytyczne ryzyko demo** — `calculate` macierzyńskiego zwracał okresowo HTTP 500; na koniec sesji BE/Expo niedostępne |

**Nie deklarujemy pełnej walidacji względem paczki dokumentów organizatora** — plików tych **nie ma w workspace** (patrz §2).

---

## 2. Inwentaryzacja źródeł

### 2.1. Brakujące dokumenty organizatora w workspace

Przeszukano `c:\Users\BARTOSZ\Desktop\Projekty` (w tym `Mobile`) — **0 plików PDF** z paczki prawnej konkursu.

| Dokument wymagany w zadaniu Etapu 3 | Status w workspace |
|-------------------------------------|--------------------|
| Brief „Zasiłkowy Przewodnik Przyszłego Rodzica” (PDF, zwłaszcza s. 11–16) | **BRAK** |
| Poradnik ZUS dla rodziców i opiekunów dzieci (2026) — kopia lokalna organizatora | **BRAK** (użyto publicznego PDF ZUS — poniżej) |
| Kodeks pracy — wyciąg przekazany przez organizatora | **BRAK** |
| Ustawa zasiłkowa — wyciąg | **BRAK** |
| Rozporządzenia dotyczące dokumentów i wniosków | **BRAK** |
| Załącznik dotyczący okresów i wysokości zasiłków | **BRAK** |

Bez tych plików **nie wolno** twierdzić, że reguły zostały zweryfikowane „zgodnie z dokumentacją organizatora” w pełnym zakresie. Poniższa tabela opiera się na źródłach zastępczych z jasnym provenance.

### 2.2. Źródła faktycznie przeczytane / użyte

| Źródło | Provenance | Uwagi |
|--------|------------|-------|
| *Poradnik dla rodziców i opiekunów dzieci*, ZUS, stan prawny **1 kwietnia 2026 r.** | Publiczny PDF `zus.pl` → tekst roboczy w cache agenta | Główna baza okresów, stawek, dokumentów |
| ZUS.pl — *Wysokość zasiłku macierzyńskiego* (aktualizacja **4 lutego 2026**) | https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc | 100% / 70% / 81,5%; **9 tyg. zawsze 70%** |
| ZUS.pl — *Zasiłek pogrzebowy* | https://www.zus.pl/swiadczenia/zasilki/zasilek-pogrzebowy | 7000 zł, Z-12, 12 miesięcy |
| `AGENTS.md` (brief produktowy w repo) | Lokalny | Wymagania UX + informacja o scaleniu ZUR/ZAO→ZAM i zniesieniu Z-3b **od 24.10.2026** |
| Live FastAPI przez `/zus-proxy` (wcześniej w tej pracy + AUDYT) | Runtime `f655805` | Obliczenia i eligibility; **nie** zamiennik ustawyekcji ustaw |
| `AUDYT_STANU_PROJEKTU_2026.md` | Lokalny | Dowody wcześniejszych curl: `likely_eligible`, `28187.60` |

Transkrypcje potrzeb rodziców (jeśli obecne poza repo) **nie są podstawą prawną** — nie użyto ich do tabeli reguł.

---

## 3. Metoda kontroli kalkulatora (ręczne oczekiwania)

Założenie testowe (zgodne z typowym uproszczeniem ZUS dla podstawy):

- dochód miesięczny brutto: **7000 zł**
- potrącenie składek na ubezpieczenia społeczne finansowane przez ubezpieczonego: **13,71%**
- podstawa miesięczna = `7000 × (1 − 0,1371) = 6040,30`
- stawka dzienna = `6040,30 / 30 = 201,34`

| Scenariusz | Formuła oczekiwana | Kwota oczekiwana |
|------------|--------------------|------------------|
| Macierzyński 1 dziecko, 100%, 20 tyg. | `201,34 × 140` | **28 187,60 zł** |
| Ojcowski, 100%, 14 dni | `201,34 × 14` | **2 818,76 zł** |
| Rodzicielski tylko część matki 32 tyg. @ 81,5% | `201,34 × 0,815 × 224` | **36 756,63 zł** |
| Te same 32 tyg. @ 70% | `201,34 × 0,70 × 224` | **31 570,11 zł** |
| 9 tyg. nieprzenoszalnych @ 70% (dochód 6000 → dzienna 172,58) | `172,58 × 0,70 × 63` | **7 610,78 zł** |
| Pogrzebowy (członek rodziny) | kwota ryczałtowa | **7 000 zł** |

---

## 4. Tabela walidacji reguł

Legenda statusu: **OK** · **ROZBIEŻNOŚĆ** · **CZĘŚCIOWO** · **NIEZWeryfikowane** (brak źródła organizatora / brak live) · **RYZYKO DEMO**.

| Funkcja / reguła | Wynik aplikacji | Wynik oczekiwany | Źródło prawne / dokument | Status |
|---|---|---|---|---|
| Podstawa: potrącenie 13,71%, `/30` | `basis 6040.30`, `daily 201.34` (calculate live) | Jak wyżej | Poradnik ZUS 2026 (zasady podstawy wymiaru zasiłków); praktyka ZUS | **OK** (BE) |
| Macierzyński 1 dziecko: 20 tyg. / 140 dni | `total_days=140`, kwota `28187.60` (AUDYT + wcześniejszy live) | 20 tyg. = 140 dni kalendarzowych | Poradnik ZUS 2026 — tabela wymiaru urlopu macierzyńskiego (1 dziecko → 20 tyg.) | **OK** (BE) |
| Stawka 100% za okres urlopu macierzyńskiego | Calculate zwraca pełną kwotę przy braku flagi uśrednienia (AUDYT) | 100% podstawy za macierzyński | ZUS.pl *Wysokość* 04.02.2026; Poradnik § wysokość | **OK** (BE) |
| Wariant uśredniony 81,5% — warunek 21 dni | FE + plan lokalny: „decyzja w 21 dni”; compare przyjmuje `full_dose_claimed_within_21_days` | Wniosek/deklaracja pełnego wymiaru ≤ 21 dni po porodzie | ZUS.pl *Wysokość*; Poradnik 2026 (wariant uśredniony) | **OK** (warunek) |
| 9 tyg. nieprzenoszalnych zawsze 70% | `compare` / częściowe calculate stosują 81,5% także do 9 tyg.; API **ostrzega**, ale zwraca zawyżoną sumę | Zawsze **70%** dla art. 182¹ᵃ § 4 KP (9 tyg.) | ZUS.pl *Wysokość*: „nie może dotyczyć… 9 tygodni… wynosi 70%”; Poradnik: „Część… 9 tygodni… zawsze 70%” | **ROZBIEŻNOŚĆ (BE)** |
| Calculate `urlop_rodzicielski` @ 81,5% → 224 dni / 36 756,63 | Zgodne z arytmetyką 32 tyg. × 81,5% | Matematycznie OK dla **samej** części 32 tyg.; nie obejmuje pełnych 41 tyg.; nie zastępuje poprawnego podziału 70% na 9 tyg. drugiego rodzica | Poradnik: 41 tyg. łącznie, 9+9 nieprzenoszalne | **CZĘŚCIOWO** (uproszczenie BE — komunikować jury) |
| Ojcowski: 14 dni, 100% | Live: `14` dni, `2818.76` | 2 tyg. / 14 dni kalendarzowych, 100% | Poradnik 2026 — urlop ojcowski; ZUS.pl *Wysokość* | **OK** (BE) |
| Ojcowski niezależny od ubezpieczenia matki | Silnik przewiduje osobny kod `urlop_ojcowski`; FE mapuje kartę osobno | Prawo samodzielne ojca | Poradnik 2026 — „wyłączne i samodzielne prawo taty” | **CZĘŚCIOWO** (logika statusów — wymaga ponownego live przy niedostępności BE) |
| Rodzicielski: 41 tyg. (1 dziecko), 43 (więcej) | Katalog / compare operuje 41 (+ podział 32+9) | 41 / 43 tyg. | Poradnik 2026 — wymiar urlopu rodzicielskiego | **OK** (model) |
| Uzupełniający urlop macierzyński | Bez danych hospitalizacji — brak pewnego uprawnienia / 0 tygodni; z danymi — tygodnie wg progów | Tydzień za tydzień hospitalizacji; max 8 lub 15; wniosek ≥ 21 dni przed końcem macierzyńskiego; ≥ 5 dni szpitala | Poradnik 2026 — uzupełniający urlop macierzyński | **CZĘŚCIOWO** (ostrożność OK; pełna matryca progów nieprzetestowana w tej sesji) |
| Martwe urodzenie / śmierć dziecka — macierzyński | Kod + ścieżki wrażliwe w FE; kwoty/okresy zależą od BE | 8 tyg. (min. 7 dni od śmierci) przy śmierci ≤ 8 tyg. życia; potem 7 dni | Poradnik 2026 — martwe urodzenie / śmierć dziecka | **NIEZWeryfikowane** live w Etapie 3 |
| Zasiłek pogrzebowy: 7000 zł | Calculate: `7000` | 7000 zł dla członka rodziny | ZUS.pl pogrzebowy; Poradnik 2026 (martwe urodzenie → 7000 zł) | **OK** (BE) |
| Pogrzebowy: formularz Z-12, termin 12 mies. | Oczekiwane w planie/dokumentach API; Poradnik: 12 mies. od pochówku (martwe urodzenie) / od śmierci (ogólna strona ZUS) | Z-12 + rachunki; 12 miesięcy | ZUS.pl; Poradnik 2026 | **OK** / **CZĘŚCIOWO** (spójność daty „śmierć vs pochówek” — doprecyzować w BE) |
| Pracownik UoP + ubezpieczenie w dniu porodu → macierzyński | AUDYT: `likely_eligible`, plan 20 tyg. | Spełnienie podstawowego warunku ubezpieczenia chorobowego w dniu porodu | Poradnik 2026 — zasiłek macierzyński | **OK** (BE, dowód AUDYT) |
| Zleceniobiorca / DG — kwalifikacja i dokumenty | Mapowanie `zlecenie` / `dzialalnosc_gospodarcza` w FE; reguły w BE | Chorobowe często dobrowolne; DG: wniosek ZAM; Poradnik (1.04.2026) nadal wspomina też Z-3b | Poradnik 2026 — osoby niebędące pracownikami; `AGENTS.md` (Z-3b zniesione od 24.10.2026) | **ROZBIEŻNOŚĆ czasowa (źródła)** + **RYZYKO** prezentacji formularzy |
| Formularze po 24.10.2026 (ZUR/ZAO→ZAM, bez Z-3b) | FE: ZAM + ostrzeżenie w `deriveFormalities` / planie lokalnym | Aktualny wzór ZAM; nie hardkodować ZUR/ZAO/Z-3b jako obowiązujących | `AGENTS.md` §6.6 (brief produktowy); Poradnik 1.04.2026 **nie** odzwierciedla jeszcze tej zmiany | **CZĘŚCIOWO** — FE zgodny z briefem produktowym; brak PDF rozporządzenia w repo |
| Termin konkretna data vs opis | FE: data kalendarza tylko gdy `submitBy` = `YYYY-MM-DD`; inaczej radar tekstowy | Nie wymyślać dat | `CONTRACT.md` / implementacja formalności | **OK** (FE) |
| Brak danych → nie „nie przysługuje” | FE: błąd sieci / brak check ≠ not_eligible; `null` kwot ≠ 0 | Stan D / needs_review | `AGENTS.md` stany A–E; kontrakt REST | **OK** (FE) |
| Calculate macierzyński stabilność | Okresowo **HTTP 500** w tej sesji; inne kody (ojcowski, rodzicielski, pogrzebowy) OK | 200 + spójna kwota | Runtime FastAPI | **RYZYKO DEMO (BE)** |
| Dostępność BE na koniec walidacji | `localhost:8000` / Expo proxy — brak odpowiedzi | Health OK przed demo | Runtime | **RYZYKO DEMO** |

---

## 5. Rozdzielenie: błędy FastAPI vs frontend

### 5.1. FastAPI (silnik) — priorytet naprawy

| ID | Problem | Wpływ na użytkownika | Priorytet |
|----|---------|----------------------|-----------|
| **BE-1** | W `compare/urlop-rodzicielski` (i powiązanych sumach) **81,5% obejmuje 9 tyg. nieprzenoszalnych**, mimo ostrzeżenia w `warnings` | Jury / rodzic widzi **zawyżoną** kwotę „uśrednioną”; ostrzeżenie łatwo przeoczyć | **P0 — przed prezentacją** |
| **BE-2** | `POST .../calculate/zasilek_macierzynski_urlop_macierzynski` **niestabilny (500)** | Demo kalkulatora macierzyńskiego może paść na żywo | **P0 — stabilność** |
| **BE-3** | Ewentualne wskazywanie **Z-3b** jako aktualnego druku po 24.10.2026 | Konflikt z briefem konkursowym / ryzykiem dezinformacji formularza | **P0/P1** (zależnie od daty demo) |
| **BE-4** | Uproszczenie calculate rodzicielskiego (32 tyg. @ 81,5% bez jawnego modelu 9 tyg. @ 70% drugiego rodzica w tym samym wyniku) | Łatwo uznać 36 756,63 za „cały” rodzicielski | **P1** — doprecyzować pola / breakdown |
| **BE-5** | Pełna matryca eligibility (zlecenie, DG+dług, art. 30, uzupełniający, martwe urodzenie) nie domknięta live w tej sesji | Niepewność statusów `requires_verification` / braków | **P1** — regresja 9× check przed jury |

### 5.2. Frontend — priorytet naprawy

| ID | Problem | Wpływ | Priorytet |
|----|---------|-------|-----------|
| **FE-1** | Dwa źródła planu: **FastAPI formalności** + **`buildParentPlan` [Plan lokalny DEMO]** na `/sprawy` i `/plan` | Przy słabym oznaczeniu użytkownik łączy DEMO z „decyzją” silnika | **P1** — wzmocnić wizualne rozdzielenie na demo |
| **FE-2** | `/home` (Mój plan) nadal osią lokalną DEMO | Spójne z CONTRACT, ale jury może pytać „skąd te zadania?” | **P1** — baner DEMO na pierwszym ekranie planu |
| **FE-3** | FE **nie koryguje** błędnej kwoty 81,5%/9 tyg. (słusznie — nie wolno silnika w FE) | Pokazuje disclaimer w kalkulatorze — dobre, ale kwota nadal myląca | **P0 produktowo = BE-1**; FE może tylko wyżej eksponować warning API |
| **FE-4** | Brak cichego mocka eligibility/calculate w REST | Zgodne z briefem; przy padzie BE widać błąd | **OK** — nie zmieniać na mock „na pokaz” bez etykiety |

**W tej iteracji nie zmieniano logiki świadczeń** (ani FE, ani rekomendowanych patchy BE).

---

## 6. Spójność frontend ↔ backend

| Element | Ocena |
|---------|--------|
| Kwoty / statusy uprawnień | FE renderuje odpowiedź FastAPI (adapter katalogu 9× `eligibility/check`); brak lokalnego silnika kwot w REST | 
| Formalności z `plan` API | `deriveFormalitiesFromBenefits` — źródło oznaczone `[FastAPI]` |
| Checklisty lokalne | Doklejane z `buildParentPlan`, etykieta `[Plan lokalny DEMO]` |
| Kalendarz dat | Tylko ISO z API; opisy tekstowe bez fałszywej daty |
| Konflikt merytoryczny | **Główny:** poprawne ostrzeżenia FE/Poradnik o 70% na 9 tyg. vs **liczby z BE** nadal zawyżone → użytkownik widzi sprzeczność „tekst vs kwota” |

---

## 7. Gotowość konkursowa vs brief (`AGENTS.md`)

### 7.1. Co jest gotowe do pokazu (przy żywym BE)

1. Start bez rejestracji → ankieta / profil demo → lista świadczeń ze statusami A–E.  
2. Szczegóły: warunki, braki, CTA do formalności / kalkulatora.  
3. Kalkulator REST + compare (z zastrzeżeniem BE-1).  
4. Sprawy/plan z checklistą (API + DEMO).  
5. Web responsywny, baner health, jawne DEMO przy mockach dokumentów.

### 7.2. Luki istotne dla jury (nie dekoracje)

| Luka | Dlaczego ważne |
|------|----------------|
| Brak lokalnej paczki dokumentów organizatora | Nie da się podpisać „zgodność 1:1 z briefem ZUS s. 11–16” | 
| BE-1 (81,5% × 9 tyg.) | Najłatwiejszy atak merytoryczny przy pytaniu o wariant uśredniony |
| Niestabilność calculate macierzyńskiego | Scenariusz „policz zasiłek” może się wyłożyć |
| Formularze Z-3b vs ZAM (różnica Poradnik 04.2026 vs brief 10.2026) | Pytanie o aktualny druk — przygotować jedną odpowiedź opartą o datę demo |
| PDF analyze / wiedza — fallback mock | OK tylko jeśli **jawnie** DEMO |
| Brak pełnego kreatora złożenia wniosku (symulacja) | Brief P0 dopuszcza instrukcję; nie udawać wysyłki do ZUS |

---

## 8. Rekomendowana kolejność napraw (bez implementacji teraz)

1. **BE:** poprawić stawkę 9 tyg. zawsze 70% w `compare` i w breakdown `calculate`; przeliczyć sumy; zostawić warning tylko jeśli nadal coś upraszczacie.  
2. **BE:** ustabilizować `calculate` macierzyńskiego (repro 500).  
3. **BE + FE copy:** jedna ścieżka komunikatów formularzy po 24.10.2026 (ZAM).  
4. **Ops demo:** health check BE + Expo przed wejściem jury; scenariusz awaryjny z jawnym DEMO.  
5. **Walidacja uzupełniająca:** po dostarczeniu paczki PDF organizatora — ponowić tabelę z kolumną „strona briefu / załącznika”.

---

## 9. Co wolno mówić jury już teraz

**Wiarygodne (przy działającym API):**  
podstawa 13,71%/30; 20 tyg. macierzyńskiego i kwota 28 187,60 zł dla 7000 zł @ 100%; ojcowski 14 dni / 2 818,76 zł; pogrzebowy 7000 zł; struktura 41 tyg. i warunek 21 dni dla 81,5%.

**Nie wolno prezentować jako pewne bez korekty:**  
łączne kwoty wariantu 81,5% z compare, jeśli w sumie siedzi 9 tyg. drugiego rodzica policzone jak 81,5%; pełna zgodność z „załącznikiem organizatora” (pliku nie ma w repo).

---

## 10. Dowody runtime (skrót)

| Test | Wynik |
|------|-------|
| Calculate ojcowski, dochód 7000 | 14 dni, 2818.76 — OK |
| Calculate rodzicielski, full dose, 7000 | 224 dni, 81.50%, 36756.63 — arytmetyka OK, model 32 tyg. |
| Calculate pogrzebowy | 7000 — OK |
| Calculate macierzyński | wcześniej 28187.60 / 140; w Etapie 3 okresowo **500** |
| Compare 81,5% + podział rodziców | ostrzeżenie o 9 tyg. @ 70% obecne; kwoty nadal wymagają korekty BE |
| Eligibility batch (koniec sesji) | BE niedostępny — brak nowego dowodu; oparto o AUDYT (`likely_eligible`, 20 tyg.) |

---

*Koniec raportu Etapu 3. Logika świadczeń nie była zmieniana.*
