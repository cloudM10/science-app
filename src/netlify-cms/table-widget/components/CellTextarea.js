import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { normalizeCell } from "../utils";

const getCommonPrefixLength = (a, b) => {
    const max = Math.min(a.length, b.length);
    let index = 0;

    while (index < max && a.charCodeAt(index) === b.charCodeAt(index)) {
        index += 1;
    }

    return index;
};

const getCommonSuffixLength = (a, b) => {
    const max = Math.min(a.length, b.length);
    let length = 0;

    while (
        length < max &&
        a.charCodeAt(a.length - 1 - length) ===
            b.charCodeAt(b.length - 1 - length)
    ) {
        length += 1;
    }

    return length;
};

const buildSegmentsFromParts = (parts, totalLength) => {
    const segments = [];
    let offset = 0;

    parts.forEach((part) => {
        const text = typeof part?.text === "string" ? part.text : "";
        const length = text.length;

        if (length > 0) {
            segments.push({
                start: offset,
                end: offset + length,
                link: part?.link || "",
            });
        }

        offset += length;
    });

    if (offset < totalLength) {
        segments.push({
            start: offset,
            end: totalLength,
            link: "",
        });
    }

    return segments;
};

const clipSegments = (segments, rangeStart, rangeEnd) => {
    if (rangeEnd <= rangeStart) {
        return [];
    }

    return segments
        .map((segment) => {
            const start = Math.max(segment.start, rangeStart);
            const end = Math.min(segment.end, rangeEnd);

            if (start >= end) {
                return null;
            }

            return {
                start,
                end,
                link: segment.link || "",
            };
        })
        .filter(Boolean);
};

const fillAndMergeSegments = (segments, totalLength) => {
    if (!segments.length) {
        return totalLength > 0
            ? [{ start: 0, end: totalLength, link: "" }]
            : [];
    }

    const sorted = segments
        .map((segment) => ({
            start: Math.max(0, Math.min(segment.start, totalLength)),
            end: Math.max(0, Math.min(segment.end, totalLength)),
            link: segment.link || "",
        }))
        .filter((segment) => segment.end > segment.start)
        .sort((a, b) => {
            if (a.start === b.start) {
                return a.end - b.end;
            }

            return a.start - b.start;
        });

    const filled = [];
    let cursor = 0;

    sorted.forEach((segment) => {
        if (segment.start > cursor) {
            filled.push({ start: cursor, end: segment.start, link: "" });
            cursor = segment.start;
        }

        if (
            filled.length &&
            filled[filled.length - 1].link === segment.link &&
            filled[filled.length - 1].end === segment.start
        ) {
            filled[filled.length - 1].end = segment.end;
        } else {
            filled.push({ ...segment });
        }

        cursor = Math.max(cursor, segment.end);
    });

    if (cursor < totalLength) {
        filled.push({ start: cursor, end: totalLength, link: "" });
    }

    const merged = [];

    filled.forEach((segment) => {
        if (!merged.length) {
            merged.push({ ...segment });
            return;
        }

        const last = merged[merged.length - 1];

        if (last.link === segment.link && last.end === segment.start) {
            last.end = segment.end;
        } else {
            merged.push({ ...segment });
        }
    });

    return merged;
};

const rebuildTextParts = (normalizedCell, nextText) => {
    const previousParts = Array.isArray(normalizedCell.textParts)
        ? normalizedCell.textParts
        : [];

    if (!previousParts.length) {
        return [];
    }

    const previousText = normalizedCell.text;
    const segments = buildSegmentsFromParts(previousParts, previousText.length);

    if (!segments.length) {
        return [];
    }

    const prefixLength = getCommonPrefixLength(previousText, nextText);
    const suffixLength = getCommonSuffixLength(
        previousText.slice(prefixLength),
        nextText.slice(prefixLength)
    );

    const clippedPrefix = clipSegments(segments, 0, prefixLength);
    const clippedSuffix = clipSegments(
        segments,
        previousText.length - suffixLength,
        previousText.length
    );

    const suffixOldStart = previousText.length - suffixLength;
    const suffixNewStart = nextText.length - suffixLength;
    const insertedLength = Math.max(
        0,
        nextText.length - prefixLength - suffixLength
    );

    let linkAtInsertion = "";

    segments.some((segment) => {
        if (
            prefixLength >= segment.start &&
            prefixLength < segment.end &&
            segment.link
        ) {
            linkAtInsertion = segment.link;
            return true;
        }

        return false;
    });

    let combined = [
        ...clippedPrefix.map((segment) => ({
            start: segment.start,
            end: segment.end,
            link: segment.link || "",
        })),
    ];

    if (insertedLength > 0) {
        combined.push({
            start: prefixLength,
            end: prefixLength + insertedLength,
            link: linkAtInsertion,
        });
    }

    combined = combined.concat(
        clippedSuffix.map((segment) => ({
            start: suffixNewStart + Math.max(0, segment.start - suffixOldStart),
            end: suffixNewStart + Math.max(0, segment.end - suffixOldStart),
            link: segment.link || "",
        }))
    );

    const mergedSegments = fillAndMergeSegments(combined, nextText.length);

    return mergedSegments
        .map((segment) => {
            const textSlice = nextText.slice(segment.start, segment.end);

            if (!textSlice) {
                return null;
            }

            return {
                text: textSlice,
                link: segment.link || "",
            };
        })
        .filter(Boolean);
};

const defaultTextareaStyles = {
    width: "100%",
    padding: "0.5rem",
    border: "2px solid #dcdcdc",
    borderRadius: "4px",
    boxSizing: "border-box",
    minHeight: "90px",
    resize: "vertical",
};

const CellTextarea = ({
    cellKey,
    cell,
    rowIndex,
    columnIndex,
    registerInputRef,
    setActiveCell,
    captureSelectionFromInput,
    updateCell,
    placeholder,
    style,
}) => {
    const handleFocusOrClick = useCallback(
        (event) => {
            setActiveCell({
                rowIndex,
                columnIndex,
            });
            captureSelectionFromInput(event.target, rowIndex, columnIndex);
        },
        [captureSelectionFromInput, columnIndex, rowIndex, setActiveCell]
    );

    const handleSelectionUpdate = useCallback(
        (event) => {
            captureSelectionFromInput(event.target, rowIndex, columnIndex);
        },
        [captureSelectionFromInput, columnIndex, rowIndex]
    );

    const handleChange = useCallback(
        (event) => {
            const inputNode = event.target;
            const { value } = inputNode;

            updateCell(rowIndex, columnIndex, (current) => {
                const normalized = normalizeCell(current);

                if (!Array.isArray(normalized.textParts)) {
                    return {
                        ...current,
                        text: value,
                        textParts: [],
                        link: normalized.link || "",
                    };
                }

                if (!normalized.textParts.length) {
                    return {
                        ...current,
                        text: value,
                        textParts: [],
                        link: normalized.link || "",
                    };
                }

                const nextParts = rebuildTextParts(normalized, value);

                if (!nextParts.length) {
                    return {
                        ...current,
                        text: value,
                        textParts: [],
                        link: "",
                    };
                }

                const hasLinkedPart = nextParts.some((part) => part.link);

                if (!hasLinkedPart) {
                    return {
                        ...current,
                        text: value,
                        textParts: [],
                        link: "",
                    };
                }

                return {
                    ...current,
                    text: value,
                    textParts: nextParts,
                    link: "",
                };
            });

            captureSelectionFromInput(inputNode, rowIndex, columnIndex);
        },
        [captureSelectionFromInput, columnIndex, rowIndex, updateCell]
    );

    return (
        <textarea
            ref={(node) => registerInputRef(cellKey, node)}
            value={cell?.text ?? ""}
            onFocus={handleFocusOrClick}
            onClick={handleFocusOrClick}
            onSelect={handleSelectionUpdate}
            onMouseUp={handleSelectionUpdate}
            onKeyUp={handleSelectionUpdate}
            onChange={handleChange}
            placeholder={placeholder}
            style={style ?? defaultTextareaStyles}
        />
    );
};

CellTextarea.propTypes = {
    cellKey: PropTypes.string.isRequired,
    cell: PropTypes.shape({
        text: PropTypes.string,
        textParts: PropTypes.array,
    }),
    rowIndex: PropTypes.number.isRequired,
    columnIndex: PropTypes.number.isRequired,
    registerInputRef: PropTypes.func.isRequired,
    setActiveCell: PropTypes.func.isRequired,
    captureSelectionFromInput: PropTypes.func.isRequired,
    updateCell: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    style: PropTypes.object,
};

CellTextarea.defaultProps = {
    cell: null,
    placeholder: "Текст клітинки",
    style: null,
};

export default CellTextarea;
