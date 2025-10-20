import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { extractFileName, normalizePdfPath } from "../../utils/media";

const containerStyles = {
    background: "#ffffff",
    border: "1px solid #dcdcdc",
    borderRadius: "8px",
    padding: "0.85rem",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.18)",
    minWidth: "300px",
    maxWidth: "360px",
    zIndex: 10060,
};

const headerStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
};

const titleStyles = {
    fontSize: "0.95rem",
    fontWeight: 600,
};

const selectedTextStyles = {
    fontSize: "0.75rem",
    color: "#374151",
    background: "#f3f4f6",
    borderRadius: "4px",
    padding: "0.4rem 0.45rem",
    marginBottom: "0.7rem",
    lineHeight: 1.3,
    maxHeight: "4.5rem",
    overflowY: "auto",
    wordBreak: "break-word",
};

const labelStyles = {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    marginBottom: "0.75rem",
    fontSize: "0.8rem",
};

const helperTextStyles = {
    fontSize: "0.7rem",
    color: "#6b7280",
};

const errorStyles = {
    fontSize: "0.75rem",
    color: "#b91c1c",
    background: "#fee2e2",
    borderRadius: "4px",
    padding: "0.5rem 0.55rem",
    marginBottom: "0.75rem",
    lineHeight: 1.35,
};

const controlsRowStyles = {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    marginBottom: "0.75rem",
};

const actionsStyles = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
};

const LinkPdfPopover = ({
    isOpen,
    anchorElement,
    value,
    onChange,
    onSubmit,
    onCancel,
    onBrowse,
    onRemove,
    hasSelection,
    selectedText,
    canBrowse,
    errorMessage,
}) => {
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isReady, setIsReady] = useState(false);

    const trimmedSelectedText = useMemo(
        () => (selectedText || "").trim(),
        [selectedText]
    );

    const normalizedValue = useMemo(() => normalizePdfPath(value), [value]);
    const fileName = useMemo(
        () => (normalizedValue ? extractFileName(normalizedValue) : ""),
        [normalizedValue]
    );

    const browseAvailable = Boolean(
        canBrowse && typeof onBrowse === "function"
    );
    const browseDisabled = !hasSelection || !browseAvailable;

    const updatePosition = useCallback(() => {
        if (
            !isOpen ||
            typeof window === "undefined" ||
            !anchorElement ||
            !containerRef.current
        ) {
            return;
        }

        const rect = anchorElement.getBoundingClientRect();
        const element = containerRef.current;
        const spacing = 10;
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const { innerWidth, innerHeight } = window;

        let nextLeft = rect.left;
        if (nextLeft + width > innerWidth - spacing) {
            nextLeft = Math.max(innerWidth - width - spacing, spacing);
        }

        let nextTop = rect.bottom + spacing;
        if (nextTop + height > innerHeight - spacing) {
            nextTop = Math.max(rect.top - height - spacing, spacing);
        }

        setPosition({ top: nextTop, left: nextLeft });
        setIsReady(true);
    }, [anchorElement, isOpen]);

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        setIsReady(false);
        updatePosition();
    }, [isOpen, normalizedValue, trimmedSelectedText, updatePosition]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        if (typeof window === "undefined") {
            return undefined;
        }

        const handleReposition = () => {
            setIsReady(false);
            window.requestAnimationFrame(() => {
                updatePosition();
            });
        };

        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
            }
        };

        const handleMouseDown = (event) => {
            if (!containerRef.current) {
                return;
            }

            const target = event.target;
            const clickedInsidePopover = containerRef.current.contains(target);
            const clickedAnchor = anchorElement
                ? anchorElement.contains(target)
                : false;

            if (!clickedInsidePopover && !clickedAnchor) {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [anchorElement, isOpen, onCancel]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (inputRef.current && typeof inputRef.current.focus === "function") {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!hasSelection) {
            return;
        }

        onSubmit(normalizedValue || "");
    };

    const handleValueChange = (event) => {
        onChange(event.target.value);
    };

    const handleBrowseClick = () => {
        if (browseDisabled) {
            return;
        }

        onBrowse();
    };

    const handleRemoveClick = () => {
        onRemove();
    };

    if (!isOpen || typeof document === "undefined") {
        return null;
    }

    const helperText = fileName
        ? `Вибрано файл: ${fileName}.`
        : "Вкажіть шлях до PDF-файлу з папки media.";

    return createPortal(
        <div
            ref={containerRef}
            style={{
                ...containerStyles,
                position: "fixed",
                top: position.top,
                left: position.left,
                visibility: isReady ? "visible" : "hidden",
            }}
        >
            <form onSubmit={handleSubmit}>
                <div style={headerStyles}>
                    <strong style={titleStyles}>PDF-посилання</strong>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1rem",
                            lineHeight: 1,
                        }}
                        aria-label="Закрити"
                    >
                        ✕
                    </button>
                </div>

                {trimmedSelectedText ? (
                    <div style={selectedTextStyles}>{trimmedSelectedText}</div>
                ) : (
                    <div
                        style={{
                            ...selectedTextStyles,
                            background: "#fef3c7",
                            color: "#92400e",
                        }}
                    >
                        Виділіть текст у клітинці, щоб додати посилання.
                    </div>
                )}

                <label style={labelStyles}>
                    <span>Шлях до PDF</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleValueChange}
                        placeholder="/media/documents/file.pdf"
                        style={{
                            padding: "0.45rem 0.55rem",
                            border: "1px solid #dcdcdc",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            backgroundColor: hasSelection ? "#fff" : "#f9fafb",
                        }}
                        disabled={!hasSelection}
                    />
                    <span style={helperTextStyles}>{helperText}</span>
                </label>

                {browseAvailable ? (
                    <div style={controlsRowStyles}>
                        <button
                            type="button"
                            className="nc-button"
                            onClick={handleBrowseClick}
                            disabled={browseDisabled}
                            style={{
                                fontSize: "12px",
                                cursor: browseDisabled
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: browseDisabled ? 0.6 : 1,
                            }}
                        >
                            📁 Обрати посилання для PDF
                        </button>
                    </div>
                ) : null}

                {errorMessage ? (
                    <div style={errorStyles}>{errorMessage}</div>
                ) : null}

                <div style={actionsStyles}>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="nc-button"
                        style={{
                            cursor: "pointer",
                            fontSize: "12px",
                        }}
                    >
                        скасувати
                    </button>
                    <button
                        type="submit"
                        className="nc-button"
                        disabled={!hasSelection}
                        style={{
                            cursor: hasSelection ? "pointer" : "not-allowed",
                            fontSize: "12px",
                            opacity: hasSelection ? 1 : 0.6,
                        }}
                    >
                        зберегти
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
};

LinkPdfPopover.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    anchorElement: PropTypes.shape({
        getBoundingClientRect: PropTypes.func,
        contains: PropTypes.func,
    }),
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onBrowse: PropTypes.func,
    onRemove: PropTypes.func.isRequired,
    hasSelection: PropTypes.bool.isRequired,
    selectedText: PropTypes.string,
    canBrowse: PropTypes.bool,
    errorMessage: PropTypes.string,
};

LinkPdfPopover.defaultProps = {
    anchorElement: null,
    onBrowse: undefined,
    selectedText: "",
    canBrowse: false,
    errorMessage: "",
};

export default LinkPdfPopover;
