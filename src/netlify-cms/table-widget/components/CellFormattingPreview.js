import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
    DEFAULT_CELL,
    FONT_SIZE_OPTIONS,
    TEXT_ALIGNMENT_OPTIONS,
    VERTICAL_ALIGNMENT_OPTIONS,
    LINK_COLOR,
} from "../constants";
import { getCellRendering } from "./cellRendering";

const FONT_SIZE_LABEL_MAP = FONT_SIZE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});

const TEXT_ALIGNMENT_LABEL_MAP = TEXT_ALIGNMENT_OPTIONS.reduce(
    (acc, option) => {
        acc[option.value] = option.label;
        return acc;
    },
    {}
);

const VERTICAL_ALIGNMENT_LABEL_MAP = VERTICAL_ALIGNMENT_OPTIONS.reduce(
    (acc, option) => {
        acc[option.value] = option.label;
        return acc;
    },
    {}
);

const badgeStyles = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#312e81",
    fontSize: "0.75rem",
    fontWeight: 600,
};

const containerStyles = {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    marginTop: "0.35rem",
    border: "1px dashed #d1d5db",
    borderRadius: "6px",
    padding: "0.5rem 0.6rem",
    background: "#f9fafb",
};

const previewWrapperStyles = {
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
    padding: "0.35rem 0.45rem",
    background: "#ffffff",
};

const tableAlignmentMap = {
    top: "flex-start",
    middle: "center",
    bottom: "flex-end",
};

const tableContainerStyles = {
    width: "100%",
    padding: "0.5rem",
    border: "2px solid #dcdcdc",
    borderRadius: "4px",
    boxSizing: "border-box",
    minHeight: "90px",
    background: "#ffffff",
    display: "flex",
};

const CellFormattingPreview = ({ cell, variant }) => {
    const rendering = useMemo(() => getCellRendering(cell), [cell]);
    const normalized = rendering.normalized;

    const hasLinkInParts = normalized.textParts.some((part) => part.link);
    const hasFormatting =
        normalized.bold ||
        normalized.italic ||
        normalized.underline ||
        normalized.fontSize !== DEFAULT_CELL.fontSize ||
        normalized.alignment !== DEFAULT_CELL.alignment ||
        normalized.verticalAlignment !== DEFAULT_CELL.verticalAlignment ||
        Boolean(normalized.link) ||
        hasLinkInParts ||
        normalized.textParts.length > 0 ||
        normalized.text.trim().length > 0;

    if (variant === "table") {
        const alignItems =
            tableAlignmentMap[normalized.verticalAlignment] ?? "center";

        return (
            <div
                style={{
                    ...tableContainerStyles,
                    alignItems,
                }}
            >
                <div style={{ width: "100%" }}>{rendering.content}</div>
            </div>
        );
    }

    if (!hasFormatting) {
        return null;
    }

    const badges = [];

    if (normalized.fontSize !== DEFAULT_CELL.fontSize) {
        const label =
            FONT_SIZE_LABEL_MAP[normalized.fontSize] ?? normalized.fontSize;
        badges.push({ key: "fontSize", label: `Шрифт: ${label}` });
    }

    if (normalized.alignment !== DEFAULT_CELL.alignment) {
        const label =
            TEXT_ALIGNMENT_LABEL_MAP[normalized.alignment] ??
            normalized.alignment;
        badges.push({ key: "alignment", label: `Вирівнювання: ${label}` });
    }

    if (normalized.bold) {
        badges.push({ key: "bold", label: "Жирний" });
    }

    if (normalized.italic) {
        badges.push({ key: "italic", label: "Курсив" });
    }

    if (normalized.underline) {
        badges.push({ key: "underline", label: "Підкреслення" });
    }

    if (normalized.verticalAlignment !== DEFAULT_CELL.verticalAlignment) {
        const label =
            VERTICAL_ALIGNMENT_LABEL_MAP[normalized.verticalAlignment] ??
            normalized.verticalAlignment;
        badges.push({ key: "vertical", label: `Вертикаль: ${label}` });
    }

    if (Boolean(normalized.link) || hasLinkInParts) {
        badges.push({ key: "link", label: "Є посилання" });
    }

    if (
        normalized.textParts.length > 0 &&
        !(Boolean(normalized.link) || hasLinkInParts)
    ) {
        badges.push({ key: "segments", label: "Складені фрагменти" });
    }

    return (
        <div style={containerStyles}>
            {badges.length ? (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.35rem",
                    }}
                >
                    {badges.map((badge) => (
                        <span key={badge.key} style={badgeStyles}>
                            {badge.label}
                        </span>
                    ))}
                </div>
            ) : null}

            <div
                style={{
                    ...previewWrapperStyles,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent:
                        normalized.verticalAlignment === "bottom"
                            ? "flex-end"
                            : normalized.verticalAlignment === "top"
                            ? "flex-start"
                            : "center",
                    minHeight: "3.5rem",
                }}
            >
                {rendering.content}
            </div>

            {normalized.link ? (
                <a
                    href={normalized.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        fontSize: "0.75rem",
                        color: LINK_COLOR,
                        wordBreak: "break-word",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                    }}
                >
                    <span aria-hidden="true">🔗</span>
                    <span>{normalized.link}</span>
                </a>
            ) : null}
        </div>
    );
};

CellFormattingPreview.propTypes = {
    cell: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.array,
    ]),
    variant: PropTypes.oneOf(["table", "default"]),
};

CellFormattingPreview.defaultProps = {
    cell: null,
    variant: "default",
};

export default CellFormattingPreview;
