// ===================================================
// ЦЕНТРАЛЬНАЯ КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// ===================================================

// Типы контента для создания страниц с навигацией
export const POST_CONTENT_TYPES = [
    "news",
    "applicants",
    "bachelors",
    "masters",
    "collaboration",
    "academic-integrity",
    "educational-work",
    "internships",
    "research-work",
    "conferences",
    "material-technical-support",
];

// Конфигурация для генерации slug
export const SLUG_CONFIG = {
    pages: "", // pages имеют особый случай - без префикса
    "quick-access-links": "/quick-access-links",
    news: "/news",
    team: "/team",
    applicants: "/applicants",
    bachelors: "/bachelors",
    masters: "/masters",
    surveys: "/surveys",
    collaboration: "/collaboration",
    resources: "/resources",
    "academic-integrity": "/academic-integrity",
    "academic-mobility": "/academic-mobility",
    "educational-work": "/educational-work",
    internships: "/internships",
    "research-work": "/research-work",
    conferences: "/conferences",
    "material-technical-support": "/material-technical-support",
    contacts: "/contacts",
};

// Автоматически генерируемые источники данных для Gatsby
export const DATA_SOURCES = [
    { name: "media", path: "static/media" },
    { name: "pages", path: "content/pages" },
    { name: "quick-access-links", path: "content/quick-access-links" },
    { name: "news", path: "content/news" },
    { name: "team", path: "content/team" },
    { name: "applicants", path: "content/applicants" },
    { name: "bachelors", path: "content/bachelors" },
    { name: "masters", path: "content/masters" },
    { name: "collaboration", path: "content/collaboration" },
    { name: "academic-integrity", path: "content/academic-integrity" },
    { name: "educational-work", path: "content/educational-work" },
    { name: "internships", path: "content/internships" },
    { name: "surveys", path: "content/surveys" },
    { name: "resources", path: "content/resources" },
    { name: "academic-mobility", path: "content/academic-mobility" },
    { name: "research-work", path: "content/research-work" },
    { name: "conferences", path: "content/conferences" },
    {
        name: "material-technical-support",
        path: "content/material-technical-support",
    },
    { name: "contacts", path: "content/contacts" },
];

// Конфигурация для breadcrumbs
export const BREADCRUMBS_CONFIG = {
    news: { path: "/news", label: "Новини" },
    applicants: { path: "/applicants", label: "Абітурієнти" },
    bachelors: { path: "/bachelors", label: "Бакалаври" },
    masters: { path: "/masters", label: "Магістри" },
    collaboration: { path: "/collaboration", label: "Співпраця" },
    "academic-integrity": {
        path: "/academic-integrity",
        label: "Академічна доброчесність",
    },
    "educational-work": {
        path: "/educational-work",
        label: "Виховна робота",
    },
    team: { path: "/team", label: "Команда" },
    surveys: { path: "/surveys", label: "Опитування" },
    resources: { path: "/resources", label: "Ресурси" },
    "academic-mobility": {
        path: "/academic-mobility",
        label: "Академічна мобільність",
    },
    "quick-access-links": {
        path: "/quick-access-links",
        label: "Швидкі посилання",
    },
    internships: { path: "/internships", label: "Практична підготовка" },
    "research-work": {
        path: "/research-work",
        label: "Науково-дослідна робота",
    },
    conferences: { path: "/conferences", label: "Конференції" },
    "material-technical-support": {
        path: "/material-technical-support",
        label: "Матеріально-технічне забезпечення",
    },
};

// ===================================================
// КОНФИГУРАЦИЯ НАВИГАЦИИ
// ===================================================

// Конфигурация элементов подменю для образовательных программ
export const EDUCATIONAL_SUBMENU = [
    { label: "Освітня програма", path: "/educational-program" },
    { label: "Освітні компоненти", path: "/educational-components" },
    { label: "Гостьові лекції", path: "/guest-lectures" },
];

// Основная структура навигации
export const NAV_CONFIG = [
    { label: "Головна", path: "/" },
    { label: "Новини", path: "/news" },
    { label: "Наша команда", path: "/team" },
    { label: "Абітурієнту", path: "/applicants" },
    {
        label: "Бакалаври",
        path: "/bachelors",
        hasSubmenu: true,
        submenuBase: "/bachelors",
    },
    {
        label: "Магістри",
        path: "/masters",
        hasSubmenu: true,
        submenuBase: "/masters",
    },
    {
        label: "Доктори філософії",
        path: "https://133phd.dsau.dp.ua/",
        isExternal: true,
    },
    { label: "Анкетування", path: "/surveys" },
    { label: "Співпраця", path: "/collaboration" },
    { label: "Інформаційні ресурси", path: "/resources" },
    { label: "Академічна доброчесність", path: "/academic-integrity" },
    { label: "Академічна мобільність", path: "/academic-mobility" },
    { label: "Виховна робота", path: "/educational-work" },
    { label: "Практична підготовка", path: "/internships" },
    { label: "Науково-дослідна робота", path: "/research-work" },
    { label: "Конференції", path: "/conferences" },
    {
        label: "Матеріально-технічне забезпечення",
        path: "/material-technical-support",
    },
    { label: "Контакти", path: "/contacts" },
];

// ===================================================
// УТИЛИТАРНЫЕ ФУНКЦИИ
// ===================================================

// Функция для получения конфигурации slug по типу контента
export const getSlugForContentType = (contentType) => {
    return SLUG_CONFIG[contentType] || `/${contentType}`;
};

// Функция для получения конфигурации breadcrumbs по типу контента
export const getBreadcrumbConfig = (contentType) => {
    return BREADCRUMBS_CONFIG[contentType] || null;
};

// Функция для проверки, является ли тип контента типом поста
export const isPostContentType = (contentType) => {
    return POST_CONTENT_TYPES.includes(contentType);
};
