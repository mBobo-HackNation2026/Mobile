# KALKULATOR_UI_POLISH — Etap 5

**Gałąź:** `feature/ebobo-frontend-mvp`  
**Commit Etapu 4 (zabezpieczenie):** `be59269`  
**Commit Etapu 5 (ten polish):** *patrz `git rev-parse --short HEAD` po commicie poniżej*  
**Zakres:** wyłącznie UI/UX kalkulatora — **bez** zmiany logiki obliczeń, uprawnień ani kontraktu API.

---

## 1. Opis zmian wizualnych

Ekran `/calculator` ma cztery sekcje:

| Sekcja | Zawartość |
|--------|-----------|
| **A. Twoje dane** | Formularz: wybór świadczenia, dochód, etat, „Za życiem”, wariant 81,5% vs 100%/70%, CTA „Policz” |
| **B. Twoje świadczenie** | Hero z dużą kwotą (`display`), nazwą, chipami Okres/Stawka, badge szacunek / wymaga weryfikacji / empty / loading |
| **C. Porównanie wariantów** | Formularz dochodu 2. rodzica + karty wariantów z prostym paskiem podziału tygodni + osobny blok 9 tyg. @ 70% |
| **D. Szczegóły obliczenia** | Rozwijany panel: podstawa wymiaru, breakdown stawek, `rules_version`, ostrzeżenia API |

Dodatkowo:

- Desktop (≥2 kolumny): A | B obok siebie, C i D na pełną szerokość.
- Mobile: stos A → B → C → D.
- Stany error z jasnym panelem i „Spróbuj ponownie” (bez fikcyjnych kwot).
- Zachowane: `ApiHealthBanner`, disclaimer DEMO, oznaczanie niezweryfikowanych kwot z ostrzeżeń API.

---

## 2. Zmienione / nowe komponenty

| Plik | Rola |
|------|------|
| `src/features/calculator/CalculatorScreen.tsx` | Orkiestracja A–D (logika mutacji bez zmian semantycznych) |
| `src/features/calculator/CalculatorPanels.tsx` | **Nowy** — Section, Hero, Compare, Details, ErrorPanel |
| `src/features/calculator/calculatorFormat.ts` | **Nowy** — formatowanie kwot/okresów (prezentacja, nie reguły prawne) |
| `docs/kalkulator-ui/*` | Zrzuty przed/po |
| `KALKULATOR_UI_POLISH.md` | Ten raport |

Nie zmieniano innych ekranów ani współdzielonych komponentów UI poza użyciem istniejących `Card` / `Button` / `Badge` / `TextField` / `ChoiceChip`.

---

## 3. Zrzuty przed i po

Katalog: `docs/kalkulator-ui/`

| Plik | Opis |
|------|------|
| `before-desktop.png` | Stan przed Etapem 5 (lista + banery, brak sekcji A–D) |
| `after-desktop-1440.png` | Po — layout 1440 px, sekcja A |
| `after-form-1440.png` / `after-success-1440.png` | Po — formularz / wynik (desktop) |
| `after-mobile-390.png` | Po — mobile 390 px (empty / start) |
| `after-mobile-success-390.png` | Po — mobile z hero **28 187,60 zł**, 140 dni, 100% |

---

## 4. Wyniki testów

| Test | Wynik |
|------|-------|
| `npm run typecheck` | **PASS** |
| `npm run test:regression` | **PASS** |
| `npm run export:web` | **PASS** → `dist/` |
| Visual 390 / 1440 | **PASS** — sekcje czytelne, kwota nie ucięta na mobile success |
| Loading | Przycisk „Liczymy…” + hero loading |
| Empty | Placeholder „Twoje świadczenie pojawi się tutaj” |
| Success | Live: rodzicielski 31 570,11 zł; macierzyński 28 187,60 zł |
| Error + retry | Zachowane (`CalculatorErrorPanel`); w tej sesji macierzyński chwilowo działał — FE nadal obsługuje 500 |

Pozostałe ekrany (nawigacja Plan / Świadczenia / Sprawy) bez zmian kodu — smoke nawigacji w przeglądarce OK.

---

## 5. Pozostałe problemy

1. **Banery health/DEMO** nadal zajmują sporo miejsca nad sekcją A (świadomie — demo jury); ewentualne spięcie w P1.
2. **Chip-y świadczeń** skracają długie nazwy (`…`) — czytelność vs pełna nazwa w hero po policzeniu.
3. **Compare** nadal zależy od stabilności FastAPI; UI gotowe, gdy API odpowie.
4. Szerokości 375 / 768 nie miały osobnych plików PNG; 390 i 1440 pokrywają mobile i desktop; układ responsywny oparty o `useAdaptiveLayout`.

---

## 6. Numer commita

- Etap 4 secured: **`be59269`**
- Etap 5 UI polish: **zostanie uzupełniony przy commicie** (`style: polish calculator UI…`)
