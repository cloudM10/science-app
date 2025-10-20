import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import ToggleButton from "./ToggleButton";
import CellTextarea from "./CellTextarea";
import {
    SYMBOL_SNIPPET_OPTIONS,
    TEXT_ALIGNMENT_OPTIONS,
    VERTICAL_ALIGNMENT_OPTIONS,
} from "../constants";
import { createPortal } from "react-dom";

const popoverStyles = {
    background: "#ffffff",
    border: "1px solid #dcdcdc",
    borderRadius: "8px",
    padding: "0.75rem",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.18)",
    minWidth: "280px",
};

const stackLabelStyles = {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    marginBottom: "0.75rem",
    fontSize: "0.8125rem",
};

const stackLabelColSelectedStyles = {
    display: "none",
    flexDirection: "column",
    gap: "0.25rem",
    marginBottom: "0.75rem",
    fontSize: "0.8125rem",
};

const FormattingPopover = ({
    isOpen,
    rowIndex,
    row,
    selectedColumnIndex,
    isActiveRow,
    canEditActiveCell,
    activeRowCell,
    anchorRect,
    onSelectColumn,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
    onFontSizeChange,
    onLinkChange,
    onAlignmentChange,
    onVerticalAlignmentChange,
    onInsertSymbol,
    onClose,
    fontSizeOptions,
    cellKey,
    registerInputRef,
    captureSelectionFromInput,
    setActiveCell,
    updateCell,
    onOpenLinkPopover,
    onOpenPdfPopover,
    hasTextSelection,
    linkButtonRef,
    linkPdfButtonRef,
    canUseMediaLibrary,
    linkedSegments,
    activeSelectionRange,
    onEditLinkedSegment,
    onRemoveLinkedSegment,
}) => {
    const [symbolValue, setSymbolValue] = useState("");
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isPositionReady, setIsPositionReady] = useState(false);
    const containerRef = useRef(null);
    const hasLinkedSegments = Array.isArray(linkedSegments)
        ? linkedSegments.length > 0
        : false;

    const pdfButtonEnabled = hasTextSelection && canUseMediaLibrary;
    const pdfButtonTitle = canUseMediaLibrary
        ? pdfButtonEnabled
            ? "Додати PDF-файл із медіатеки"
            : "Виділіть текст у клітинці, щоб додати PDF-посилання"
        : "Функція медіатеки недоступна";

    useEffect(() => {
        if (!isOpen) {
            setSymbolValue("");
            setIsPositionReady(false);
        }
    }, [isOpen]);

    useLayoutEffect(() => {
        if (
            !isOpen ||
            !anchorRect ||
            typeof window === "undefined" ||
            !containerRef.current
        ) {
            return;
        }

        const spacing = 12;
        const { innerWidth, innerHeight } = window;
        const element = containerRef.current;
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        let nextLeft = anchorRect.right + spacing;
        if (nextLeft + width > innerWidth - spacing) {
            nextLeft = Math.max(anchorRect.left - spacing - width, spacing);
        }

        let nextTop = anchorRect.top;
        if (nextTop + height > innerHeight - spacing) {
            nextTop = Math.max(innerHeight - height - spacing, spacing);
        }

        if (nextTop < spacing) {
            nextTop = spacing;
        }

        setPosition({ top: nextTop, left: nextLeft });
        setIsPositionReady(true);
    }, [anchorRect, isOpen]);

    const handleSymbolSelect = (event) => {
        const nextValue = event.target.value;

        if (!nextValue) {
            setSymbolValue("");
            return;
        }

        onInsertSymbol(nextValue);
        setSymbolValue("");
    };

    if (!isOpen || !anchorRect || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div
            ref={containerRef}
            style={{
                ...popoverStyles,
                position: "fixed",
                top: position.top,
                left: position.left,
                zIndex: 10050,
                visibility: isPositionReady ? "visible" : "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                }}
            >
                <strong
                    style={{
                        fontSize: "0.875rem",
                    }}
                >
                    Редагування рядка {rowIndex + 1}
                </strong>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "1rem",
                        lineHeight: 1,
                    }}
                    aria-label="Закрити меню редагування"
                >
                    ✕
                </button>
            </div>

            <label style={stackLabelColSelectedStyles}>
                <span>Стовпець</span>
                <select
                    value={isActiveRow ? selectedColumnIndex : 0}
                    onChange={(event) =>
                        onSelectColumn(Number(event.target.value))
                    }
                    style={{
                        padding: "0.4rem 0.5rem",
                        border: "1px solid #dcdcdc",
                        borderRadius: "4px",
                        background: "#fff",
                    }}
                >
                    {row.map((_, idx) => (
                        <option
                            key={`column-option-${rowIndex}-${idx}`}
                            value={idx}
                        >
                            Стовпець {idx + 1}
                        </option>
                    ))}
                </select>
            </label>

            {canEditActiveCell ? (
                <>
                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <ToggleButton
                            active={activeRowCell.bold}
                            onClick={onToggleBold}
                            label="Жирний"
                        >
                            <strong>B</strong>
                        </ToggleButton>

                        <ToggleButton
                            active={activeRowCell.italic}
                            onClick={onToggleItalic}
                            label="Курсив"
                        >
                            <em>I</em>
                        </ToggleButton>

                        <ToggleButton
                            active={activeRowCell.underline}
                            onClick={onToggleUnderline}
                            label="Підкреслення"
                        >
                            <span style={{ textDecoration: "underline" }}>
                                U
                            </span>
                        </ToggleButton>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.35rem",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.8125rem",
                            }}
                        >
                            Вирівнювання тексту
                        </span>
                        <div
                            style={{
                                display: "flex",
                                gap: "0.35rem",
                                flexWrap: "wrap",
                            }}
                        >
                            {TEXT_ALIGNMENT_OPTIONS.map((option) => (
                                <ToggleButton
                                    key={option.value}
                                    active={
                                        activeRowCell.alignment === option.value
                                    }
                                    onClick={() =>
                                        onAlignmentChange(option.value)
                                    }
                                    label={option.label}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: "1.5rem",
                                            textAlign: option.value,
                                        }}
                                    >
                                        ≡
                                    </span>
                                </ToggleButton>
                            ))}
                            <span
                                aria-hidden="true"
                                style={{
                                    alignSelf: "center",
                                    color: "#d1d5db",
                                }}
                            >
                                |
                            </span>
                            {VERTICAL_ALIGNMENT_OPTIONS.map((option) => (
                                <ToggleButton
                                    key={option.value}
                                    active={
                                        activeRowCell.verticalAlignment ===
                                        option.value
                                    }
                                    onClick={() =>
                                        onVerticalAlignmentChange(option.value)
                                    }
                                    label={option.label}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: "1.5rem",
                                            textAlign: "center",
                                        }}
                                    >
                                        {option.value === "top"
                                            ? "⤒"
                                            : option.value === "middle"
                                            ? "⇳"
                                            : "⤓"}
                                    </span>
                                </ToggleButton>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "0.75rem",
                            flexWrap: "wrap",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <label style={{ ...stackLabelStyles, marginBottom: 0 }}>
                            <span>Розмір шрифту</span>
                            <select
                                value={activeRowCell.fontSize}
                                onChange={(event) =>
                                    onFontSizeChange(event.target.value)
                                }
                                style={{
                                    padding: "0.35rem 0.5rem",
                                    border: "1px solid #dcdcdc",
                                    borderRadius: "4px",
                                    background: "#fff",
                                }}
                            >
                                {fontSizeOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label style={{ ...stackLabelStyles, marginBottom: 0 }}>
                            <span>Символ для клітинки</span>
                            <select
                                value={symbolValue}
                                onChange={handleSymbolSelect}
                                style={{
                                    padding: "0.35rem 0.5rem",
                                    border: "1px solid #dcdcdc",
                                    borderRadius: "4px",
                                    background: "#fff",
                                }}
                            >
                                <option value="">Обрати символ...</option>
                                {SYMBOL_SNIPPET_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label style={{ ...stackLabelStyles, marginBottom: 0 }}>
                        <span>Посилання для всієї кліинки (URL)</span>
                        <input
                            type="text"
                            value={activeRowCell.link}
                            onChange={(event) =>
                                onLinkChange(event.target.value)
                            }
                            placeholder="https://example.com"
                            style={{
                                padding: "0.45rem 0.55rem",
                                border: "1px solid #dcdcdc",
                                borderRadius: "4px",
                            }}
                        />
                    </label>
                    <div
                        style={{
                            marginTop: "0.75rem",
                        }}
                    >
                        <CellTextarea
                            cellKey={cellKey}
                            cell={activeRowCell}
                            rowIndex={rowIndex}
                            columnIndex={selectedColumnIndex}
                            registerInputRef={registerInputRef}
                            setActiveCell={setActiveCell}
                            captureSelectionFromInput={
                                captureSelectionFromInput
                            }
                            updateCell={updateCell}
                            placeholder="Текст клітинки"
                        />
                    </div>
                    <div
                        style={{
                            marginTop: "0.65rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            border: "1px solid #dcdcdc",
                            borderRadius: "6px",
                            padding: "0.3rem 0.5rem",
                            background: "#f9fafb",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.75rem",
                                color: "#374151",
                                lineHeight: 1.3,
                                flex: "1 1 auto",
                            }}
                        >
                            Додати посилання до виділеного тексту
                        </span>
                        <button
                            type="button"
                            ref={linkButtonRef}
                            className="nc-button"
                            onClick={onOpenLinkPopover}
                            disabled={!hasTextSelection}
                            style={{
                                fontSize: "0.875rem",
                                cursor: hasTextSelection
                                    ? "pointer"
                                    : "not-allowed",
                                opacity: hasTextSelection ? 1 : 0.6,
                                padding: "0.2rem 0.45rem",
                                lineHeight: 1,
                            }}
                            aria-label="Додати посилання до виділеного тексту"
                            title={
                                hasTextSelection
                                    ? "Додати посилання до виділеного тексту"
                                    : "Виділіть текст у клітинці, щоб додати посилання"
                            }
                        >
                            🔗
                        </button>
                    </div>
                    <div
                        style={{
                            marginTop: "0.45rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            border: "1px solid #dcdcdc",
                            borderRadius: "6px",
                            padding: "0.3rem 0.5rem",
                            background: "#f9fafb",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.75rem",
                                color: "#374151",
                                lineHeight: 1.3,
                                flex: "1 1 auto",
                            }}
                        >
                            Додати PDF-посилання до виділеного тексту
                        </span>
                        <button
                            type="button"
                            ref={linkPdfButtonRef}
                            className="nc-button"
                            onClick={onOpenPdfPopover}
                            disabled={!pdfButtonEnabled}
                            style={{
                                fontSize: "0.875rem",
                                cursor: pdfButtonEnabled
                                    ? "pointer"
                                    : "not-allowed",
                                opacity: pdfButtonEnabled ? 1 : 0.6,
                                padding: "0.2rem 0.45rem",
                                lineHeight: 1,
                            }}
                            aria-label="Додати PDF-посилання до виділеного тексту"
                            title={pdfButtonTitle}
                        >
                            📄
                        </button>
                    </div>
                    {!canUseMediaLibrary ? (
                        <div
                            style={{
                                marginTop: "0.35rem",
                                fontSize: "0.7rem",
                                color: "#9ca3af",
                            }}
                        >
                            Налаштуйте медіатеку Netlify CMS, щоб додавати
                            PDF-файли.
                        </div>
                    ) : null}
                    {hasLinkedSegments ? (
                        <div
                            style={{
                                marginTop: "0.5rem",
                                padding: "0.65rem",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                background: "#f3f4f6",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.65rem",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#111827",
                                    fontWeight: 600,
                                }}
                            >
                                Текст із посиланнями в клітинці
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                }}
                            >
                                {linkedSegments.map((segment, index) => {
                                    const isActive = Boolean(
                                        activeSelectionRange &&
                                            activeSelectionRange.start <
                                                segment.end &&
                                            activeSelectionRange.end >
                                                segment.start
                                    );

                                    return (
                                        <div
                                            key={`linked-segment-${index}-${segment.start}-${segment.end}`}
                                            style={{
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                background: isActive
                                                    ? "#e0f2fe"
                                                    : "#ffffff",
                                                padding: "0.6rem",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.45rem",
                                                boxShadow: isActive
                                                    ? "0 0 0 1px #3b82f6 inset"
                                                    : "none",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: "0.5rem",
                                                    flexWrap: "wrap",
                                                    alignItems: "flex-start",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#6b7280",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Фрагмент {index + 1}
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "0.35rem",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="nc-button"
                                                        onClick={() =>
                                                            onEditLinkedSegment(
                                                                segment
                                                            )
                                                        }
                                                    >
                                                        Редагувати
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="nc-button"
                                                        onClick={() =>
                                                            onRemoveLinkedSegment(
                                                                segment
                                                            )
                                                        }
                                                    >
                                                        Видалити
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.8125rem",
                                                    color: "#1f2937",
                                                    padding: "0.45rem 0.5rem",
                                                    background: "#f9fafb",
                                                    borderRadius: "4px",
                                                    border: "1px solid #d1d5db",
                                                    wordBreak: "break-word",
                                                    whiteSpace: "pre-wrap",
                                                }}
                                            >
                                                {segment.text}
                                            </div>
                                            <a
                                                href={segment.link}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#2563eb",
                                                    wordBreak: "break-all",
                                                    textDecoration: "none",
                                                }}
                                            >
                                                {segment.link}
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </>
            ) : (
                <div
                    style={{
                        fontSize: "0.8125rem",
                        color: "#6b7280",
                    }}
                >
                    Оберіть клітинку в цьому рядку, щоб налаштувати
                    форматування.
                </div>
            )}
        </div>,
        document.body
    );
};

FormattingPopover.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    rowIndex: PropTypes.number.isRequired,
    row: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedColumnIndex: PropTypes.number.isRequired,
    isActiveRow: PropTypes.bool.isRequired,
    canEditActiveCell: PropTypes.bool.isRequired,
    activeRowCell: PropTypes.shape({
        text: PropTypes.string,
        bold: PropTypes.bool,
        italic: PropTypes.bool,
        underline: PropTypes.bool,
        fontSize: PropTypes.string,
        link: PropTypes.string,
        alignment: PropTypes.string,
        verticalAlignment: PropTypes.string,
        textParts: PropTypes.arrayOf(
            PropTypes.shape({
                text: PropTypes.string.isRequired,
                link: PropTypes.string,
            })
        ),
    }),
    anchorRect: PropTypes.shape({
        top: PropTypes.number.isRequired,
        right: PropTypes.number.isRequired,
        bottom: PropTypes.number.isRequired,
        left: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }).isRequired,
    onSelectColumn: PropTypes.func.isRequired,
    onToggleBold: PropTypes.func.isRequired,
    onToggleItalic: PropTypes.func.isRequired,
    onToggleUnderline: PropTypes.func.isRequired,
    onFontSizeChange: PropTypes.func.isRequired,
    onLinkChange: PropTypes.func.isRequired,
    onAlignmentChange: PropTypes.func.isRequired,
    onVerticalAlignmentChange: PropTypes.func.isRequired,
    onInsertSymbol: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    fontSizeOptions: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ).isRequired,
    cellKey: PropTypes.string.isRequired,
    registerInputRef: PropTypes.func.isRequired,
    captureSelectionFromInput: PropTypes.func.isRequired,
    setActiveCell: PropTypes.func.isRequired,
    updateCell: PropTypes.func.isRequired,
    onOpenLinkPopover: PropTypes.func.isRequired,
    onOpenPdfPopover: PropTypes.func.isRequired,
    hasTextSelection: PropTypes.bool.isRequired,
    linkButtonRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    linkPdfButtonRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    canUseMediaLibrary: PropTypes.bool.isRequired,
    linkedSegments: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
            start: PropTypes.number.isRequired,
            end: PropTypes.number.isRequired,
        })
    ),
    activeSelectionRange: PropTypes.shape({
        start: PropTypes.number.isRequired,
        end: PropTypes.number.isRequired,
    }),
    onEditLinkedSegment: PropTypes.func.isRequired,
    onRemoveLinkedSegment: PropTypes.func.isRequired,
};

FormattingPopover.defaultProps = {
    activeRowCell: null,
    linkedSegments: [],
    activeSelectionRange: null,
};

export default FormattingPopover;
