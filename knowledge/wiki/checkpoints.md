# Checkpoints

## `af71297694a8b3e8a2f54c413ae980efafe861cf`

Сообщение: `optimize startup bundle and improve calculation tests`.

Содержит lazy loading climate data, async city search/selection, `DEFAULT_COLUMN_INPUT`, smoke test для `runCalculation(DEFAULT_COLUMN_INPUT)`, улучшения ErrorBoundary и безопасную зачистку ESLint warnings.

## `0b65218d5b135821f38ca643e08bfa8a67f1148f`

Сообщение: `clean up react refresh exports`.

Состояние: 0 ESLint warnings, 7 tests pass, startup chunk около 226 kB / 67 kB gzip, ErrorBoundary имеет `error.message` и кнопку `Попробовать снова`, ручной UI smoke-test GitHub Pages принят.
