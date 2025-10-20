import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
*,
*::before,
*::after {
  box-sizing: border-box;
}

body,
h1,
h2,
h3,
h4,
p,
figure,
blockquote,
dl,
dd {
  margin: 0;
}

ul[role='list'],
ol[role='list'] {
  list-style: none;
}

html:focus-within {
  scroll-behavior: smooth;
}

html {
  height: -webkit-fill-available;
}

body {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  text-rendering: optimizeSpeed;
  line-height: 1.5;
}

a:not([class]) {
  text-decoration-skip-ink: auto;
}

img,
picture {
  max-width: 100%;
  display: block;
}

input,
button,
textarea,
select {
  font: inherit;
}

@media (prefers-reduced-motion: reduce) {
  html:focus-within {
   scroll-behavior: auto;
  }
  
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

html {
  width:100vw;
  overflow-x:hidden;
}

body::-webkit-scrollbar {
    width: 10px;
}

body::-webkit-scrollbar-thumb {
  background-color: rgba(55, 41, 44, .4);
}

body::-webkit-scrollbar-track {
    background: transparent;
}

:root {
  scroll-behavior: smooth;
  --size-100: 0.5rem;
  --size-200: 0.67rem;
  --size-300: 0.75rem;
  --size-400: 1rem;
  --size-450: 1.11rem;
  --size-500: 1.33rem;
  --size-550: 1.5rem;
  --size-600: 1.77rem;
  --size-700: 2.36rem;
  --size-800: 3.15rem;
  --size-900: 4.2rem;
    
    --color-text: #37292C;
    --color-text-secondary: #555555;
    --color-text-inverse: #ffffff;
    --color-text-placeholder: #aaaaaa;
    
    --color-primary: #ff6f61;
  --color-primary-hover: #ff6f61;
    --color-secondary: #4a90e2;
    --color-accent: #50e3c2;
    
    --color-background: #ccdcfbff;
    --color-background-secondary: #f9f9f9;
    --color-background-inverse: #252526;
  
    --color-border: #e0e0e0;
}

body {
  font-family: 'Roboto Condensed', -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue,
    helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif;
  transition-property: background-color, color, background;
  transition-duration: 0.3s;
  transition-timing-function: ease-out;
  background-attachment: fixed;
  font-smoothing: antialiased;
  /* Стили по умолчанию для light mode */
  color: #37292C;
  background-color: white;
  background-image: linear-gradient(315deg, #ccfbf1 0%, #e4e4ffff 60%);
}

/* Стили выделения */
::selection {
  background: #37292C;
  color: white;
}

h1,
h2,
h3,
h4 {
  line-height: 1.125;
}

h1,
h2,
h3 {
  font-weight: 700;
}

h1 {
  font-size: var(--size-800);
}

h2 {
  font-size: var(--size-700);
}

h3 {
  font-size: var(--size-600);
}

p {
  font-size: var(--size-400);
}

p, li {
    max-width: none;
}

.gatsby-resp-image-wrapper {
    margin-left: auto !important;
    margin-right: auto !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 70ch !important;
}

/* Стилизация таблиц */
table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--size-600) auto;
  font-size: var(--size-400);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  // max-width: 120ch;
}

[data-netlify-table-wrapper="true"] {
  // width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: var(--size-600) auto;
  padding-bottom: var(--size-200);
}

table[data-netlify-table="true"] {
  width: auto;
  min-width: 100%;
  margin: 0;
}

thead {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

thead th {
  padding: var(--size-500) var(--size-400);
  text-align: left;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

tbody tr {
  transition: background-color 0.2s ease;
}

tbody tr:nth-child(even) {
  background-color: var(--color-background-secondary);
}

tbody tr:hover {
  background-color: rgba(255, 111, 97, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

tbody td {
  padding: var(--size-450) var(--size-400);
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

tbody td[data-vertical-align] {
  vertical-align: var(--netlify-table-vertical-align, top);
}

tbody tr:last-child td {
  border-bottom: none;
}

th,
td {
  position: relative;
}

/* Адаптивность для таблиц */
@media (max-width: 768px) {
  table {
    font-size: var(--size-300);
    margin: var(--size-500) 0;
  }
  
  thead th,
  tbody td {
    padding: var(--size-300) var(--size-200);
  }
  
  /* Горизонтальный скролл для больших таблиц на мобильных */
  table:not([data-netlify-table="true"]) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  table:not([data-netlify-table="true"]) thead,
  table:not([data-netlify-table="true"]) tbody,
  table:not([data-netlify-table="true"]) tr {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  [data-netlify-table-wrapper="true"] {
    margin: var(--size-500) 0;
  }
}


`;

export default GlobalStyle;
