# Калькулятор стального каркаса промышленных зданий

[![CI](https://github.com/kilevoy/steel-building-calc/actions/workflows/ci.yml/badge.svg)](https://github.com/kilevoy/steel-building-calc/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/kilevoy/steel-building-calc/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/kilevoy/steel-building-calc/actions/workflows/deploy-pages.yml)

Веб-калькулятор для подбора оптимальных стальных конструкций промышленных зданий по СП 16.13330 / СП 20.13330. 7 вкладок, общий контекст здания, автопередача нагрузок, сверка с исходными Excel-калькуляторами.

**Демо:** https://kilevoy.github.io/steel-building-calc/

## Что умеет

| Вкладка | Что подбирает | Источник истины |
|---|---|---|
| Колонна | Стальной профиль колонны (крайней / средней / фахверковой) | Excel «Калькулятор колонн v6.1» |
| Ферма | Профили ВП, НП, ОРб, ОР, РР для фермы Молодечно | Excel «Фермы Молодечно v1.0» |
| Прогоны | Прокатные прогоны и ЛСТК (МП350, МП390, 2ТПС / 2ПС / Z) | Excel «Общий калькулятор прогонов v2.0» |
| Балка покрытия | ВБ, ГБ, колонны балочной клетки | Excel «Балочная клетка v3.1» |
| Оконные ригели | Нижний и верхний ригель | Excel «Оконные ригели v2.0» |
| Подкрановая балка | Профиль ПБ с проверками по СП 16.13330 | Excel «Подкрановая балка v2.0» |
| Сводка | Общая масса и стоимость каркаса | — |

Внутри:
- 208 профилей × 4 марки стали (С255Б, С355Б, С245, С345) × 0–4 распорки = 2080 вариантов на одну колонну.
- Полные проверки СП 16.13330: σ, σ устойчивость X/Y, гибкость X/Y; для фермы — формулы 7, 44, 106, 109, 120.
- Нагрузки СП 20.13330: снег, ветер с k(zₑ), ζ(zₑ), ν(ρ,χ) для местности A/B/C, кровля, ограждения.
- Автозаполнение w₀ / Sg по 1096 населённым пунктам РФ (lazy-загрузка).
- Общий `BuildingContext`: пролёт, длина, высота, шаг рам, ветер, снег, тип местности, цены — синхронизированы между всеми вкладками.
- Автопередача собственного веса прогонов и балок покрытия в нагрузку на колонны.
- Подсчёт элементов здания (рамы, крайние / средние / торцевые колонны, фахверк) с учётом ГИП-правила для колонн с краном.

## Стек

- **Frontend:** Vite 5 + React 18 + TypeScript 5 (strict).
- **Тесты:** Vitest 4 — 58 тестов в 11 файлах, включая 10 acceptance-сценариев из Excel-оракула.
- **Линт:** ESLint 10 + typescript-eslint 8.
- **CI:** GitHub Actions — typecheck → lint → test → build на каждый push и PR.
- **Pre-commit / pre-push:** Husky + lint-staged. Pre-push прогоняет typecheck и тесты, не даёт уйти красному коду на сервер.
- **Деплой:** статичный фронтенд на GitHub Pages, без бэкенда.

## Локальный запуск

```bash
git clone https://github.com/kilevoy/steel-building-calc.git
cd steel-building-calc
npm ci          # ставит зависимости и активирует git-хуки
npm run dev     # dev-сервер на localhost:5173
npm run build   # production-сборка в dist/
npm test        # 58 тестов, ~5 секунд
```

> **Важно:** не размещай рабочий клон в синхронизирующихся облаках (Google Drive, Dropbox, OneDrive). Они засоряют `.git/` своими служебными файлами и ломают git. Источник синхронизации между машинами — сам GitHub.

## Сверка с Excel

Каждый расчётный модуль воспроизводит формулы исходного Excel-калькулятора 1-в-1. Доказательная цепочка:

1. **`scripts/verify_baseline.py`** — Python-перевод формул колонной вкладки. Проверен на default-сценарии (N=63.79 кН, M=143.90 кН·м) против Excel.
2. **`scripts/excel_oracle.py`** — пересчитывает исходный xlsx через LibreOffice для 10 разных сценариев и сохраняет ground-truth в JSON. Все 10 совпадают с Python-переводом и Excel с **0.00 % расхождением** по N и M.
3. **`scripts/freeze_column_fixtures.py`** — замораживает результаты Python-перевода в фикстуру `src/calc/__fixtures__/column-scenarios.json`, которую читают TypeScript acceptance-тесты в CI.
4. **`src/calc/*/engine.acceptance.test.ts`** — Vitest-тесты по фикстурам. Регрессия в формуле или Excel-параметре ловится в CI на следующем же push.

Покрытые модули: колонна (10 сценариев), ферма (8 проверок), прогоны (ЛСТК-сторона), балка покрытия, оконные ригели, подкрановая балка.

## Структура

```
src/
  App.tsx                     роутер табов и общий ErrorBoundary
  main.tsx                    точка входа React + провайдеры
  building/                   общий BuildingContext, layout, автопередача нагрузок
    layout.ts                 подсчёт колонн / рам с учётом торцевых рам и крана
    unifiedLayout.ts          единый layout для Сводки
    loadPropagation.ts        авто-нагрузки от прогонов и балок покрытия
    PricesBlock.tsx           синхронные цены сталей
    SyncedField.tsx           поля, пишущие сразу в общий контекст
  calc/                       расчётные движки (формулы и проверки)
    engine.ts                 колонна — главный расчёт
    wind.ts                   ветер по СП 20.13330
    steel.ts                  Ry для марок стали
    cranes.ts                 каталог кранов и правила ГИП
    truss/                    ферма Молодечно
    purlin/                   прогоны (ЛСТК + прокатные)
    beamCell/                 балка покрытия
    craneBeam/                подкрановая балка (HyperFormula)
    windowRiegel/             оконные ригели
    __fixtures__/             замороженные ground-truth сценарии
  columnTab/                  UI колонной вкладки
    ColumnApp.tsx             оркестратор state и эффектов
    GeometrySection.tsx       геометрия здания
    LoadsSection.tsx          ветер, снег, кровля, ограждение
    EconomySection.tsx        μ, надбавка
    CranesSection.tsx         опорный и подвесной краны
    ResultsView.tsx           таблица подобранных профилей
    CityCombobox.tsx          поиск города с автозаполнением w₀ / Sg
  components/
    form/                     общие form-компоненты (Field, Select, Check, ReadOnly, Stat)
    BuildingSummaryBanner.tsx общая шапка с параметрами здания
    ErrorBoundary.tsx         per-tab boundary, не сносит соседние вкладки
  data/
    profiles/profiles.json    208 профилей (A, Ix, Wx, ix, Iy, Wy, iy, mass)
    cranes/cranes.json        каталог опорных кранов
    truss/                    трубы для ферм + таблица φₑ + единичные эпюры
    purlin/, lstk/            прокатные прогоны и профили МП350 / МП390
    structures/               кровельные и стеновые конструкции
    climate/, regions/        климатика 1096 НП (lazy)
  defaults/                   дефолты, совпадающие с Excel-default
  services/                   асинхронный поиск города по климатике
  utils/                      валидация числовых входов
  types/                      общие типы (climate, common)
scripts/
  verify_baseline.py          Python-перевод колонны
  excel_oracle.py             ground-truth из Excel через LibreOffice
  compare_scenarios.py        regression sanity-check Excel ↔ Python
  freeze_column_fixtures.py   фикстура для TS-acceptance-тестов
  verify_*.ts                 ручные сверки прочих модулей
knowledge/                    инженерная память: правила, wiki, журнал, lint
```

## Разработка

- Перед изменением расчётной формулы прочитай `knowledge/AGENTS.md` и страницу модуля в `knowledge/wiki/modules/`.
- Любое изменение формулы фиксируется в `knowledge/log.md` со ссылкой на источник (Excel / СП / КМ-проект).
- Расхождения с Excel и открытые инженерные вопросы — в `knowledge/lint.md`.
- Generated-файлы (`*.generated.ts`, `workbook.generated.ts`) править вручную нельзя — они создаются скриптами из исходных Excel.
- Климатика (1096 НП) грузится lazy через `services/settlements.ts` и не должна попадать в стартовый бандл.

## Лицензия

Внутренний инструмент. Исходные Excel-калькуляторы и КМ-проекты не коммитятся в публичный репозиторий — в `knowledge/raw/` лежат только их обезличенные описания.
