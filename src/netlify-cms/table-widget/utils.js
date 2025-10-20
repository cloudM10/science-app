import {
    DEFAULT_CELL,
    DEFAULT_COLUMN_WIDTH,
    FONT_SIZE_MAP,
    MAX_COLUMN_WIDTH,
    MIN_COLUMN_WIDTH,
    TEXT_ALIGNMENT_OPTIONS,
    VERTICAL_ALIGNMENT_OPTIONS,
} from "./constants";

const ALIGNMENT_VALUES = new Set(
    TEXT_ALIGNMENT_OPTIONS.map((option) => option.value)
);

const VERTICAL_ALIGNMENT_VALUES = new Set(
    VERTICAL_ALIGNMENT_OPTIONS.map((option) => option.value)
);

const clampColumnWidth = (value) =>
    Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(value)));

const normalizeColumnWidth = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return clampColumnWidth(value);
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (!trimmed) {
            return DEFAULT_COLUMN_WIDTH;
        }

        const numeric = Number.parseFloat(trimmed.replace(/px$/i, ""));

        if (Number.isFinite(numeric)) {
            return clampColumnWidth(numeric);
        }
    }

    return DEFAULT_COLUMN_WIDTH;
};

const ensureColumnWidths = (rawWidths, columnCount) => {
    const base = Array.isArray(rawWidths) ? rawWidths : [];

    return Array.from({ length: columnCount }, (_, index) =>
        normalizeColumnWidth(base[index])
    );
};

export const createEmptyCell = () => ({
    ...DEFAULT_CELL,
    textParts: [],
});

export const createCellWithText = (text = "") => ({
    ...DEFAULT_CELL,
    text: String(text ?? ""),
    textParts: [],
});

export const createEmptyRow = (columnCount) =>
    Array.from({ length: columnCount }, () => createEmptyCell());

export const normalizeCell = (cell) => {
    if (cell && typeof cell === "object" && !Array.isArray(cell)) {
        const fontSize = FONT_SIZE_MAP[cell.fontSize]
            ? cell.fontSize
            : DEFAULT_CELL.fontSize;

        const rawText =
            typeof cell.text === "string" ? cell.text : String(cell.text ?? "");
        const rawParts = Array.isArray(cell.textParts) ? cell.textParts : [];
        const textParts = rawParts
            .map((part) => ({
                text:
                    typeof part?.text === "string"
                        ? part.text
                        : String(part?.text ?? ""),
                link: typeof part?.link === "string" ? part.link.trim() : "",
            }))
            .filter((part) => part.text.length > 0);

        const textFromParts = textParts.map((part) => part.text).join("");
        const normalizedText = textParts.length ? textFromParts : rawText;

        const rawAlignment =
            typeof cell.alignment === "string"
                ? cell.alignment.trim().toLowerCase()
                : undefined;
        const alignment =
            rawAlignment && ALIGNMENT_VALUES.has(rawAlignment)
                ? rawAlignment
                : DEFAULT_CELL.alignment;

        const rawVerticalAlignment =
            typeof cell.verticalAlignment === "string"
                ? cell.verticalAlignment.trim().toLowerCase()
                : undefined;
        const verticalAlignment =
            rawVerticalAlignment &&
            VERTICAL_ALIGNMENT_VALUES.has(rawVerticalAlignment)
                ? rawVerticalAlignment
                : DEFAULT_CELL.verticalAlignment;

        return {
            text: normalizedText,
            bold: Boolean(cell.bold),
            italic: Boolean(cell.italic),
            underline: Boolean(cell.underline),
            fontSize,
            link: typeof cell.link === "string" ? cell.link.trim() : "",
            textParts,
            alignment,
            verticalAlignment,
        };
    }

    if (cell === null || cell === undefined) {
        return createEmptyCell();
    }

    return createCellWithText(cell);
};

export const normalizeTable = (input) => {
    const base =
        input && typeof input === "object" && !Array.isArray(input)
            ? input
            : {};

    let rawRows = [];

    if (Array.isArray(base.rows)) {
        rawRows = base.rows;
    } else if (Array.isArray(base.data)) {
        rawRows = base.data;
    } else if (Array.isArray(base.table)) {
        rawRows = base.table;
    } else if (Array.isArray(base.content)) {
        rawRows = base.content;
    }

    if (Array.isArray(input) && !rawRows.length) {
        rawRows = input;
    }

    if (!rawRows.length) {
        rawRows = [[createEmptyCell()]];
    }

    const targetColumnCount = Math.max(
        1,
        ...rawRows.map((row) =>
            Array.isArray(row) && row.length ? row.length : 0
        )
    );

    const rows = rawRows.map((row) => {
        const normalizedRow = Array.isArray(row)
            ? row.map((cell) => normalizeCell(cell))
            : [];

        while (normalizedRow.length < targetColumnCount) {
            normalizedRow.push(createEmptyCell());
        }

        return normalizedRow.slice(0, targetColumnCount);
    });

    if (!rows.length) {
        rows.push(createEmptyRow(targetColumnCount));
    }

    const columnWidths = ensureColumnWidths(
        base.columnWidths,
        targetColumnCount
    );

    let caption = "";
    if (typeof base.caption === "string") {
        caption = base.caption;
    } else if (typeof base.title === "string") {
        caption = base.title;
    }

    return {
        caption,
        rows,
        columnWidths,
    };
};

export const ensureTable = (rawValue) => {
    if (rawValue && typeof rawValue.toJS === "function") {
        return normalizeTable(rawValue.toJS());
    }

    if (typeof rawValue === "string") {
        try {
            const parsed = JSON.parse(rawValue);
            return ensureTable(parsed);
        } catch (error) {
            return normalizeTable({});
        }
    }

    if (Array.isArray(rawValue)) {
        return normalizeTable({ rows: rawValue });
    }

    if (rawValue && typeof rawValue === "object") {
        return normalizeTable(rawValue);
    }

    return normalizeTable({});
};

export const getFontSizeValue = (key) =>
    FONT_SIZE_MAP[key] ?? FONT_SIZE_MAP.medium;

export const resolveCellTextParts = (cell) => {
    const normalized = normalizeCell(cell);

    if (normalized.textParts.length) {
        return normalized.textParts;
    }

    if (normalized.link) {
        const displayText = normalized.text.trim()
            ? normalized.text
            : normalized.link;

        return [
            {
                text: displayText,
                link: normalized.link,
            },
        ];
    }

    if (normalized.text.length) {
        return [
            {
                text: normalized.text,
                link: "",
            },
        ];
    }

    return [];
};

export const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

export const escapeAttribute = (value) =>
    escapeHtml(value).replace(/`/g, "&#96;");

export const cellToHTML = (cell) => {
    const normalized = normalizeCell(cell);
    const fontSize = getFontSizeValue(normalized.fontSize);
    const parts = resolveCellTextParts(normalized);
    const content = parts.length
        ? parts
              .map((part) => {
                  const escapedText = escapeHtml(part.text);

                  if (part.link) {
                      const escapedHref = escapeAttribute(part.link);
                      return `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer">${escapedText}</a>`;
                  }

                  return escapedText;
              })
              .join("")
        : "";

    const wrappedBold = normalized.bold
        ? `<strong>${content}</strong>`
        : content;
    const wrappedItalic = normalized.italic
        ? `<em>${wrappedBold}</em>`
        : wrappedBold;
    const underlineStyle = normalized.underline
        ? "text-decoration:underline;"
        : "";
    const alignmentStyle = `text-align:${normalized.alignment};`;

    return `<span style="font-size:${fontSize};display:inline-block;width:100%;${underlineStyle}${alignmentStyle}">${
        wrappedItalic || "&nbsp;"
    }</span>`;
};

export const tableToHTMLString = (table) => {
    const normalized = ensureTable(table);
    const columnWidths = normalized.columnWidths ?? [];
    const colGroup = columnWidths.length
        ? `<colgroup>${columnWidths
              .map((width, index) => {
                  const normalizedWidth = clampColumnWidth(width);
                  return `<col data-column-index="${index}" style="width:${normalizedWidth}px;min-width:${normalizedWidth}px;max-width:${normalizedWidth}px;" />`;
              })
              .join("")}</colgroup>`
        : "";
    const rows = normalized.rows
        .map((row) => {
            const cells = row
                .map((cell, columnIndex) => {
                    const width = clampColumnWidth(
                        columnWidths[columnIndex] ?? DEFAULT_COLUMN_WIDTH
                    );
                    const normalizedCell = normalizeCell(cell);
                    return `<td style="border:1px solid #dcdcdc;padding:8px;vertical-align:${
                        normalizedCell.verticalAlignment
                    };text-align:${
                        normalizedCell.alignment
                    };width:${width}px;min-width:${width}px;max-width:${width}px;">${cellToHTML(
                        normalizedCell
                    )}</td>`;
                })
                .join("");
            return `<tr>${cells}</tr>`;
        })
        .join("");

    const caption = normalized.caption
        ? `<caption style="caption-side:top;font-weight:600;padding:8px 4px;">${escapeHtml(
              normalized.caption
          )}</caption>`
        : "";

    return `
<table data-netlify-table="true" style="border-collapse:collapse;width:100%;border:2px solid #dcdcdc;table-layout:fixed;">
  ${caption}
    ${colGroup}
  <tbody>${rows}</tbody>
</table>
`;
};
