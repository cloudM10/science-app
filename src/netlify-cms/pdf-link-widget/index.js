import { extractFileName, normalizeMediaPath } from "../utils/media";

export const registerPdfLinkWidget = (cmsInstance) => {
    cmsInstance.registerEditorComponent({
        id: "pdf-link",
        label: "PDF-посилання",
        fields: [
            {
                name: "text",
                label: "Текст посилання",
                widget: "string",
                required: false,
            },
            {
                name: "file",
                label: "PDF файл",
                widget: "file",
                media_library: {
                    allow_multiple: false,
                },
            },
        ],
        pattern: /\[([^\]]*?)\]\(([^\s)]+\.pdf)\)/i,
        fromBlock: (match) => {
            const text = (match[1] || "").trim();
            const file = normalizeMediaPath(match[2]);
            return {
                text,
                file,
            };
        },
        toBlock: ({ text, file }) => {
            const normalized = normalizeMediaPath(file);
            if (!normalized) {
                return text ? text : "";
            }

            const linkText =
                text && text.trim() ? text.trim() : extractFileName(normalized);
            return `[${linkText}](${normalized})`;
        },
        toPreview: ({ text, file }) => {
            const normalized = normalizeMediaPath(file);
            if (!normalized) {
                return text || "Оберіть PDF-файл";
            }

            const linkText =
                text && text.trim() ? text.trim() : extractFileName(normalized);
            return `<a href="${normalized}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        },
    });
};

export default registerPdfLinkWidget;
