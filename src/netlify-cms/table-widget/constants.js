export const FONT_SIZE_OPTIONS = [
    { value: "small", label: "Маленький" },
    { value: "medium", label: "Стандарт" },
    { value: "large", label: "Великий" },
];

export const FONT_SIZE_MAP = {
    small: "0.875rem",
    medium: "1rem",
    large: "1.25rem",
};

export const DEFAULT_COLUMN_WIDTH = 220;
export const MIN_COLUMN_WIDTH = 120;
export const MAX_COLUMN_WIDTH = 720;

export const DEFAULT_CELL = {
    text: "",
    bold: false,
    italic: false,
    underline: false,
    fontSize: "medium",
    link: "",
    textParts: [],
    alignment: "left",
    verticalAlignment: "top",
};

export const TEXT_ALIGNMENT_OPTIONS = [
    { value: "left", label: "Ліворуч" },
    { value: "center", label: "По центру" },
    { value: "right", label: "Праворуч" },
];

export const VERTICAL_ALIGNMENT_OPTIONS = [
    { value: "top", label: "Вгорі" },
    { value: "middle", label: "По центру" },
    { value: "bottom", label: "Внизу" },
];

const SYMBOL_SNIPPET_VALUES =
    "• · ∙ ⊙ ⊚ ⊛ ◉ ○ ◌ ◍ ◎ ● ◘ ◦ 。 ☉ ⦾ ⦿ ⁃ ⁌ ⁍ ◆ ◇ ◈ ★ ☆ ■ □ ☐ ☑ ☒ ✓ ✔ ❖ ⋄ ❥ ❧ ☙ ☸ ✤ ✱ ✲ ✦ ✧ ↠ ↣ ↦ ⇛ ⇢ ⇨ ➔ ➛ ➜ ➝ ➞ ➟ ➠ ➡ ➢ ➣ ➤ ➥ ➦ ➧ ➨ ➮ ➱ ➾ → ⇾ ⇒ ‣ ▶ ▷ ▸ ▹ ▻ 🔗 📎 🧷 ◼️ ◾ ▪️ ♦️ 🔶 🔹 🔸 🔘 ☑️ ✅ ✔️ 🔵 🟢 🟠 🔴 ❇️ ⚫ 🟤 🟣 #️⃣ ℹ️ 💠 ✳️ ⛔ ⚠️ ➡️ *️⃣ ღ • ⁂ € ™ €™ ’ ↑ → ↓ ∞ ☀ ☁ ☂ ☃ ☜ ☝ ☞ ☟ ☹ ☺ ☼ ☽ ☾ ♡ ♩ ♪ ♫ ♬ ✎ ✘ ✚ ✪ ✩ ❝ ❞ ⋮ ⋯ ♲ ♳ ♴ Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ Ⅵ Ⅶ Ⅷ Ⅸ Ⅹ Ⅺ Ⅻ ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ 𝟬 𝟭 𝟮 𝟯 𝟰 𝟱 𝟲 𝟳 𝟴 𝟵 ❎ ❌ ✖ Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ"
        .split(/\s+/)
        .filter(Boolean);

export const SYMBOL_SNIPPET_OPTIONS = SYMBOL_SNIPPET_VALUES.map((value) => ({
    value,
    label: value,
}));

export const CELL_SNIPPET_OPTIONS = [
    { value: "Немає даних", label: "Немає даних" },
    { value: "Уточнюється", label: "Уточнюється" },
    { value: "Див. деталі нижче", label: "Див. деталі нижче" },
    { value: "За рішенням кафедри", label: "За рішенням кафедри" },
];

export const LINK_COLOR = "#2563eb";
