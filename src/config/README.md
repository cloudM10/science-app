# Конфигурация приложения

Этот файл содержит централизованную конфигурацию для всего приложения.

## Структура

### Типы контента

-   `POST_CONTENT_TYPES` - массив типов контента, которые создают страницы с навигацией
-   `SLUG_CONFIG` - конфигурация для генерации URL slug'ов
-   `DATA_SOURCES` - источники данных для Gatsby
-   `BREADCRUMBS_CONFIG` - конфигурация для breadcrumbs навигации

### Навигация

-   `EDUCATIONAL_SUBMENU` - подменю для образовательных программ
-   `NAV_CONFIG` - основная структура навигации сайта

### Утилитарные функции

-   `getSlugForContentType()` - получить slug для типа контента
-   `getBreadcrumbConfig()` - получить конфигурацию breadcrumbs
-   `isPostContentType()` - проверить, является ли тип контента типом поста
-   `generateDataSourcesConfig()` - генерировать конфигурацию источников данных для Gatsby

## Использование

Импортируйте нужные конфигурации:

```javascript
import { NAV_CONFIG, EDUCATIONAL_SUBMENU } from "../config/app-configuration";
```

## Файлы, использующие эту конфигурацию

-   `gatsby-config.js` - источники данных
-   `gatsby-node.js` - генерация страниц и slug'ов
-   `src/components/navbar.js` - навигационное меню
-   `src/components/breadcrumbs.js` - навигационные крошки
