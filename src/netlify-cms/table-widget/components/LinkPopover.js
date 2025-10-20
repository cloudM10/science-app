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

const containerStyles = {
    background: "#ffffff",
    border: "1px solid #dcdcdc",
    borderRadius: "8px",
    padding: "0.75rem",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.18)",
    minWidth: "260px",
    maxWidth: "320px",
    zIndex: 10060,
};

const headerStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
};

const titleStyles = {
    fontSize: "0.9rem",
    fontWeight: 600,
};

const selectedTextStyles = {
    fontSize: "0.75rem",
    color: "#374151",
    background: "#f3f4f6",
    borderRadius: "4px",
    padding: "0.35rem 0.45rem",
    marginBottom: "0.65rem",
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

const actionsStyles = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
};

const LinkPopover = ({
    isOpen,
    anchorElement,
    value,
    onChange,
    onSubmit,
    onCancel,
    hasSelection,
    selectedText,
}) => {
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isReady, setIsReady] = useState(false);

    const trimmedSelectedText = useMemo(
        () => (selectedText || "").trim(),
        [selectedText]
    );

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
    }, [isOpen, value, trimmedSelectedText, updatePosition]);

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

        onSubmit(value);
    };

    const handleValueChange = (event) => {
        onChange(event.target.value);
    };

    if (!isOpen || typeof document === "undefined") {
        return null;
    }

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
                    <strong style={titleStyles}>Посилання</strong>
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
                    <span>Адреса (URL)</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleValueChange}
                        placeholder="https://example.com"
                        style={{
                            padding: "0.45rem 0.55rem",
                            border: "1px solid #dcdcdc",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            backgroundColor: hasSelection ? "#fff" : "#f9fafb",
                        }}
                        disabled={!hasSelection}
                    />
                    <span
                        style={{
                            fontSize: "0.7rem",
                            color: "#6b7280",
                        }}
                    >
                        Залиште поле порожнім, щоб прибрати посилання.
                    </span>
                </label>

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

LinkPopover.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    anchorElement: PropTypes.shape({
        getBoundingClientRect: PropTypes.func,
        contains: PropTypes.func,
    }),
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    hasSelection: PropTypes.bool.isRequired,
    selectedText: PropTypes.string,
};

LinkPopover.defaultProps = {
    anchorElement: null,
    selectedText: "",
};

export default LinkPopover;
