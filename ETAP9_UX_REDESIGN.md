# ETAP 9 — UX Redesign eBobo

**Data:** 2026-11-22  
**Gałąź:** `feature/ebobo-frontend-mvp`  
**Bazowy tip:** `da341b0`  
**Commit(y) Etapu 9:** eb82f17

---

## 1. Problemy UX przed zmianami

| Problem | Objaw |
|---|---|
| Niejasne role ekranów | „Mój Plan”, „Moje Sprawy” i `/plan` (checklista z filtrami) powielały te same zadania i skróty |
| Przeładowany dashboard | Sekcje A–F + pełna checklista na `/home` — zbyt długi ekran, równa konkurencja o uwagę |
| Nawigacja vs brief | Dolne menu: Plan / Kalendarz / Świadczenia / Mapa / Profil — brak Spraw i Kalkulatora |
| Techniczny język | „Połączenie z silnikiem: OK”, TLS/proxy w banerach, FastAPI w copy |
| Świadczenia | Karty z headline + summary + ostrzeżenia + podwójne CTA |
| Szczegóły świadczenia | Wszystkie warunki i procedura od razu na wierzchu |
| Duplikacja skrótów | QuickActionRow na planie, sprawach i świadczeniach |

Zrzuty „przed”: `docs/etap9/before/` (stan Etapu 8).

---

## 2. Nowa hierarchia informacji

**Plan** — Co zrobić teraz? (sytuacja → jedno zadanie → terminy → skróty)  
**Sprawy** — Co mam do załatwienia? (checklista + opcjonalny radar)  
**Świadczenia** — Co może mi przysługiwać? (krótka karta → szczegóły → warunki/procedura)  
**Kalkulator** — Ile mogę otrzymać?  
**Profil** — dane i dostęp do mapy/kalendarza/demo

Kalendarz i mapa: menu skrótów / Profil (trasy bez zmian).  
`/plan` (filtry): zachowane, link „Filtry →” ze Spraw.

---

## 3. Zmiany na ekranach

### Nawigacja
- Dolne / boczne menu: **Plan · Sprawy · Świadczenia · Kalkulator · Profil**

### Mój Plan
- Usunięto etykiety A–F i pełną checklistę z dashboardu
- Hierarchia: sytuacja → **Co teraz?** → terminy → **Co jeszcze?**
- Postęp jako kompaktowy pasek `zrobione/łącznie`

### Moje Sprawy
- Checklista na pierwszym planie + liczniki statusów
- Radar / terminy / dokumenty za „Pokaż terminy i radar”
- Statusy: Do zrobienia / W trakcie / Zakończone

### Świadczenia
- Krótsze etykiety statusów („Może Cię dotyczyć”, „Do weryfikacji”…)
- Karta: status + tytuł + 2 linie + jedno CTA + link do szczegółów
- Szczegóły: progressive disclosure (warunki, procedura, źródła)

### Welcome / onboarding / kalkulator
- Mniej tekstu technicznego i footerowych linków jury
- Krótszy lead ankiety
- Kalkulator: tytuł „Kalkulator”, mniej „FastAPI” w subtitle

### Banery
- Stan health **OK** nie zajmuje miejsca (return null)
- Błąd API: komunikat użytkowy, bez raw TLS/proxy

---

## 4. Zrzuty przed / po

| Przed | Po |
|---|---|
| `docs/etap9/before/moj-plan-before.png` | `docs/etap9/after/moj-plan-390.png` |
| `docs/etap9/before/sprawy-before.png` | `docs/etap9/after/sprawy-390.png` |
| `docs/etap9/before/benefits-before.png` | `docs/etap9/after/benefits-390.png` |
| `docs/etap9/before/welcome-390.png` | (welcome — skrócony footer) |
| `docs/etap9/before/calculator-error-no-fake-amount.png` | `docs/etap9/after/calculator-1440.png` (nowe menu) |

---

## 5. Wspólne komponenty

`Screen`, `Card`, `Badge`, `Button`, `DemoBanner`, `ApiHealthBanner`, `QuickActionRow`, `ChecklistList`, `LegalDisclaimer`, `mainNavItems` / `BottomNav` / `Sidebar`.

---

## 6. Wyniki testów

| Test | Wynik |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test:regression` | PASS |
| `npm run export:web` | PASS |
| Web 390 / 1440 + nawigacja S1 | PASS (smoke) |
| Android / iOS | Nie testowano |

Uwaga: FastAPI / ngrok bywał niestabilny w trakcie sesji — błędy pokazywane bez fikcyjnych kwot.

---

## 7. Zmienione pliki

- `src/components/layout/navItems.ts`
- `src/components/ui/ApiHealthBanner.tsx`
- `src/features/plan/MyPlanScreen.tsx`
- `src/app/(main)/sprawy.tsx`
- `src/features/benefits/BenefitsHubScreen.tsx`
- `src/features/benefits/BenefitDetailScreen.tsx`
- `src/features/checklist/ChecklistList.tsx`
- `src/features/checklist/labels.ts`
- `src/types/benefits.ts`
- `src/app/welcome.tsx`
- `src/features/onboarding/OnboardingWizard.tsx`
- `src/features/calculator/CalculatorScreen.tsx`
- `docs/etap9/**`
- `ETAP9_UX_REDESIGN.md`

---

## 8. Pozostałe problemy

- Przy awarii API nadal dwa komunikaty (health + empty state) na świadczeniach — świadome rozróżnienie usługa vs żądanie; można jeszcze scalić wizualnie.
- Checklista nadal używa „Krok N” — czytelne, ale lekko „proceduralne”.
- Pełne wyniki eligibility zależą od dostępności BE (osobny agent).
- Kalendarz/mapa nie są w primary nav — dostęp przez „Więcej”.

---

## 9. Numery commitów

Uzupełnij po `git commit` Etapu 9 (patrz log gałęzi).
