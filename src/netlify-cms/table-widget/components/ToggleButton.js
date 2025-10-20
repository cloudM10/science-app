import React from "react";
import PropTypes from "prop-types";

const ToggleButton = ({ active, onClick, label, children }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        style={{
            border: "1px solid #dcdcdc",
            borderRadius: "4px",
            padding: "0.25rem 0.5rem",
            background: active ? "#dbeafe" : "#fff",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.875rem",
        }}
        title={label}
    >
        {children}
    </button>
);

ToggleButton.propTypes = {
    active: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    label: PropTypes.string,
    children: PropTypes.node.isRequired,
};

ToggleButton.defaultProps = {
    active: false,
    label: undefined,
};

export default ToggleButton;
