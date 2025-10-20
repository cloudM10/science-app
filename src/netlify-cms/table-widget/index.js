import TableControl from "./TableControl";
import TablePreview from "./TablePreview";
import { ensureTable, tableToHTMLString } from "./utils";

export const registerTableWidget = (cmsInstance) => {
    const widgetId = "table";

    cmsInstance.registerWidget(widgetId, TableControl, TablePreview);

    cmsInstance.registerEditorComponent({
        id: widgetId,
        label: "Таблиця",
        fields: [
            {
                name: "content",
                label: "Зміст таблиці",
                widget: widgetId,
            },
        ],
    pattern: /<Table>\s*([\s\S]*?)\s*<\/Table>/m,
        fromBlock: (match) => {
            try {
                const json = JSON.parse(match[1].trim());
                return { content: ensureTable(json) };
            } catch (error) {
                return { content: ensureTable(null) };
            }
        },
        toBlock: ({ content }) => {
            const data = ensureTable(content);
            return `<Table>\n${JSON.stringify(data, null, 2)}\n</Table>`;
        },
        toPreview: ({ content }) => tableToHTMLString(content),
    });
};

export default registerTableWidget;
