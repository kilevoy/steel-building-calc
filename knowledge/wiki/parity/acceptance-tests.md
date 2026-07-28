# Acceptance tests

Acceptance и smoke tests проверяют, что расчётный движок жив, фиксируют важные результаты и помогают не сломать расчёт при рефакторинге.

Они не заменяют инженерную экспертизу. Для инженерного принятия нужны источник, сценарий, ожидаемый результат, допуск и объяснение расхождений.

## Аудит 2026-07-28

Таргетированно пройдены 5 parity-файлов: подкрановая балка, оконные ригели,
ЛСТК-прогоны, прокатные прогоны и балочная клетка. Результат: 33 теста прошли.
Расчётные формулы и generated-файлы в ходе аудита не менялись.

## Текущий статус

- колонны: `src/calc/engine.acceptance.test.ts`;
- ферма: `src/calc/truss/engine.acceptance.test.ts`;
- прогоны ЛСТК: `src/calc/purlin/engine.acceptance.test.ts`, `src/calc/purlin/autoStep.test.ts`;
- прогоны прокатные: `src/calc/purlin/rolled.acceptance.test.ts`;
- балочная клетка / балка покрытия: `src/calc/beamCell/engine.acceptance.test.ts`;
- оконные ригели: `src/calc/windowRiegel/engine.acceptance.test.ts`;
- подкрановая балка: `src/calc/craneBeam/engine.acceptance.test.ts`;
- единая модель количества здания: `src/building/unifiedLayout.test.ts`, `src/building/unifiedBuildingInput.test.ts`, `src/building/columnCountSummary.test.ts`;
- сводные publisher/summary helpers: `src/building/*test.ts` и `src/*ResultPublisher.test.ts`;
- метаданные и публичная сборка: `src/generatedPublicMetadata.test.ts` и `scripts/check-public-bundle.mjs`.

Эти тесты не означают, что модуль полностью инженерно принят. Они фиксируют текущую сверку с Excel/generated oracle и защищают от грубой регрессии. Для результата `1 в 1` с Excel по каждому модулю нужно расширять не количество smoke-тестов, а набор конкретных сценариев с описанными входами, источником и допусками.

## Закреплённые сценарии

- `SCN-COLUMN-*`: 10 frozen-сценариев по колоннам, включая default Excel anchors.
- `SCN-TRUSS-001`: ферма Молодечно.
- `SCN-PURLINS-001/002/003`: ЛСТК/шаг/снегозадержание/ручное ограничение; прокатная ветка покрыта отдельным тестом.
- `SCN-BEAM-CELL-001/002`: сценарий с `NO_SOLUTION` и полный сценарий ВБ/ГБ/К.
- `SCN-WINDOW-RIEGEL-001/002`: два типа окна, нагрузки, расчётные длины, top-1 профили и массы.
- `SCN-CRANE-BEAM-001/002/003`: 5 т, 10 т, два крана 10 т.
- `SCN-BUILDING-COUNT-001/002/002-CRANE/003`: количество рам, внутренних/торцевых колонн и режим `hasCrane`.

## Следующий приоритет

- для оконных ригелей сопоставить top-10 выдачу с расчётными строками, чтобы безопасно добавить диагностические коэффициенты;
- для подкрановой балки решить `B19` vs `D19` по шагу рёбер и проверить связь с колонной;
- для колонн при кране подтвердить профили/длины торцевых основных колонн перед переносом правила в массу/стоимость;
- фиксировать каждое расхождение в `knowledge/wiki/parity/known-differences.md`, а не подгонять формулы без решения.
