import React from 'react';

const VerticalTable = ({ data }) => {
    // Transform data to match the vertical table structure
    const headers = ['name', 'availability', 'price'];
    const transformedData = headers.map((header, rowIndex) => {
        return {
            header,
            values: data.packs.map((pack) => pack[header])
        };
    });

    return (
        <table className="packs-table">
            <thead className="packs-tb-head">
                <tr>
                    <th></th>
                    {data.packs.map((_, index) => (
                        <th key={index}>Pack {index + 1}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {transformedData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        <th>{row.header}</th>
                        {row.values.map((value, valueIndex) => (
                            <td
                                key={valueIndex}
                                style={{ color: row.header === 'Availability' ? 'green' : 'inherit' }}
                            >
                                {value}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default VerticalTable;