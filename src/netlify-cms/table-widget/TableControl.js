import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import PropTypes from "prop-types";
import FormattingPopover from "./components/FormattingPopover";
import LinkPopover from "./components/LinkPopover";
import LinkPdfPopover from "./components/LinkPdfPopover";
import Modal from "./components/Modal";
import CellFormattingPreview from "./components/CellFormattingPreview";
import {
    createEmptyCell,
    createEmptyRow,
    ensureTable,
    normalizeCell,
} from "./utils";
import {
    DEFAULT_COLUMN_WIDTH,
    FONT_SIZE_OPTIONS,
    MAX_COLUMN_WIDTH,
    MIN_COLUMN_WIDTH,
} from "./constants";
import { isPdfPath, normalizePdfPath } from "../utils/media";

const clampColumnWidthValue = (value) =>
    Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(value)));

const ensureColumnWidthsArray = (columnWidths, columnCount) => {
    const base = Array.isArray(columnWidths) ? [...columnWidths] : [];

    while (base.length < columnCount) {
        base.push(DEFAULT_COLUMN_WIDTH);
    }

    return base.slice(0, columnCount).map((width) => {
        if (typeof width === "number" && Number.isFinite(width)) {
            return clampColumnWidthValue(width);
        }

        if (typeof width === "string") {
            const numeric = Number.parseFloat(width.replace(/px$/i, ""));
            if (Number.isFinite(numeric)) {
                return clampColumnWidthValue(numeric);
            }
        }

        return DEFAULT_COLUMN_WIDTH;
    });
};

const extractClientX = (event) => {
    if (typeof event.clientX === "number") {
        return event.clientX;
    }

    if (event.touches && event.touches.length) {
        return event.touches[0].clientX;
    }

    if (event.changedTouches && event.changedTouches.length) {
        return event.changedTouches[0].clientX;
    }

    return null;
};

const TableControl = ({
    value,
    onChange,
    forID,
    classNameWrapper,
    field,
    mediaPaths,
    onOpenMediaLibrary,
    onClearMediaControl,
    onRemoveInsertedMedia,
    onRemoveMediaControl,
}) => {
    const [table, setTable] = useState(() => ensureTable(value));
    const [activeCell, setActiveCell] = useState(() => {
        const normalized = ensureTable(value);
        return normalized.rows.length && normalized.rows[0]?.length
            ? { rowIndex: 0, columnIndex: 0 }
            : null;
    });
    const [openCellMenu, setOpenCellMenu] = useState(
        /** @type {{ rowIndex: number; columnIndex: number } | null} */ (null)
    );
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [popoverAnchor, setPopoverAnchor] = useState(null);
    const cellRefs = useRef(new Map());
    const inputRefs = useRef(new Map());
    const linkButtonRef = useRef(null);
    const linkPdfButtonRef = useRef(null);
    const [textSelection, setTextSelection] = useState(
        /** @type {
            | {
                  rowIndex: number;
                  columnIndex: number;
                  start: number;
                  end: number;
                  text: string;
              }
            | null
        } */ (null)
    );
    const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
    const [linkDraftValue, setLinkDraftValue] = useState("");
    const [isPdfPopoverOpen, setIsPdfPopoverOpen] = useState(false);
    const [pdfLinkDraftValue, setPdfLinkDraftValue] = useState("");
    const [pdfLinkError, setPdfLinkError] = useState("");
    const [draggingRowIndex, setDraggingRowIndex] = useState(
        /** @type {number | null} */ (null)
    );
    const [rowDragOverIndex, setRowDragOverIndex] = useState(
        /** @type {number | null} */ (null)
    );
    const [draggingColumnIndex, setDraggingColumnIndex] = useState(
        /** @type {number | null} */ (null)
    );
    const [columnDragOverIndex, setColumnDragOverIndex] = useState(
        /** @type {number | null} */ (null)
    );
    const [columnResizeState, setColumnResizeState] = useState(
        /** @type<{ columnIndex: number; startX: number; startWidth: number } | null> */
        (null)
    );
    const latestTableRef = useRef(table);
    const pdfMediaControlIDRef = useRef(null);
    const lastPdfHandledPathRef = useRef(null);
    const pdfSelectionSnapshotRef = useRef(null);

    if (!pdfMediaControlIDRef.current) {
        const baseId = forID || "table-widget";
        const suffix = Math.random().toString(36).slice(2, 10);
        pdfMediaControlIDRef.current = `${baseId}-pdf-${suffix}`;
    }

    const pdfMediaControlID = pdfMediaControlIDRef.current;
    const mediaLibraryAvailable = typeof onOpenMediaLibrary === "function";

    const getCellKey = useCallback(
        (rowIndex, columnIndex) => `${rowIndex}-${columnIndex}`,
        []
    );

    const columnCount = useMemo(() => table.rows[0]?.length ?? 1, [table.rows]);
    const rowCount = table.rows.length;
    const columnWidths = useMemo(
        () => ensureColumnWidthsArray(table.columnWidths, columnCount),
        [columnCount, table.columnWidths]
    );
    const previewNote = useMemo(() => {
        for (const row of table.rows) {
            for (const cell of row) {
                const text = (cell.text ?? "").trim();
                if (text) {
                    return text;
                }

                const link = (cell.link ?? "").trim();
                if (link) {
                    return link;
                }
            }
        }

        return "Всі клітинки пусті";
    }, [table.rows]);

    const hasTextSelection = Boolean(
        textSelection && textSelection.end > textSelection.start
    );

    useEffect(() => {
        if (hasTextSelection && textSelection) {
            pdfSelectionSnapshotRef.current = textSelection;
        } else if (!isPdfPopoverOpen) {
            pdfSelectionSnapshotRef.current = null;
        }
    }, [hasTextSelection, isPdfPopoverOpen, textSelection]);

    const getLinkedSegmentsForCell = (rowIndex, columnIndex) => {
        const targetRow = table.rows[rowIndex];

        if (!targetRow) {
            return [];
        }

        const targetCell = targetRow[columnIndex];

        if (!targetCell) {
            return [];
        }

        const normalized = normalizeCell(targetCell);

        const parts = normalized.textParts.length
            ? normalized.textParts
            : normalized.link
            ? [
                  {
                      text: normalized.text,
                      link: normalized.link,
                  },
              ]
            : [];

        if (!parts.length) {
            return [];
        }

        const segments = [];
        let cursor = 0;

        parts.forEach((part) => {
            const partText = typeof part?.text === "string" ? part.text : "";
            const trimmedLink =
                typeof part?.link === "string" ? part.link.trim() : "";
            const length = partText.length;
            const start = cursor;
            const end = cursor + length;

            if (length > 0 && trimmedLink) {
                segments.push({
                    text: partText,
                    link: trimmedLink,
                    start,
                    end,
                });
            }

            cursor = end;
        });

        return segments;
    };

    const updatePopoverAnchor = useCallback((rowIndex, columnIndex) => {
        if (typeof window === "undefined") {
            return;
        }

        const element = cellRefs.current.get(getCellKey(rowIndex, columnIndex));

        if (!element) {
            setPopoverAnchor(null);
            return;
        }

        const rect = element.getBoundingClientRect();

        setPopoverAnchor({
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        });
    }, []);

    const pushChange = useCallback(
        (updater, options = {}) => {
            setTable((previous) => {
                const draft =
                    typeof updater === "function" ? updater(previous) : updater;
                const normalized = ensureTable(draft);

                latestTableRef.current = normalized;

                if (options.emit !== false) {
                    onChange(normalized);
                }

                return normalized;
            });
        },
        [onChange]
    );

    const updateCell = useCallback(
        (rowIndex, columnIndex, updater) => {
            const rows = table.rows.map((row, rIdx) => {
                if (rIdx !== rowIndex) {
                    return row;
                }

                return row.map((cell, cIdx) => {
                    if (cIdx !== columnIndex) {
                        return cell;
                    }

                    const nextValue =
                        typeof updater === "function"
                            ? updater(cell)
                            : { ...cell, ...updater };

                    return normalizeCell(nextValue);
                });
            });

            pushChange({ ...table, rows });
        },
        [pushChange, table]
    );

    const updateActiveCell = useCallback(
        (updater) => {
            if (
                !activeCell ||
                !table.rows[activeCell.rowIndex] ||
                !table.rows[activeCell.rowIndex][activeCell.columnIndex]
            ) {
                return;
            }

            updateCell(activeCell.rowIndex, activeCell.columnIndex, updater);
        },
        [activeCell, table, updateCell]
    );

    const captureSelectionFromInput = useCallback(
        (input, rowIndex, columnIndex) => {
            if (!input) {
                setTextSelection(null);
                return;
            }

            const value = typeof input.value === "string" ? input.value : "";
            const selectionStart =
                typeof input.selectionStart === "number"
                    ? input.selectionStart
                    : 0;
            const selectionEnd =
                typeof input.selectionEnd === "number"
                    ? input.selectionEnd
                    : selectionStart;

            const start = Math.max(0, Math.min(selectionStart, selectionEnd));
            const end = Math.max(0, Math.max(selectionStart, selectionEnd));

            setTextSelection({
                rowIndex,
                columnIndex,
                start,
                end,
                text: value.slice(start, end),
            });
        },
        []
    );

    const registerInputRef = useCallback((cellKey, node) => {
        if (node) {
            inputRefs.current.set(cellKey, node);
        } else {
            inputRefs.current.delete(cellKey);
        }
    }, []);

    useEffect(() => {
        const normalized = ensureTable(value);
        setTable(normalized);
    }, [value]);

    useEffect(() => {
        latestTableRef.current = table;
    }, [table]);

    useEffect(() => {
        return () => {
            if (typeof onRemoveMediaControl === "function") {
                onRemoveMediaControl(pdfMediaControlID);
            }

            if (typeof onClearMediaControl === "function") {
                onClearMediaControl(pdfMediaControlID);
            }
        };
    }, [onClearMediaControl, onRemoveMediaControl, pdfMediaControlID]);

    useEffect(() => {
        if (!mediaLibraryAvailable || !mediaPaths) {
            return;
        }

        let rawValue = null;

        if (typeof mediaPaths.get === "function") {
            rawValue = mediaPaths.get(pdfMediaControlID);
        } else if (
            typeof mediaPaths === "object" &&
            mediaPaths !== null &&
            Object.prototype.hasOwnProperty.call(mediaPaths, pdfMediaControlID)
        ) {
            rawValue = mediaPaths[pdfMediaControlID];
        }

        if (!rawValue) {
            return;
        }

        if (typeof onRemoveInsertedMedia === "function") {
            onRemoveInsertedMedia(pdfMediaControlID);
        }

        if (typeof onClearMediaControl === "function") {
            onClearMediaControl(pdfMediaControlID);
        }

        const normalized = normalizePdfPath(rawValue);

        if (!normalized) {
            lastPdfHandledPathRef.current = null;
            setPdfLinkError("Не вдалося визначити шлях до файлу.");
            return;
        }

        if (!isPdfPath(normalized)) {
            lastPdfHandledPathRef.current = normalized;
            setPdfLinkError("Можна прикріпити лише PDF-файли.");
            return;
        }

        if (lastPdfHandledPathRef.current === normalized) {
            return;
        }

        lastPdfHandledPathRef.current = normalized;
        setPdfLinkDraftValue(normalized);
        setPdfLinkError("");

        if (!isPdfPopoverOpen) {
            setIsPdfPopoverOpen(true);
        }
    }, [
        mediaLibraryAvailable,
        mediaPaths,
        onClearMediaControl,
        onRemoveInsertedMedia,
        pdfMediaControlID,
        isPdfPopoverOpen,
    ]);

    useEffect(() => {
        if (!textSelection) {
            return;
        }

        if (
            !activeCell ||
            textSelection.rowIndex !== activeCell.rowIndex ||
            textSelection.columnIndex !== activeCell.columnIndex
        ) {
            setTextSelection(null);
        }
    }, [activeCell, textSelection]);

    useEffect(() => {
        if (!hasTextSelection) {
            setIsLinkPopoverOpen(false);

            if (!pdfSelectionSnapshotRef.current) {
                setIsPdfPopoverOpen(false);
                setPdfLinkError("");
            }
        }
    }, [hasTextSelection]);

    useEffect(() => {
        if (!isPdfPopoverOpen) {
            lastPdfHandledPathRef.current = null;
        }
    }, [isPdfPopoverOpen]);

    useEffect(() => {
        if (!table.rows.length || !table.rows[0]?.length) {
            if (activeCell !== null) {
                setActiveCell(null);
            }
            if (openCellMenu !== null) {
                setOpenCellMenu(null);
            }
            return;
        }

        if (openCellMenu) {
            const targetRow = table.rows[openCellMenu.rowIndex];

            if (!targetRow) {
                setOpenCellMenu(null);
            } else {
                const fallbackColumnIndex = Math.max(targetRow.length - 1, 0);

                if (openCellMenu.columnIndex > fallbackColumnIndex) {
                    const nextColumnIndex = fallbackColumnIndex;

                    setOpenCellMenu({
                        rowIndex: openCellMenu.rowIndex,
                        columnIndex: nextColumnIndex,
                    });
                    setActiveCell({
                        rowIndex: openCellMenu.rowIndex,
                        columnIndex: nextColumnIndex,
                    });
                }
            }
        }

        if (!activeCell) {
            setActiveCell({ rowIndex: 0, columnIndex: 0 });
            return;
        }

        const activeRow = table.rows[activeCell.rowIndex];

        if (!activeRow) {
            setActiveCell({ rowIndex: 0, columnIndex: 0 });
            return;
        }

        if (activeCell.columnIndex >= activeRow.length) {
            setActiveCell({
                rowIndex: activeCell.rowIndex,
                columnIndex: Math.max(activeRow.length - 1, 0),
            });
        }
    }, [table, activeCell, openCellMenu]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return undefined;
        }

        if (!openCellMenu) {
            setPopoverAnchor(null);
            return undefined;
        }

        const handleReposition = () => {
            updatePopoverAnchor(
                openCellMenu.rowIndex,
                openCellMenu.columnIndex
            );
        };

        handleReposition();

        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [openCellMenu, updatePopoverAnchor]);

    const handleCellMenuToggle = useCallback(
        (rowIndex, columnIndex = 0) => {
            setIsLinkPopoverOpen(false);
            const targetRow = table.rows[rowIndex];

            if (!targetRow?.length) {
                return;
            }

            const normalizedColumnIndex = Math.min(
                Math.max(columnIndex, 0),
                targetRow.length - 1
            );

            const isSameCell =
                openCellMenu &&
                openCellMenu.rowIndex === rowIndex &&
                openCellMenu.columnIndex === normalizedColumnIndex;

            if (isSameCell) {
                setOpenCellMenu(null);
                setPopoverAnchor(null);
                return;
            }

            setActiveCell((prev) => {
                if (
                    prev &&
                    prev.rowIndex === rowIndex &&
                    prev.columnIndex === normalizedColumnIndex
                ) {
                    return prev;
                }

                return {
                    rowIndex,
                    columnIndex: normalizedColumnIndex,
                };
            });

            setOpenCellMenu({
                rowIndex,
                columnIndex: normalizedColumnIndex,
            });

            if (typeof window !== "undefined") {
                window.requestAnimationFrame(() => {
                    updatePopoverAnchor(rowIndex, normalizedColumnIndex);
                });
            } else {
                updatePopoverAnchor(rowIndex, normalizedColumnIndex);
            }
        },
        [openCellMenu, table.rows, updatePopoverAnchor]
    );

    const handleColumnSelect = useCallback(
        (rowIndex, columnIndex) => {
            setIsLinkPopoverOpen(false);

            const targetRow = table.rows[rowIndex];

            if (!targetRow?.length) {
                return;
            }

            const nextColumnIndex = Math.min(
                Math.max(columnIndex, 0),
                Math.max(targetRow.length - 1, 0)
            );

            setActiveCell({ rowIndex, columnIndex: nextColumnIndex });
            setOpenCellMenu({
                rowIndex,
                columnIndex: nextColumnIndex,
            });

            if (typeof window !== "undefined") {
                window.requestAnimationFrame(() => {
                    updatePopoverAnchor(rowIndex, nextColumnIndex);
                });
            } else {
                updatePopoverAnchor(rowIndex, nextColumnIndex);
            }
        },
        [table.rows, updatePopoverAnchor]
    );

    const closeCellMenu = useCallback(() => {
        setOpenCellMenu(null);
        setPopoverAnchor(null);
        setIsLinkPopoverOpen(false);
    }, []);

    const openEditor = useCallback(() => {
        setIsEditorOpen(true);
    }, []);

    const closeEditor = useCallback(() => {
        setIsEditorOpen(false);
        setOpenCellMenu(null);
        setPopoverAnchor(null);
        setIsLinkPopoverOpen(false);
    }, []);

    const addRow = useCallback(() => {
        pushChange({
            ...table,
            rows: [...table.rows, createEmptyRow(columnCount)],
        });
    }, [columnCount, pushChange, table]);

    const removeRow = useCallback(
        (rowIndex) => {
            if (table.rows.length === 1) {
                pushChange({
                    ...table,
                    rows: [createEmptyRow(columnCount)],
                });
                return;
            }

            pushChange({
                ...table,
                rows: table.rows.filter((_, idx) => idx !== rowIndex),
            });
        },
        [columnCount, pushChange, table]
    );

    const addColumn = useCallback(() => {
        const nextColumnWidths = [
            ...ensureColumnWidthsArray(table.columnWidths, columnCount),
            DEFAULT_COLUMN_WIDTH,
        ];

        pushChange({
            ...table,
            rows: table.rows.map((row) => [...row, createEmptyCell()]),
            columnWidths: nextColumnWidths,
        });
    }, [columnCount, pushChange, table]);

    const removeColumn = useCallback(
        (columnIndex) => {
            if (columnCount === 1) {
                pushChange({
                    ...table,
                    rows: table.rows.map(() => createEmptyRow(1)),
                    columnWidths: ensureColumnWidthsArray(
                        table.columnWidths,
                        1
                    ),
                });
                return;
            }

            pushChange({
                ...table,
                rows: table.rows.map((row) =>
                    row.filter((_, idx) => idx !== columnIndex)
                ),
                columnWidths: ensureColumnWidthsArray(
                    table.columnWidths,
                    columnCount
                ).filter((_, idx) => idx !== columnIndex),
            });
        },
        [columnCount, pushChange, table]
    );

    const setColumnWidth = useCallback(
        (columnIndex, nextWidth, { emit = true } = {}) => {
            pushChange(
                (previous) => {
                    const columnCountSafe = previous.rows[0]?.length ?? 0;

                    if (!columnCountSafe) {
                        return previous;
                    }

                    const widths = ensureColumnWidthsArray(
                        previous.columnWidths,
                        columnCountSafe
                    );

                    const safeIndex = Math.max(
                        0,
                        Math.min(columnIndex, columnCountSafe - 1)
                    );

                    const normalizedWidth = clampColumnWidthValue(nextWidth);

                    if (widths[safeIndex] === normalizedWidth) {
                        return previous;
                    }

                    widths[safeIndex] = normalizedWidth;

                    return {
                        ...previous,
                        columnWidths: widths,
                    };
                },
                { emit }
            );
        },
        [pushChange]
    );

    const moveRow = useCallback(
        (sourceIndex, targetIndex) => {
            if (!table.rows.length) {
                return;
            }

            const lastIndex = table.rows.length - 1;
            const normalizedSource = Math.max(
                0,
                Math.min(sourceIndex, lastIndex)
            );
            const normalizedTarget = Math.max(
                0,
                Math.min(targetIndex, lastIndex)
            );

            if (normalizedSource === normalizedTarget) {
                return;
            }

            const rowsCopy = [...table.rows];
            const [movedRow] = rowsCopy.splice(normalizedSource, 1);
            rowsCopy.splice(normalizedTarget, 0, movedRow);

            const resolveRowIndex = (originalRowIndex) => {
                if (
                    originalRowIndex < 0 ||
                    originalRowIndex >= table.rows.length
                ) {
                    return originalRowIndex;
                }

                const originalRow = table.rows[originalRowIndex];
                const nextIndex = rowsCopy.indexOf(originalRow);

                return nextIndex === -1 ? originalRowIndex : nextIndex;
            };

            pushChange({ ...table, rows: rowsCopy });

            setActiveCell((prev) => {
                if (!prev) {
                    return prev;
                }

                const nextRowIndex = resolveRowIndex(prev.rowIndex);

                if (nextRowIndex === prev.rowIndex) {
                    return prev;
                }

                return {
                    ...prev,
                    rowIndex: nextRowIndex,
                };
            });

            setOpenCellMenu((prev) => {
                if (!prev) {
                    return prev;
                }

                const nextRowIndex = resolveRowIndex(prev.rowIndex);

                if (nextRowIndex === prev.rowIndex) {
                    return prev;
                }

                return {
                    rowIndex: nextRowIndex,
                    columnIndex: prev.columnIndex,
                };
            });

            setTextSelection((prev) => {
                if (!prev) {
                    return prev;
                }

                const nextRowIndex = resolveRowIndex(prev.rowIndex);

                if (nextRowIndex === prev.rowIndex) {
                    return prev;
                }

                return {
                    ...prev,
                    rowIndex: nextRowIndex,
                };
            });
        },
        [pushChange, table]
    );

    const moveColumn = useCallback(
        (sourceIndex, targetIndex) => {
            if (!table.rows.length || columnCount < 1) {
                return;
            }

            const maxIndex = columnCount - 1;
            const normalizedSource = Math.max(
                0,
                Math.min(sourceIndex, maxIndex)
            );
            const normalizedTarget = Math.max(
                0,
                Math.min(targetIndex, maxIndex)
            );

            if (normalizedSource === normalizedTarget) {
                return;
            }

            const nextRows = table.rows.map((row) => {
                if (!row.length) {
                    return row;
                }

                const updatedRow = [...row];
                const [movedCell] = updatedRow.splice(normalizedSource, 1);
                const insertionIndex = Math.min(
                    normalizedTarget,
                    updatedRow.length
                );

                updatedRow.splice(
                    insertionIndex,
                    0,
                    movedCell ?? createEmptyCell()
                );

                return updatedRow;
            });

            const currentWidths = ensureColumnWidthsArray(
                table.columnWidths,
                columnCount
            );
            const widthsCopy = [...currentWidths];
            const [movedWidth] = widthsCopy.splice(normalizedSource, 1);
            const widthInsertionIndex = Math.min(
                normalizedTarget,
                widthsCopy.length
            );

            widthsCopy.splice(
                widthInsertionIndex,
                0,
                movedWidth ?? DEFAULT_COLUMN_WIDTH
            );

            const resolveColumnIndex = (rowIndex, originalColumnIndex) => {
                const originalRow = table.rows[rowIndex];
                const nextRow = nextRows[rowIndex];

                if (!originalRow || !nextRow) {
                    return originalColumnIndex;
                }

                const originalCell = originalRow[originalColumnIndex];

                if (!originalCell) {
                    return originalColumnIndex;
                }

                const nextIndex = nextRow.indexOf(originalCell);

                return nextIndex === -1 ? originalColumnIndex : nextIndex;
            };

            pushChange({
                ...table,
                rows: nextRows,
                columnWidths: widthsCopy,
            });

            setActiveCell((prev) => {
                if (!prev) {
                    return prev;
                }

                const nextColumnIndex = resolveColumnIndex(
                    prev.rowIndex,
                    prev.columnIndex
                );

                if (nextColumnIndex === prev.columnIndex) {
                    return prev;
                }

                return {
                    ...prev,
                    columnIndex: nextColumnIndex,
                };
            });

            setOpenCellMenu((prev) => {
                if (!prev) {
                    return prev;
                }

                const nextColumnIndex = resolveColumnIndex(
                    prev.rowIndex,
                    prev.columnIndex
                );

                if (nextColumnIndex === prev.columnIndex) {
                    return prev;
                }

                return {
                    rowIndex: prev.rowIndex,
                    columnIndex: nextColumnIndex,
                };
            });

            setTextSelection((prev) => {
                if (!prev) {
                    return prev;
                }

                const nextColumnIndex = resolveColumnIndex(
                    prev.rowIndex,
                    prev.columnIndex
                );

                if (nextColumnIndex === prev.columnIndex) {
                    return prev;
                }

                return {
                    ...prev,
                    columnIndex: nextColumnIndex,
                };
            });
        },
        [columnCount, pushChange, table]
    );

    const handleRowDragStart = useCallback((event, rowIndex) => {
        event.stopPropagation();

        setDraggingRowIndex(rowIndex);
        setRowDragOverIndex(rowIndex);

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(rowIndex));
        }
    }, []);

    const handleRowDragOver = useCallback(
        (event, targetIndex) => {
            if (draggingRowIndex === null) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "move";
            }

            if (rowDragOverIndex !== targetIndex) {
                setRowDragOverIndex(targetIndex);
            }
        },
        [draggingRowIndex, rowDragOverIndex]
    );

    const handleRowDrop = useCallback(
        (event, targetIndex) => {
            if (draggingRowIndex === null) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            moveRow(draggingRowIndex, targetIndex);
            setDraggingRowIndex(null);
            setRowDragOverIndex(null);
        },
        [draggingRowIndex, moveRow]
    );

    const handleRowDragEnd = useCallback(() => {
        setDraggingRowIndex(null);
        setRowDragOverIndex(null);
    }, []);

    const handleColumnDragStart = useCallback((event, columnIndex) => {
        event.stopPropagation();

        setDraggingColumnIndex(columnIndex);
        setColumnDragOverIndex(columnIndex);

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(columnIndex));
        }
    }, []);

    const handleColumnDragOver = useCallback(
        (event, targetIndex) => {
            if (draggingColumnIndex === null) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "move";
            }

            if (columnDragOverIndex !== targetIndex) {
                setColumnDragOverIndex(targetIndex);
            }
        },
        [columnDragOverIndex, draggingColumnIndex]
    );

    const handleColumnDrop = useCallback(
        (event, targetIndex) => {
            if (draggingColumnIndex === null) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            moveColumn(draggingColumnIndex, targetIndex);
            setDraggingColumnIndex(null);
            setColumnDragOverIndex(null);
        },
        [draggingColumnIndex, moveColumn]
    );

    const handleColumnDragEnd = useCallback(() => {
        setDraggingColumnIndex(null);
        setColumnDragOverIndex(null);
    }, []);

    const handleColumnResizeStart = useCallback(
        (event, columnIndex) => {
            const nativeEvent = event?.nativeEvent ?? event;
            const clientX = extractClientX(nativeEvent);

            if (clientX === null) {
                return;
            }

            event.preventDefault?.();
            event.stopPropagation?.();

            const widths = ensureColumnWidthsArray(
                table.columnWidths,
                columnCount
            );

            if (!widths.length) {
                return;
            }

            const safeIndex = Math.max(
                0,
                Math.min(columnIndex, widths.length - 1)
            );

            setColumnResizeState({
                columnIndex: safeIndex,
                startX: clientX,
                startWidth: widths[safeIndex],
            });
        },
        [columnCount, table.columnWidths]
    );

    useEffect(() => {
        if (!columnResizeState) {
            return undefined;
        }

        const { columnIndex, startWidth, startX } = columnResizeState;

        const handlePointerMove = (event) => {
            const nativeEvent = event?.nativeEvent ?? event;
            const clientX = extractClientX(nativeEvent);

            if (clientX === null) {
                return;
            }

            if (nativeEvent?.cancelable) {
                nativeEvent.preventDefault();
            }

            const delta = clientX - startX;
            const nextWidth = startWidth + delta;

            setColumnWidth(columnIndex, nextWidth, { emit: false });
        };

        const handlePointerUp = (event) => {
            const nativeEvent = event?.nativeEvent ?? event;

            if (nativeEvent?.cancelable) {
                nativeEvent.preventDefault();
            }

            setColumnResizeState(null);

            const latestTable = latestTableRef.current;
            const latestWidth = latestTable?.columnWidths?.[columnIndex];

            if (typeof latestWidth === "number" && latestWidth !== startWidth) {
                onChange(latestTable);
            }
        };

        window.addEventListener("mousemove", handlePointerMove);
        window.addEventListener("mouseup", handlePointerUp);
        window.addEventListener("touchmove", handlePointerMove, {
            passive: false,
        });
        window.addEventListener("touchend", handlePointerUp, {
            passive: false,
        });
        window.addEventListener("touchcancel", handlePointerUp, {
            passive: false,
        });

        const previousCursor =
            typeof document !== "undefined"
                ? document.body.style.cursor
                : undefined;

        if (typeof document !== "undefined") {
            document.body.style.cursor = "col-resize";
        }

        return () => {
            window.removeEventListener("mousemove", handlePointerMove);
            window.removeEventListener("mouseup", handlePointerUp);
            window.removeEventListener("touchmove", handlePointerMove);
            window.removeEventListener("touchend", handlePointerUp);
            window.removeEventListener("touchcancel", handlePointerUp);

            if (
                typeof document !== "undefined" &&
                previousCursor !== undefined
            ) {
                document.body.style.cursor = previousCursor;
            }
        };
    }, [columnResizeState, onChange, setColumnWidth]);

    const applyLinkToSelection = useCallback(
        (nextLinkValue, selectionOverride = null) => {
            const selection = selectionOverride ?? textSelection;

            if (!selection) {
                return null;
            }

            const { rowIndex, columnIndex } = selection;

            let nextSelectionStart = selection.start;
            let nextSelectionEnd = selection.end;
            let nextSelectionText = "";

            updateCell(rowIndex, columnIndex, (current) => {
                const normalized = normalizeCell(current);
                const textLength = normalized.text.length;

                const rawStart = Math.max(
                    0,
                    Math.min(selection.start, selection.end)
                );
                const rawEnd = Math.max(
                    0,
                    Math.max(selection.start, selection.end)
                );

                const start = Math.min(rawStart, textLength);
                const end = Math.min(rawEnd, textLength);

                if (end <= start) {
                    nextSelectionStart = start;
                    nextSelectionEnd = end;
                    nextSelectionText = normalized.text.slice(start, end);
                    return normalized;
                }

                const baseParts = normalized.textParts.length
                    ? normalized.textParts.map((part) => ({
                          text: part.text,
                          link: part.link || "",
                      }))
                    : normalized.text.length
                    ? [
                          {
                              text: normalized.text,
                              link: normalized.link || "",
                          },
                      ]
                    : [];

                if (!baseParts.length) {
                    nextSelectionStart = start;
                    nextSelectionEnd = end;
                    nextSelectionText = normalized.text.slice(start, end);
                    return normalized;
                }

                const trimmedLink = nextLinkValue.trim();
                let cursor = 0;
                const splitParts = [];

                baseParts.forEach((part) => {
                    const partText = part.text;
                    const partStart = cursor;
                    const partEnd = cursor + partText.length;

                    if (end <= partStart || start >= partEnd) {
                        splitParts.push({
                            text: partText,
                            link: part.link || "",
                        });
                        cursor += partText.length;
                        return;
                    }

                    const overlapStart = Math.max(start, partStart);
                    const overlapEnd = Math.min(end, partEnd);
                    const relativeStart = overlapStart - partStart;
                    const relativeEnd = overlapEnd - partStart;

                    const leadingText = partText.slice(0, relativeStart);
                    const overlappedText = partText.slice(
                        relativeStart,
                        relativeEnd
                    );
                    const trailingText = partText.slice(relativeEnd);

                    if (leadingText.length) {
                        splitParts.push({
                            text: leadingText,
                            link: part.link || "",
                        });
                    }

                    if (overlappedText.length) {
                        splitParts.push({
                            text: overlappedText,
                            link: trimmedLink,
                        });
                    }

                    if (trailingText.length) {
                        splitParts.push({
                            text: trailingText,
                            link: part.link || "",
                        });
                    }

                    cursor += partText.length;
                });

                const mergedParts = [];

                splitParts.forEach((part) => {
                    if (!part.text.length) {
                        return;
                    }

                    const normalizedLink = part.link || "";
                    const lastPart = mergedParts[mergedParts.length - 1];

                    if (lastPart && (lastPart.link || "") === normalizedLink) {
                        lastPart.text += part.text;
                        return;
                    }

                    mergedParts.push({
                        text: part.text,
                        link: normalizedLink,
                    });
                });

                const nextText = mergedParts.map((part) => part.text).join("");

                let nextLink = "";
                let nextTextParts = mergedParts;

                if (!mergedParts.length) {
                    nextTextParts = [];
                } else if (mergedParts.length === 1) {
                    const [singlePart] = mergedParts;

                    if (singlePart.link) {
                        nextLink = singlePart.link;
                        nextTextParts = [];
                    } else {
                        nextTextParts = [];
                    }
                } else if (!mergedParts.some((part) => part.link)) {
                    nextTextParts = [];
                }

                nextSelectionStart = start;
                nextSelectionEnd = end;
                nextSelectionText = nextText.slice(start, end);

                return {
                    ...normalized,
                    text: nextText,
                    link: nextLink,
                    textParts: nextTextParts,
                };
            });

            setTextSelection((prev) => {
                if (
                    prev &&
                    prev.rowIndex === rowIndex &&
                    prev.columnIndex === columnIndex
                ) {
                    return {
                        ...prev,
                        start: nextSelectionStart,
                        end: nextSelectionEnd,
                        text: nextSelectionText,
                    };
                }

                if (selectionOverride) {
                    return {
                        rowIndex,
                        columnIndex,
                        start: nextSelectionStart,
                        end: nextSelectionEnd,
                        text: nextSelectionText,
                    };
                }

                return prev;
            });

            return {
                rowIndex,
                columnIndex,
                start: nextSelectionStart,
                end: nextSelectionEnd,
            };
        },
        [textSelection, updateCell]
    );

    const focusSelectionInput = useCallback(
        (selectionOverride = null) => {
            const selection = selectionOverride ?? textSelection;

            if (!selection) {
                return;
            }

            const cellKey = getCellKey(
                selection.rowIndex,
                selection.columnIndex
            );
            const input = inputRefs.current.get(cellKey);

            if (!input || typeof input.focus !== "function") {
                return;
            }

            const start = selection.start ?? 0;
            const end = selection.end ?? start;

            input.focus();

            if (typeof input.setSelectionRange === "function") {
                const normalizedStart = Math.max(0, Math.min(start, end));
                const normalizedEnd = Math.max(normalizedStart, end);
                input.setSelectionRange(normalizedStart, normalizedEnd);
            }
        },
        [getCellKey, textSelection]
    );

    const selectCellRange = useCallback(
        (rowIndex, columnIndex, start, end) => {
            const targetRow = table.rows[rowIndex];

            if (!targetRow) {
                return null;
            }

            const targetCell = targetRow[columnIndex];

            if (!targetCell) {
                return null;
            }

            const normalized = normalizeCell(targetCell);
            const text = normalized.text ?? "";
            const textLength = text.length;

            const startClamped = Math.max(0, Math.min(start, textLength));
            const endClamped = Math.max(0, Math.min(end, textLength));

            const selectionStart = Math.min(startClamped, endClamped);
            const selectionEnd = Math.max(startClamped, endClamped);

            if (selectionEnd <= selectionStart) {
                return null;
            }

            const selection = {
                rowIndex,
                columnIndex,
                start: selectionStart,
                end: selectionEnd,
                text: text.slice(selectionStart, selectionEnd),
            };

            setTextSelection(selection);

            const focusTarget = () => {
                focusSelectionInput(selection);
            };

            if (typeof window !== "undefined") {
                window.requestAnimationFrame(focusTarget);
            } else {
                focusTarget();
            }

            return selection;
        },
        [focusSelectionInput, setTextSelection, table.rows]
    );

    const handleEditLinkedSegment = useCallback(
        (rowIndex, columnIndex, segment) => {
            if (!segment) {
                return;
            }

            setActiveCell({ rowIndex, columnIndex });

            const selection = selectCellRange(
                rowIndex,
                columnIndex,
                segment.start,
                segment.end
            );

            if (!selection) {
                return;
            }

            setLinkDraftValue(segment.link || "");
            setIsLinkPopoverOpen(true);
        },
        [
            selectCellRange,
            setActiveCell,
            setIsLinkPopoverOpen,
            setLinkDraftValue,
        ]
    );

    const handleRemoveLinkedSegment = useCallback(
        (rowIndex, columnIndex, segment) => {
            if (!segment) {
                return;
            }

            setActiveCell({ rowIndex, columnIndex });

            const selection = selectCellRange(
                rowIndex,
                columnIndex,
                segment.start,
                segment.end
            );

            if (!selection) {
                return;
            }

            const selectionSnapshot = applyLinkToSelection("", selection);
            const focusTarget = selectionSnapshot ?? selection;

            const runFocus = () => {
                focusSelectionInput(focusTarget);
            };

            if (typeof window !== "undefined") {
                window.requestAnimationFrame(runFocus);
            } else {
                runFocus();
            }
        },
        [
            applyLinkToSelection,
            focusSelectionInput,
            selectCellRange,
            setActiveCell,
        ]
    );

    const handleLinkDraftChange = useCallback((value) => {
        setLinkDraftValue(value);
    }, []);

    const handleLinkPopoverSubmit = useCallback(
        (value) => {
            const selectionSnapshot = applyLinkToSelection(value);
            setIsLinkPopoverOpen(false);

            const focusTarget = selectionSnapshot ?? textSelection;

            if (typeof window !== "undefined") {
                window.requestAnimationFrame(() => {
                    focusSelectionInput(focusTarget);
                });
            } else {
                focusSelectionInput(focusTarget);
            }
        },
        [applyLinkToSelection, focusSelectionInput, textSelection]
    );

    const handleLinkPopoverClose = useCallback(() => {
        setIsLinkPopoverOpen(false);

        if (typeof window !== "undefined") {
            window.requestAnimationFrame(() => {
                focusSelectionInput();
            });
        } else {
            focusSelectionInput();
        }
    }, [focusSelectionInput]);

    const handleOpenLinkPopover = useCallback(() => {
        setIsPdfPopoverOpen(false);

        let initialValue = "";

        if (textSelection && hasTextSelection) {
            const { rowIndex, columnIndex, start, end } = textSelection;
            const targetRow = table.rows[rowIndex];
            const targetCell = targetRow?.[columnIndex];

            if (targetCell) {
                const normalized = normalizeCell(targetCell);
                const parts = normalized.textParts.length
                    ? normalized.textParts
                    : normalized.text.length
                    ? [
                          {
                              text: normalized.text,
                              link: normalized.link || "",
                          },
                      ]
                    : [];

                if (parts.length) {
                    let cursor = 0;
                    let candidate = null;

                    for (const part of parts) {
                        const partStart = cursor;
                        const partEnd = cursor + part.text.length;

                        if (end <= partStart) {
                            break;
                        }

                        if (start >= partEnd) {
                            cursor = partEnd;
                            continue;
                        }

                        const partLink = (part.link || "").trim();

                        if (candidate === null) {
                            candidate = partLink;
                        } else if (candidate !== partLink) {
                            candidate = "";
                            break;
                        }

                        cursor = partEnd;
                    }

                    initialValue = candidate ?? "";
                }
            }
        }

        setLinkDraftValue(initialValue);
        setIsLinkPopoverOpen(true);
    }, [hasTextSelection, table, textSelection]);

    const handlePdfDraftChange = useCallback((value) => {
        setPdfLinkError("");
        setPdfLinkDraftValue(value);
    }, []);

    const handlePdfPopoverSubmit = useCallback(
        (value) => {
            const targetSelection =
                hasTextSelection && textSelection
                    ? textSelection
                    : pdfSelectionSnapshotRef.current;

            if (!targetSelection) {
                setPdfLinkError(
                    "Виділіть текст у клітинці, щоб додати посилання."
                );
                return;
            }

            const rawValue = typeof value === "string" ? value.trim() : "";

            if (!rawValue) {
                const selectionSnapshot = applyLinkToSelection(
                    "",
                    targetSelection
                );
                setPdfLinkDraftValue("");
                setPdfLinkError("");
                setIsPdfPopoverOpen(false);
                lastPdfHandledPathRef.current = null;

                const focusTarget = selectionSnapshot ?? targetSelection;
                pdfSelectionSnapshotRef.current = null;

                if (typeof window !== "undefined") {
                    window.requestAnimationFrame(() => {
                        focusSelectionInput(focusTarget);
                    });
                } else {
                    focusSelectionInput(focusTarget);
                }

                return;
            }

            const normalized = normalizePdfPath(rawValue);

            if (!normalized || !isPdfPath(normalized)) {
                setPdfLinkError("Вкажіть внутрішнє посилання на PDF-файл.");
                return;
            }

            setPdfLinkDraftValue(normalized);
            setPdfLinkError("");

            const selectionSnapshot = applyLinkToSelection(
                normalized,
                targetSelection
            );
            setIsPdfPopoverOpen(false);
            lastPdfHandledPathRef.current = normalized;

            const focusTarget = selectionSnapshot ?? targetSelection;
            pdfSelectionSnapshotRef.current = null;

            if (typeof window !== "undefined") {
                window.requestAnimationFrame(() => {
                    focusSelectionInput(focusTarget);
                });
            } else {
                focusSelectionInput(focusTarget);
            }
        },
        [
            applyLinkToSelection,
            focusSelectionInput,
            hasTextSelection,
            textSelection,
        ]
    );

    const handlePdfPopoverClose = useCallback(() => {
        const targetSelection =
            hasTextSelection && textSelection
                ? textSelection
                : pdfSelectionSnapshotRef.current;

        setIsPdfPopoverOpen(false);
        setPdfLinkError("");

        const focusTarget = targetSelection ?? undefined;
        pdfSelectionSnapshotRef.current = null;

        const runFocus = () => {
            if (focusTarget) {
                focusSelectionInput(focusTarget);
            } else {
                focusSelectionInput();
            }
        };

        if (typeof window !== "undefined") {
            window.requestAnimationFrame(runFocus);
        } else {
            runFocus();
        }
    }, [focusSelectionInput, hasTextSelection, textSelection]);

    const handleOpenPdfPopover = useCallback(() => {
        setPdfLinkError("");

        let initialValue = "";

        if (textSelection && hasTextSelection) {
            pdfSelectionSnapshotRef.current = textSelection;

            const { rowIndex, columnIndex, start, end } = textSelection;
            const targetRow = table.rows[rowIndex];
            const targetCell = targetRow?.[columnIndex];

            if (targetCell) {
                const normalizedCell = normalizeCell(targetCell);
                const parts = normalizedCell.textParts.length
                    ? normalizedCell.textParts
                    : normalizedCell.text.length
                    ? [
                          {
                              text: normalizedCell.text,
                              link: normalizedCell.link || "",
                          },
                      ]
                    : [];

                if (parts.length) {
                    let cursor = 0;
                    let candidate = null;

                    for (const part of parts) {
                        const partStart = cursor;
                        const partEnd = cursor + part.text.length;

                        if (end <= partStart) {
                            break;
                        }

                        if (start >= partEnd) {
                            cursor = partEnd;
                            continue;
                        }

                        const partLink = (part.link || "").trim();

                        if (partLink && isPdfPath(partLink)) {
                            const normalizedLink = normalizePdfPath(partLink);

                            if (candidate === null) {
                                candidate = normalizedLink;
                            } else if (candidate !== normalizedLink) {
                                candidate = "";
                                break;
                            }
                        } else {
                            candidate = "";
                            break;
                        }

                        cursor = partEnd;
                    }

                    if (typeof candidate === "string" && candidate) {
                        initialValue = candidate;
                    }
                }
            }
        }

        setPdfLinkDraftValue(initialValue);
        setIsPdfPopoverOpen(true);
    }, [hasTextSelection, table, textSelection]);

    const handleBrowsePdf = useCallback(() => {
        if (!mediaLibraryAvailable) {
            return;
        }

        const targetSelection =
            hasTextSelection && textSelection
                ? textSelection
                : pdfSelectionSnapshotRef.current;

        if (!targetSelection) {
            setPdfLinkError("Виділіть текст у клітинці, щоб додати посилання.");
            return;
        }

        pdfSelectionSnapshotRef.current = targetSelection;
        setPdfLinkError("");

        if (typeof onClearMediaControl === "function") {
            onClearMediaControl(pdfMediaControlID);
        }

        const normalizedCurrent = normalizePdfPath(pdfLinkDraftValue);
        const initialValue = normalizedCurrent ? [normalizedCurrent] : [];

        const fieldMediaLibrary =
            field && typeof field.get === "function"
                ? field.get("media_library")
                : field?.media_library;

        const mediaConfig =
            fieldMediaLibrary && typeof fieldMediaLibrary.get === "function"
                ? fieldMediaLibrary.get("config")
                : fieldMediaLibrary?.config;

        const privateUpload = Boolean(
            field && typeof field.get === "function"
                ? field.get("private")
                : field?.private
        );

        if (typeof onOpenMediaLibrary === "function") {
            onOpenMediaLibrary({
                controlID: pdfMediaControlID,
                forImage: false,
                allowMultiple: false,
                privateUpload,
                value: initialValue,
                config: mediaConfig,
                field,
            });
        }
    }, [
        field,
        hasTextSelection,
        mediaLibraryAvailable,
        onClearMediaControl,
        onOpenMediaLibrary,
        pdfLinkDraftValue,
        pdfMediaControlID,
        textSelection,
    ]);

    const handlePdfLinkRemove = useCallback(() => {
        const targetSelection =
            hasTextSelection && textSelection
                ? textSelection
                : pdfSelectionSnapshotRef.current;

        if (!targetSelection) {
            setPdfLinkError(
                "Виділіть текст у клітинці, щоб прибрати посилання."
            );
            return;
        }

        const selectionSnapshot = applyLinkToSelection("", targetSelection);
        setPdfLinkDraftValue("");
        setPdfLinkError("");
        setIsPdfPopoverOpen(false);
        lastPdfHandledPathRef.current = null;

        const focusTarget = selectionSnapshot ?? targetSelection;
        pdfSelectionSnapshotRef.current = null;

        if (typeof window !== "undefined") {
            window.requestAnimationFrame(() => {
                focusSelectionInput(focusTarget);
            });
        } else {
            focusSelectionInput(focusTarget);
        }
    }, [
        applyLinkToSelection,
        focusSelectionInput,
        hasTextSelection,
        textSelection,
    ]);

    useEffect(() => {
        if (typeof document === "undefined") {
            return undefined;
        }

        if (!isEditorOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isEditorOpen]);

    const pdfPopoverSelection =
        hasTextSelection && textSelection
            ? textSelection
            : pdfSelectionSnapshotRef.current;

    const editorContent = (
        <>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                }}
            >
                <label
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                    }}
                >
                    <span
                        style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                        }}
                    >
                        Назва таблиці
                    </span>
                    <input
                        type="text"
                        value={table.caption}
                        onChange={(event) =>
                            pushChange({
                                ...table,
                                caption: event.target.value,
                            })
                        }
                        placeholder="Введіть назву таблиці"
                        style={{
                            padding: "0.5rem 0.65rem",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            boxSizing: "border-box",
                        }}
                    />
                </label>
                <div
                    style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <button
                        type="button"
                        className="nc-button"
                        onClick={addRow}
                        style={{ fontSize: "12px", cursor: "pointer" }}
                    >
                        ➕ Додати рядок
                    </button>
                    <button
                        type="button"
                        className="nc-button"
                        onClick={addColumn}
                        style={{ fontSize: "12px", cursor: "pointer" }}
                    >
                        ➕ Додати стовпчик
                    </button>
                </div>
            </div>

            <div style={{ overflowX: "auto", height: "87%" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "360px",
                        tableLayout: "fixed",
                    }}
                >
                    <colgroup>
                        <col
                            style={{
                                width: "40px",
                                minWidth: "40px",
                                maxWidth: "40px",
                            }}
                        />
                        {(table.rows[0] ?? []).map((_, colIndex) => (
                            <col
                                key={`editor-column-${colIndex}`}
                                style={{
                                    width: `${
                                        columnWidths[colIndex] ??
                                        DEFAULT_COLUMN_WIDTH
                                    }px`,
                                    minWidth: `${
                                        columnWidths[colIndex] ??
                                        DEFAULT_COLUMN_WIDTH
                                    }px`,
                                }}
                            />
                        ))}
                    </colgroup>
                    <thead>
                        <tr>
                            <th style={{ width: "40px" }} />
                            {table.rows[0].map((_, colIndex) => {
                                const isColumnDragTarget =
                                    draggingColumnIndex !== null &&
                                    columnDragOverIndex === colIndex;
                                const isColumnResizing =
                                    columnResizeState?.columnIndex === colIndex;

                                return (
                                    <th
                                        key={`column-${colIndex}`}
                                        onDragOver={(event) =>
                                            handleColumnDragOver(
                                                event,
                                                colIndex
                                            )
                                        }
                                        onDrop={(event) =>
                                            handleColumnDrop(event, colIndex)
                                        }
                                        style={{
                                            border: "1px solid #dcdcdc",
                                            background: isColumnDragTarget
                                                ? "#e0f2fe"
                                                : isColumnResizing
                                                ? "#eaf2ff"
                                                : "#f7f7f7",
                                            padding: "0.25rem",
                                            boxShadow: isColumnDragTarget
                                                ? "inset 0 0 0 1px #3b82f6"
                                                : undefined,
                                            position: "relative",
                                            userSelect: "none",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.25rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#4b5563",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {Math.round(
                                                    columnWidths[colIndex] ??
                                                        DEFAULT_COLUMN_WIDTH
                                                )}
                                                px
                                            </span>
                                            <button
                                                type="button"
                                                className="nc-button"
                                                draggable
                                                onDragStart={(event) =>
                                                    handleColumnDragStart(
                                                        event,
                                                        colIndex
                                                    )
                                                }
                                                onDragEnd={handleColumnDragEnd}
                                                style={{
                                                    width: "100%",
                                                    fontSize: "12px",
                                                    cursor:
                                                        draggingColumnIndex ===
                                                        colIndex
                                                            ? "grabbing"
                                                            : "grab",
                                                }}
                                                aria-label={`Перемістити стовпчик ${
                                                    colIndex + 1
                                                }`}
                                                title="Перетягніть, щоб перемістити стовпчик"
                                            >
                                                ↔️
                                            </button>
                                            <button
                                                type="button"
                                                className="nc-button"
                                                onClick={() =>
                                                    removeColumn(colIndex)
                                                }
                                                style={{
                                                    width: "100%",
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ❌ Стовпчик {colIndex + 1}
                                            </button>
                                        </div>
                                        <div
                                            role="presentation"
                                            onMouseDown={(event) =>
                                                handleColumnResizeStart(
                                                    event,
                                                    colIndex
                                                )
                                            }
                                            onTouchStart={(event) =>
                                                handleColumnResizeStart(
                                                    event,
                                                    colIndex
                                                )
                                            }
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                right: 0,
                                                width: "6px",
                                                height: "100%",
                                                cursor: "col-resize",
                                                zIndex: 2,
                                            }}
                                        />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rows.map((row, rowIndex) => {
                            const isActiveRow =
                                activeCell?.rowIndex === rowIndex;
                            const fallbackColumnIndex = Math.max(
                                row.length - 1,
                                0
                            );
                            const selectedColumnIndex = isActiveRow
                                ? Math.min(
                                      activeCell.columnIndex,
                                      fallbackColumnIndex
                                  )
                                : 0;
                            const activeRowCell =
                                row[selectedColumnIndex] ?? row[0];
                            const canEditActiveCell =
                                isActiveRow && Boolean(activeRowCell);
                            const linkedSegments = canEditActiveCell
                                ? getLinkedSegmentsForCell(
                                      rowIndex,
                                      selectedColumnIndex
                                  )
                                : [];
                            const activeSelectionRange =
                                textSelection &&
                                textSelection.rowIndex === rowIndex &&
                                textSelection.columnIndex ===
                                    selectedColumnIndex
                                    ? textSelection
                                    : null;

                            return (
                                <tr
                                    key={`row-${rowIndex}`}
                                    onDragOver={(event) =>
                                        handleRowDragOver(event, rowIndex)
                                    }
                                    onDrop={(event) =>
                                        handleRowDrop(event, rowIndex)
                                    }
                                    style={{
                                        opacity:
                                            draggingRowIndex === rowIndex
                                                ? 0.6
                                                : 1,
                                    }}
                                >
                                    <td
                                        style={{
                                            border: "1px solid #dcdcdc",
                                            background:
                                                rowDragOverIndex === rowIndex
                                                    ? "#e0f2fe"
                                                    : "#f7f7f7",
                                            padding: "0.25rem",
                                            verticalAlign: "top",
                                            position: "relative",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.25rem",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="nc-button"
                                                draggable
                                                onDragStart={(event) =>
                                                    handleRowDragStart(
                                                        event,
                                                        rowIndex
                                                    )
                                                }
                                                onDragEnd={handleRowDragEnd}
                                                style={{
                                                    width: "100%",
                                                    fontSize: "12px",
                                                    cursor:
                                                        draggingRowIndex ===
                                                        rowIndex
                                                            ? "grabbing"
                                                            : "grab",
                                                }}
                                                aria-label={`Перемістити рядок ${
                                                    rowIndex + 1
                                                }`}
                                                title="Перетягніть, щоб перемістити рядок"
                                            >
                                                ↕️
                                            </button>
                                            <button
                                                type="button"
                                                className="nc-button"
                                                onClick={() =>
                                                    removeRow(rowIndex)
                                                }
                                                style={{
                                                    width: "100%",
                                                    fontSize: "12px",
                                                    height: "33px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    </td>
                                    {row.map((cell, columnIndex) => {
                                        const menuIsOpen =
                                            openCellMenu?.rowIndex ===
                                                rowIndex &&
                                            openCellMenu?.columnIndex ===
                                                columnIndex;
                                        const cellKey = getCellKey(
                                            rowIndex,
                                            columnIndex
                                        );
                                        const currentColumnWidth =
                                            columnWidths[columnIndex] ??
                                            DEFAULT_COLUMN_WIDTH;
                                        const isColumnResizeActive =
                                            columnResizeState?.columnIndex ===
                                            columnIndex;

                                        return (
                                            <td
                                                key={`cell-${rowIndex}-${columnIndex}`}
                                                style={{
                                                    border: "1px solid #dcdcdc",
                                                    padding: "0.25rem",
                                                    verticalAlign:
                                                        cell.verticalAlignment,
                                                    width: `${currentColumnWidth}px`,
                                                    minWidth: `${currentColumnWidth}px`,
                                                    maxWidth: `${currentColumnWidth}px`,
                                                    background:
                                                        rowDragOverIndex ===
                                                            rowIndex ||
                                                        (draggingColumnIndex !==
                                                            null &&
                                                            columnDragOverIndex ===
                                                                columnIndex) ||
                                                        isColumnResizeActive
                                                            ? "#f8fbff"
                                                            : undefined,
                                                    boxShadow:
                                                        draggingColumnIndex !==
                                                            null &&
                                                        columnDragOverIndex ===
                                                            columnIndex
                                                            ? "inset 0 0 0 1px #3b82f6"
                                                            : isColumnResizeActive
                                                            ? "inset 0 0 0 1px #2563eb"
                                                            : undefined,
                                                    position: "relative",
                                                }}
                                            >
                                                <div
                                                    ref={(node) => {
                                                        if (node) {
                                                            cellRefs.current.set(
                                                                cellKey,
                                                                node
                                                            );
                                                        } else {
                                                            cellRefs.current.delete(
                                                                cellKey
                                                            );
                                                        }
                                                    }}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "0.25rem",
                                                        position: "relative",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "row-reverse",
                                                            gap: "0.25rem",
                                                            position:
                                                                "relative",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="nc-button"
                                                            onClick={() =>
                                                                handleCellMenuToggle(
                                                                    rowIndex,
                                                                    columnIndex
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "0.25rem 0.35rem",
                                                                fontSize:
                                                                    "12px",
                                                                lineHeight: 1,
                                                                height: "-webkit-fill-available",
                                                                minWidth:
                                                                    "28px",
                                                                cursor: "pointer",
                                                            }}
                                                            aria-expanded={
                                                                menuIsOpen
                                                            }
                                                            aria-label={`Показати налаштування реагування для рядка ${
                                                                rowIndex + 1
                                                            } і стовпця ${
                                                                columnIndex + 1
                                                            }`}
                                                        >
                                                            ···
                                                        </button>
                                                        <CellFormattingPreview
                                                            cell={cell}
                                                            variant="table"
                                                        />
                                                    </div>
                                                    <FormattingPopover
                                                        isOpen={menuIsOpen}
                                                        rowIndex={rowIndex}
                                                        row={row}
                                                        selectedColumnIndex={
                                                            selectedColumnIndex
                                                        }
                                                        isActiveRow={
                                                            isActiveRow
                                                        }
                                                        canEditActiveCell={
                                                            canEditActiveCell
                                                        }
                                                        activeRowCell={
                                                            activeRowCell
                                                        }
                                                        anchorRect={
                                                            popoverAnchor
                                                        }
                                                        onSelectColumn={(
                                                            nextColumnIndex
                                                        ) =>
                                                            handleColumnSelect(
                                                                rowIndex,
                                                                nextColumnIndex
                                                            )
                                                        }
                                                        onToggleBold={() =>
                                                            updateActiveCell(
                                                                (current) => ({
                                                                    ...current,
                                                                    bold: !current.bold,
                                                                })
                                                            )
                                                        }
                                                        onToggleItalic={() =>
                                                            updateActiveCell(
                                                                (current) => ({
                                                                    ...current,
                                                                    italic: !current.italic,
                                                                })
                                                            )
                                                        }
                                                        onToggleUnderline={() =>
                                                            updateActiveCell(
                                                                (current) => ({
                                                                    ...current,
                                                                    underline:
                                                                        !current.underline,
                                                                })
                                                            )
                                                        }
                                                        onFontSizeChange={(
                                                            nextValue
                                                        ) =>
                                                            updateActiveCell({
                                                                fontSize:
                                                                    nextValue,
                                                            })
                                                        }
                                                        onLinkChange={(
                                                            nextValue
                                                        ) =>
                                                            updateActiveCell({
                                                                link: nextValue,
                                                            })
                                                        }
                                                        onAlignmentChange={(
                                                            nextValue
                                                        ) =>
                                                            updateActiveCell({
                                                                alignment:
                                                                    nextValue,
                                                            })
                                                        }
                                                        onVerticalAlignmentChange={(
                                                            nextValue
                                                        ) =>
                                                            updateActiveCell({
                                                                verticalAlignment:
                                                                    nextValue,
                                                            })
                                                        }
                                                        onInsertSymbol={(
                                                            symbol
                                                        ) =>
                                                            updateActiveCell(
                                                                (current) => {
                                                                    const baseText =
                                                                        current.text?.trimEnd() ??
                                                                        "";
                                                                    const separator =
                                                                        baseText &&
                                                                        !baseText.endsWith(
                                                                            " "
                                                                        )
                                                                            ? " "
                                                                            : "";

                                                                    return {
                                                                        ...current,
                                                                        text: baseText
                                                                            ? `${baseText}${separator}${symbol}`
                                                                            : symbol,
                                                                    };
                                                                }
                                                            )
                                                        }
                                                        onClose={closeCellMenu}
                                                        fontSizeOptions={
                                                            FONT_SIZE_OPTIONS
                                                        }
                                                        cellKey={cellKey}
                                                        hasTextSelection={
                                                            hasTextSelection
                                                        }
                                                        onOpenLinkPopover={
                                                            handleOpenLinkPopover
                                                        }
                                                        onOpenPdfPopover={
                                                            handleOpenPdfPopover
                                                        }
                                                        linkButtonRef={
                                                            linkButtonRef
                                                        }
                                                        linkPdfButtonRef={
                                                            linkPdfButtonRef
                                                        }
                                                        canUseMediaLibrary={
                                                            mediaLibraryAvailable
                                                        }
                                                        linkedSegments={
                                                            linkedSegments
                                                        }
                                                        activeSelectionRange={
                                                            activeSelectionRange
                                                        }
                                                        onEditLinkedSegment={(
                                                            segment
                                                        ) =>
                                                            handleEditLinkedSegment(
                                                                rowIndex,
                                                                selectedColumnIndex,
                                                                segment
                                                            )
                                                        }
                                                        onRemoveLinkedSegment={(
                                                            segment
                                                        ) =>
                                                            handleRemoveLinkedSegment(
                                                                rowIndex,
                                                                selectedColumnIndex,
                                                                segment
                                                            )
                                                        }
                                                        registerInputRef={
                                                            registerInputRef
                                                        }
                                                        captureSelectionFromInput={
                                                            captureSelectionFromInput
                                                        }
                                                        setActiveCell={
                                                            setActiveCell
                                                        }
                                                        updateCell={updateCell}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <LinkPopover
                isOpen={isLinkPopoverOpen}
                anchorElement={linkButtonRef.current}
                value={linkDraftValue}
                onChange={handleLinkDraftChange}
                onSubmit={handleLinkPopoverSubmit}
                onCancel={handleLinkPopoverClose}
                hasSelection={hasTextSelection}
                selectedText={textSelection?.text ?? ""}
            />
            <LinkPdfPopover
                isOpen={isPdfPopoverOpen}
                anchorElement={linkPdfButtonRef.current}
                value={pdfLinkDraftValue}
                onChange={handlePdfDraftChange}
                onSubmit={handlePdfPopoverSubmit}
                onCancel={handlePdfPopoverClose}
                onBrowse={mediaLibraryAvailable ? handleBrowsePdf : undefined}
                onRemove={handlePdfLinkRemove}
                hasSelection={Boolean(pdfPopoverSelection)}
                selectedText={pdfPopoverSelection?.text ?? ""}
                canBrowse={mediaLibraryAvailable}
                errorMessage={pdfLinkError}
            />
        </>
    );

    const captionText = table.caption?.trim() || "Без назви";
    const sizeText = `${rowCount} рядків • ${columnCount} стовпців`;

    return (
        <div id={forID} className={classNameWrapper}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        padding: "0.75rem 1rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        background: "#f9fafb",
                    }}
                >
                    <span
                        style={{
                            fontSize: "0.95rem",
                            fontWeight: 600,
                        }}
                    >
                        {captionText}
                    </span>
                    <span
                        style={{
                            fontSize: "0.8125rem",
                            color: "#6b7280",
                        }}
                    >
                        {sizeText}
                    </span>
                    <span
                        style={{
                            fontSize: "0.8125rem",
                            color: "#4b5563",
                        }}
                    >
                        {previewNote}
                    </span>
                </div>
                <div>
                    <button
                        type="button"
                        className="nc-button"
                        onClick={openEditor}
                        style={{ fontSize: "12px", cursor: "pointer" }}
                    >
                        ✏️ Редагувати таблицю
                    </button>
                </div>
            </div>

            {isEditorOpen ? (
                <Modal title="Редагування таблиці" onClose={closeEditor}>
                    {editorContent}
                </Modal>
            ) : null}
        </div>
    );
};

TableControl.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
        PropTypes.string,
    ]),
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    classNameWrapper: PropTypes.string,
    field: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    mediaPaths: PropTypes.any,
    onOpenMediaLibrary: PropTypes.func,
    onClearMediaControl: PropTypes.func,
    onRemoveInsertedMedia: PropTypes.func,
    onRemoveMediaControl: PropTypes.func,
};

TableControl.defaultProps = {
    value: null,
    forID: undefined,
    classNameWrapper: undefined,
    field: undefined,
    mediaPaths: undefined,
    onOpenMediaLibrary: undefined,
    onClearMediaControl: undefined,
    onRemoveInsertedMedia: undefined,
    onRemoveMediaControl: undefined,
};

export default TableControl;
