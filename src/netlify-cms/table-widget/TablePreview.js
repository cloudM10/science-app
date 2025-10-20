import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { ensureTable } from "./utils";
import { getCellRendering } from "./components/cellRendering";

const TablePreview = ({ value }) => {
    const table = useMemo(() => ensureTable(value), [value]);

    if (!table.rows.length) {
        return <div>Пуста таблиця</div>;
    }

    return (
        <figure style={{ margin: 0 }}>
            <div
                data-netlify-table-wrapper="true"
                className="netlify-table-wrapper"
                style={{
                    width: "100%",
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                <table
                    style={{
                        borderCollapse: "collapse",
                        width: "auto",
                        minWidth: "100%",
                        border: "1px solid #dcdcdc",
                        tableLayout: "fixed",
                    }}
                >
                    <colgroup>
                        {(table.rows[0] ?? []).map((_, columnIndex) => {
                            const width = table.columnWidths?.[columnIndex];

                            return (
                                <col
                                    key={`preview-column-${columnIndex}`}
                                    style={{
                                        width: width ? `${width}px` : undefined,
                                        minWidth: width
                                            ? `${width}px`
                                            : undefined,
                                        maxWidth: width
                                            ? `${width}px`
                                            : undefined,
                                    }}
                                />
                            );
                        })}
                    </colgroup>
                    {table.caption ? (
                        <caption
                            style={{
                                captionSide: "top",
                                fontWeight: 600,
                                padding: "0.5rem",
                            }}
                        >
                            {table.caption}
                        </caption>
                    ) : null}
                    <tbody>
                        {table.rows.map((row, rowIndex) => (
                            <tr key={`preview-row-${rowIndex}`}>
                                {row.map((cell, columnIndex) => {
                                    const {
                                        content,
                                        alignment,
                                        verticalAlignment,
                                    } = getCellRendering(cell);

                                    return (
                                        <td
                                            key={`preview-cell-${rowIndex}-${columnIndex}`}
                                            data-vertical-align={
                                                verticalAlignment
                                            }
                                            style={{
                                                border: "1px solid #dcdcdc",
                                                padding: "0.5rem",
                                                background: "#fff",
                                                wordBreak: "break-word",
                                                textAlign: alignment,
                                                verticalAlign:
                                                    verticalAlignment,
                                                "--netlify-table-vertical-align":
                                                    verticalAlignment,
                                                width:
                                                    table.columnWidths?.[
                                                        columnIndex
                                                    ] !== undefined
                                                        ? `${table.columnWidths[columnIndex]}px`
                                                        : undefined,
                                                minWidth:
                                                    table.columnWidths?.[
                                                        columnIndex
                                                    ] !== undefined
                                                        ? `${table.columnWidths[columnIndex]}px`
                                                        : undefined,
                                                maxWidth:
                                                    table.columnWidths?.[
                                                        columnIndex
                                                    ] !== undefined
                                                        ? `${table.columnWidths[columnIndex]}px`
                                                        : undefined,
                                            }}
                                        >
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};

TablePreview.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
        PropTypes.string,
    ]),
};

TablePreview.defaultProps = {
    value: null,
};

export default TablePreview;
