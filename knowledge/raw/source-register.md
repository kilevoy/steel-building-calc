# Реестр источников

Этот файл фиксирует Excel, КМ-проекты, PDF, скриншоты и другие материалы, которые используются как источники анализа.

| ID источника | Тип | Название файла/проекта | Где хранится | Статус | Используется для | Примечания |
|---|---|---|---|---|---|---|
| EXCEL-001 | Excel oracle | VELICAN workbook | local only | ожидает добавления | сверка расчётов | не коммитить без проверки прав |
| EXCEL-002 | Excel oracle | Column calculation workbook | local only | ожидает добавления | сверка расчёта колонн | добавить после отбора файла |
| EXCEL-003 | Excel oracle | Truss calculation workbook | local only | ожидает добавления | сверка расчёта фермы | добавить после отбора файла |
| EXCEL-004 | Excel oracle | Purlins calculation workbook | local only | ожидает добавления | сверка расчёта прогонов | добавить после отбора файла |
| EXCEL-005 | Excel oracle | Подбор оконых ригелей v2.0.xlsx | knowledge/raw/excel/window-riegel/ | структура описана | сверка расчёта оконных ригелей | файл не коммитится, защищён knowledge/raw/.gitignore; см. knowledge/wiki/parity/excel-005-window-riegel.md |
| EXCEL-006 | Excel oracle | подбор прокатной подкрановой балки v2.0.xlsx | knowledge/raw/excel/crane-beam/ | структура описана | сверка расчёта подкрановой балки | файл не коммитится, защищён knowledge/raw/.gitignore; см. knowledge/wiki/parity/excel-006-crane-beam.md |
| EXCEL-007 | Excel oracle | Подбор элементов балочной клетки v3.1.xlsx | knowledge/raw/excel/beam-cell/ | структура описана | сверка расчёта балки покрытия / балочной клетки | файл не коммитится, защищён knowledge/raw/.gitignore; см. knowledge/wiki/parity/excel-007-beam-cell.md |
| EXCEL-008 | Excel oracle | Калькулятор ферм типа Молодечно v1.0.xlsx | knowledge/raw/excel/truss/ | структура описана | сверка расчёта фермы | файл не коммитится, защищён knowledge/raw/.gitignore; см. knowledge/wiki/parity/excel-008-truss.md |
| EXCEL-009 | Excel oracle | Общий калькулятор прогонов v2.0.xlsx | knowledge/raw/excel/purlins/ | структура описана | сверка расчёта прогонов | файл не коммитится, защищён knowledge/raw/.gitignore; см. knowledge/wiki/parity/excel-009-purlins.md |
| EXCEL-010 | Excel oracle | Калькулятор подбора колонн v6.1исх11111.xlsx | knowledge/raw/excel/column/ | структура описана | сверка расчёта колонн | файл не коммитится, защищён knowledge/raw/.gitignore; см. knowledge/wiki/parity/excel-010-column.md |
| KM-001 | КМ project | Example steel building project | local only | ожидает добавления | проверка практических решений | использовать только обезличенно |
| KM-002 | КМ project | КМ1.pdf | knowledge/raw/km-projects/drawings/ | добавлен локально | проверка практических решений и состава КМ | файл не коммитится, защищён knowledge/raw/.gitignore |
| KM-003 | КМ project | KM.pdf | knowledge/raw/km-projects/drawings/ | добавлен локально | проверка практических решений и состава КМ | файл не коммитится, защищён knowledge/raw/.gitignore |
| NORM-001 | Normative document | СП / ГОСТ / нормативный источник | local only | ожидает добавления | проверка методики | проверить право хранения |
| GH-001 | GitHub repository | colonna | https://github.com/kilevoy/colonna.git | reference | историческая логика здания, колонн, ферм и балок | использовать как источник контекста, не как безусловный oracle |
| GH-002 | GitHub repository | climate-sp-atlas | https://github.com/kilevoy/climate-sp-atlas.git | reference | климатические данные и подходы к климатическому справочнику | проверять применимость к текущей структуре lazy loading |
| GH-003 | GitHub repository | insi-next | https://github.com/kilevoy/insi-next.git | reference | UI/предметный контекст и возможные смежные решения | не переносить код без проверки лицензии и применимости |
| GH-004 | GitHub repository | VELICAN | https://github.com/kilevoy/VELICAN.git | reference / oracle candidate | исторический VELICAN-контекст и возможные эталонные сценарии | использовать как oracle только для явно выбранных и проверенных сценариев |

Правила:

- каждый источник должен иметь ID;
- ID источника нужно использовать в wiki-страницах и заметках;
- если источник конфиденциальный, в Git хранить только описание и обезличенные выдержки;
- если из источника извлечены тестовые данные, они должны быть описаны отдельно.
