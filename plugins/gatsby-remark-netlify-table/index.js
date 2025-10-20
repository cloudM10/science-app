const visit = require("unist-util-visit");

const TABLE_BLOCK_REGEXP = /^<Table>\s*([\s\S]*?)\s*<\/Table>$/i;

const FONT_SIZE_MAP = {
    small: "0.875rem",
    medium: "1rem",
    large: "1.25rem",
};

const DEFAULT_CELL = {
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

const DEFAULT_COLUMN_WIDTH = 220;
const MIN_COLUMN_WIDTH = 120;
const MAX_COLUMN_WIDTH = 720;

const createEmptyCell = () => ({
    ...DEFAULT_CELL,
    textParts: [],
});

const ALIGNMENT_VALUES = new Set(["left", "center", "right"]);
const VERTICAL_ALIGNMENT_VALUES = new Set(["top", "middle", "bottom"]);

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

const normalizeCell = (cell) => {
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

    return {
        ...createEmptyCell(),
        text: String(cell),
    };
};

const normalizeTable = (input) => {
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
        rows.push(
            Array.from({ length: targetColumnCount }, () => createEmptyCell())
        );
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

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const escapeAttribute = (value) => escapeHtml(value).replace(/`/g, "&#96;");

const resolveCellTextParts = (cell) => {
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

const cellToHtml = (cell) => {
    const normalized = normalizeCell(cell);
    const fontSize = FONT_SIZE_MAP[normalized.fontSize] ?? FONT_SIZE_MAP.medium;
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

    const boldWrapped = normalized.bold
        ? `<strong>${content}</strong>`
        : content;
    const italicWrapped = normalized.italic
        ? `<em>${boldWrapped}</em>`
        : boldWrapped;
    const underlineStyle = normalized.underline
        ? "text-decoration:underline;"
        : "";
    const alignmentStyle = `text-align:${normalized.alignment};`;

    const verticalAlignmentStyle = "vertical-align:inherit;";

    return `<span style="font-size:${fontSize};white-space:pre-wrap;display:inline-block;width:100%;${underlineStyle}${alignmentStyle}${verticalAlignmentStyle}">${
        italicWrapped || "&nbsp;"
    }</span>`;
};

const tableToHtmlString = (value) => {
    const table = normalizeTable(value);
    const columnWidths = table.columnWidths ?? [];
    const colGroup = columnWidths.length
        ? `<colgroup>${columnWidths
              .map((width, index) => {
                  const normalizedWidth = clampColumnWidth(width);
                  return `<col data-column-index="${index}" style="width:${normalizedWidth}px;min-width:${normalizedWidth}px;max-width:${normalizedWidth}px;" />`;
              })
              .join("")}</colgroup>`
        : "";

    const rows = table.rows
        .map((row) => {
            const cells = row
                .map((cell, columnIndex) => {
                    const width = clampColumnWidth(
                        columnWidths[columnIndex] ?? DEFAULT_COLUMN_WIDTH
                    );
                    const normalizedCell = normalizeCell(cell);
                    const cellVerticalAlignment =
                        normalizedCell.verticalAlignment;
                    return `<td data-vertical-align="${cellVerticalAlignment}" style="--netlify-table-vertical-align:${cellVerticalAlignment};border:1px solid #dcdcdc;padding:8px;vertical-align:${cellVerticalAlignment};text-align:${
                        normalizedCell.alignment
                    };width:${width}px;min-width:${width}px;max-width:${width}px;">${cellToHtml(
                        normalizedCell
                    )}</td>`;
                })
                .join("");
            return `<tr>${cells}</tr>`;
        })
        .join("");

    const caption = table.caption
        ? `<caption style="caption-side:top;font-weight:600;padding:8px 4px;">${escapeHtml(
              table.caption
          )}</caption>`
        : "";

    const tableStyle =
        "border-collapse:collapse;border:2px solid #dcdcdc;table-layout:fixed;width:auto;min-width:100%;";

    return `
<div data-netlify-table-wrapper="true" class="netlify-table-wrapper" style="min-width:70ch;overflow-x:auto;-webkit-overflow-scrolling:touch;">
    <table data-netlify-table="true" style="${tableStyle}">
        ${caption}
            ${colGroup}
        <tbody>${rows}</tbody>
    </table>
</div>
`;
};

module.exports = ({ markdownAST }) => {
    visit(markdownAST, "html", (node) => {
        if (typeof node.value !== "string") {
            return;
        }

        const match = node.value.match(TABLE_BLOCK_REGEXP);
        if (!match) {
            return;
        }

        try {
            const json = JSON.parse(match[1]);
            node.value = tableToHtmlString(json);
        } catch (error) {
            // leave node untouched on parse errors
        }
    });
};
