# Crane Beam

Модуль подкрановой балки связан с тяжёлыми workbook/generated-данными и должен загружаться лениво.

Важно сохранить dynamic import расчётного engine, чтобы workbook generated-файлы не попадали в стартовый chunk. При изменениях проверять build output и отсутствие статического импорта тяжёлого engine.
