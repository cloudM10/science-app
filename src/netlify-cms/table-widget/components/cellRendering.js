import React from "react";
import { LINK_COLOR } from "../constants";
import {
    getFontSizeValue,
    normalizeCell,
    resolveCellTextParts,
} from "../utils";

export const getCellRendering = (cell) => {
    const normalized = normalizeCell(cell);
    const parts = resolveCellTextParts(normalized);
    const inlineParts = parts.length
        ? parts
        : [
              {
                  text: "\u00A0",
                  link: "",
              },
          ];

    const inlineContent = inlineParts.map((part, index) => {
        const text = part.text.length ? part.text : "\u00A0";

        if (part.link) {
            return (
                <a
                    key={`cell-part-${index}`}
                    href={part.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: LINK_COLOR }}
                >
                    {text}
                </a>
            );
        }

        return (
            <React.Fragment key={`cell-part-${index}`}>{text}</React.Fragment>
        );
    });

    let content = inlineContent;

    if (normalized.bold) {
        content = <strong>{content}</strong>;
    }

    if (normalized.italic) {
        content = <em>{content}</em>;
    }

    return {
        content: (
            <span
                style={{
                    whiteSpace: "pre-wrap",
                    fontSize: getFontSizeValue(normalized.fontSize),
                    display: "inline-block",
                    width: "100%",
                    textAlign: normalized.alignment,
                    verticalAlign: "inherit",
                    "--netlify-table-vertical-align":
                        normalized.verticalAlignment,
                    textDecoration: normalized.underline
                        ? "underline"
                        : undefined,
                }}
            >
                {content}
            </span>
        ),
        alignment: normalized.alignment,
        verticalAlignment: normalized.verticalAlignment,
        normalized,
    };
};

export default getCellRendering;
