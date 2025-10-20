import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const canUseDOM =
    typeof window !== "undefined" && typeof document !== "undefined";

const overlayStyles = {
    position: "fixed",
    inset: "103px 0 -16px",
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    zIndex: 1400,
};

const contentStyles = {
    background: "#ffffff",
    borderRadius: "12px",
    maxWidth: "1440px",
    width: "100%",
    overflow: "hidden",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.25)",
    display: "flex",
    flexDirection: "column",
    height: "77vh",
};

const headerStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem",
    borderBottom: "1px solid #e5e7eb",
};

const bodyStyles = {
    padding: "1.25rem",
    overflowY: "auto",
    height: "100%",
};

const headingStyles = {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 600,
};

const closeButtonStyles = {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "1.25rem",
    lineHeight: 1,
    color: "#1f2937",
};

const Modal = ({ title, onClose, children }) => {
    const headingId = useMemo(
        () => (title ? "table-widget-modal-title" : undefined),
        [title]
    );

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    const modalContent = (
        <div style={overlayStyles} role="presentation" onClick={onClose}>
            <div
                style={contentStyles}
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                onClick={(event) => event.stopPropagation()}
            >
                <div style={headerStyles}>
                    {title ? (
                        <h2 style={headingStyles} id={headingId}>
                            {title}
                        </h2>
                    ) : null}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрити модальне вікно"
                        style={closeButtonStyles}
                    >
                        ✕
                    </button>
                </div>
                <div style={bodyStyles}>{children}</div>
            </div>
        </div>
    );

    if (!canUseDOM) {
        return modalContent;
    }

    return createPortal(modalContent, document.body);
};

Modal.propTypes = {
    title: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
};

Modal.defaultProps = {
    title: undefined,
};

export default Modal;
