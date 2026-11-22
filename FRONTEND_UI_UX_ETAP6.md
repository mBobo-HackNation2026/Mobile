# FRONTEND_UI_UX_ETAP6

**Gałąź:** `feature/ebobo-frontend-mvp`  
**Bazowy commit:** `d9fa59f`  
**Zakres:** polish UI/UX (bez zmian logiki API / eligibility / kalkulatora)

---

## 1. Audyt wizualny (przed)

| Ekran | Stan przed Etapem 6 |
|-------|---------------------|
| Kalkulator | Już dopracowany (Etap 5) — wzorzec sekcji A–D, hero kwoty |
| Mój plan `/home` | Płaska karta etapu + długa lista zadań; brak hierarchii „co teraz” |
| Moje sprawy | Przyciski nawigacji, mało spójne z kalkulatorem |
| Świadczenia | Karty OK, ale bez wspólnego `AppSection` / quick actions |
| Welcome / onboarding | Działa; brak jasnej ścieżki „→ Mój plan” |

Wzorce z kalkulatora: numerowane sekcje, miękkie karty hero (`primarySoft`), badge statusów, czytelne CTA.

---

## 2. Opis zmian na ekranach

### Mój plan (P0) — dashboard

Sekcje:

- **A Twój etap** — hero z etapem, progressem, paskiem postępu  
- **B Najważniejsze teraz** — pierwsza otwarta czynność (`now` / `required`) + CTA  
- **C Twój plan działania** — dotychczasowa checklista / bucket’y (logika bez zmian)  
- **D Nadchodzące terminy** — `nextDeadline` + lista z datą lub `windowLabel` (bez sztucznych dat)  
- **E Twoje świadczenia** — teaser → hub + kalkulator  
- **F Szybkie działania** — `QuickActionRow`

### Moje sprawy / plan filtrów

- `AppSection` + `QuickActionRow`  
- Wyraźniejsze źródło terminu (silnik vs DEMO)  
- Checklista / merge bez zmian logiki  

### Świadczenia

- Sekcje grup statusów przez `AppSection`  
- Wyjaśnienie `needs_review` / weryfikacji  
- Quick actions do planu / spraw / kalkulatora  

### Welcome + onboarding

- Ścieżka użytkownika na welcome  
- CTA „Przejdź do Mój plan” po ukończeniu ankiety  
- Badge kroku w onboarding (bez zmiany schematu / API)

### Kalkulator

- **Bez regresji** (Etap 5 nienaruszony funkcjonalnie)

---

## 3. Wspólne komponenty

| Komponent | Plik |
|-----------|------|
| `AppSection` | `src/components/ui/AppSection.tsx` |
| `QuickActionRow` | `src/components/ui/QuickActionRow.tsx` |
| Istniejące | `Card`, `Badge`, `Button`, `DemoBanner`, `ApiHealthBanner`, `Screen` |

---

## 4. Zrzuty ekranu

Katalog: `docs/ui-etap6/`

| Plik | Opis |
|------|------|
| `before-home.png` | Mój plan przed |
| `after-home.png` | Dashboard A–F |
| `after-sprawy.png` | Sprawy po polishu |
| `after-benefits.png` | Świadczenia po polishu |

---

## 5. Wyniki testów

| Test | Wynik |
|------|-------|
| `npm run typecheck` | PASS |
| `npm run test:regression` | PASS (merge checklisty OK) |
| `npm run export:web` | PASS |
| Nawigacja home → sprawy → świadczenia → kalkulator | Smoke OK |
| Regresja pustej checklisty | Nie wróciła |

---

## 6. Zmienione pliki

- `src/components/ui/AppSection.tsx` *(nowy)*
- `src/components/ui/QuickActionRow.tsx` *(nowy)*
- `src/features/plan/MyPlanScreen.tsx`
- `src/app/(main)/sprawy.tsx`
- `src/app/(main)/plan.tsx`
- `src/features/benefits/BenefitsHubScreen.tsx`
- `src/app/welcome.tsx`
- `src/features/onboarding/OnboardingWizard.tsx`
- `docs/ui-etap6/*`
- `FRONTEND_UI_UX_ETAP6.md`

---

## 7. Nierozwiązane problemy / dalsze

1. Banery health/DEMO nadal zajmują dużo miejsca nad treścią (świadomie pod jury).  
2. Szczegóły świadczenia (`BenefitDetailScreen`) — lżejszy polish możliwy w kolejnej iteracji.  
3. Sidebar bez etykiet tekstowych na collapsowanym medium — bez zmiany tras.  
4. Pełne zrzuty 375/768 nie osobno; pokryto desktop + smoke mobile layoutem flex.

---

## 8. Numery commitów

Uzupełnione po `git commit` (patrz historia gałęzi względem `d9fa59f`).
