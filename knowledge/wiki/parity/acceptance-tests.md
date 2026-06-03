# Acceptance tests

Acceptance и smoke tests проверяют, что расчётный движок жив, фиксируют важные результаты и помогают не сломать расчёт при рефакторинге.

Они не заменяют инженерную экспертизу. Для инженерного принятия нужны источник, сценарий, ожидаемый результат, допуск и объяснение расхождений.

## Текущий статус

- Есть smoke-тест для `runCalculation(DEFAULT_COLUMN_INPUT)`.
- Есть helper-тесты для общих типов и validation.
- Есть acceptance-тест `SCN-WINDOW-RIEGEL-001` для оконного ригеля: сверяются расчётные нагрузки, расчётные длины и первые наблюдаемые профили из Excel-oracle `EXCEL-005`.
- Есть acceptance-тест `SCN-BEAM-CELL-001` для балочной клетки: сверяется главная балка ГБ и фиксируется известное отсутствие решения ВБ для сценария `балка покрытия`.
- Есть тесты `SCN-BUILDING-COUNT-001`...`003` для helper `deriveUnifiedBuildingLayout`: проверяется раздельный подсчёт внутренних, торцевых и всех рамных колонн. Сценарии вынесены в `src/building/__fixtures__/building-count-scenarios.ts`.
- Требуется добавить ещё несколько smoke/acceptance-тестов для truss, purlins, beam-cell и crane-beam.
## Актуализация 2026-06-03

Старый пункт про необходимость добавить тесты для `truss`, `purlins`, `beam-cell` и `crane-beam` считается устаревшим. На текущем состоянии проекта автоматические parity/acceptance-проверки уже есть для основных расчётных модулей:

- колонны: `src/calc/engine.acceptance.test.ts`;
- ферма: `src/calc/truss/engine.acceptance.test.ts`;
- прогоны ЛСТК: `src/calc/purlin/engine.acceptance.test.ts`;
- прогоны прокатные: `src/calc/purlin/rolled.acceptance.test.ts`;
- балочная клетка / балка покрытия: `src/calc/beamCell/engine.acceptance.test.ts`;
- оконные ригели: `src/calc/windowRiegel/engine.acceptance.test.ts`;
- подкрановая балка: `src/calc/craneBeam/engine.acceptance.test.ts`;
- сводные publisher/summary helpers: `src/building/*test.ts` и `src/*ResultPublisher.test.ts`.

Эти тесты не означают, что модуль полностью инженерно принят. Они фиксируют текущую сверку с Excel/generated oracle и защищают от грубой регрессии. Для результата `1 в 1` с Excel по каждому модулю нужно расширять не количество smoke-тестов, а набор конкретных сценариев с описанными входами, источником и допусками.

Следующий приоритет:

- выбрать дополнительные Excel-сценарии для оконных ригелей и подкрановой балки;
- проверить, какие поля workbook сейчас не выведены в UI как диагностические;
- фиксировать каждое расхождение в `knowledge/wiki/parity/known-differences.md`, а не подгонять формулы без решения.
