import React, { memo, useState, useEffect } from "react";
import TextBox from "devextreme-react/text-box";
import Button from "devextreme-react/button";

const TextBoxList = memo(({ id, value, onValueChanged, label }) => {
  const initialRows = Array.isArray(value) && value.length > 0 ? value : [{ plan_id: "", plan_name: "" }];
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    if (Array.isArray(value) && value.length > 0) {
      setRows(value);
    }
  }, [value]);

  useEffect(() => {
    console.log(`list rows: ${JSON.stringify(rows)}`);
    if (onValueChanged) {
      onValueChanged(rows);
    }
  }, [rows, onValueChanged]);

  const handleRowChange = (plan_id, newValue) => {
    const updatedRows = rows.map((row) =>
      row.plan_id === plan_id ? { ...row, plan_name: newValue } : row
    );
    setRows(updatedRows);
  };

  const handleCloneRow = (plan_id) => {
    const rowToClone = rows.find((row) => row.plan_id === plan_id);
    if (rowToClone) {
      const newId = rows.length > 0 ? Math.max(...rows.map((row) => row.plan_id)) + 1 : 1;
      setRows([...rows, { plan_id: newId, plan_name: "" }]);
    }
  };

  const handleRemoveRow = (plan_id) => {
    setRows(rows.filter((row) => row.plan_id !== plan_id));
  };

  return (
    <div>
      {rows.map((row) => (
        <div key={row.plan_id} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          <TextBox
            inputAttr={{ id: `${id}-${row.plan_id}` }}
            value={row.plan_name}
            onValueChanged={(e) => handleRowChange(row.plan_id, e.value)}
            stylingMode="outlined"
            width="100%"
            label={label}
            style={{ marginRight: "10px" }}
          />
          <Button
            text="+"
            className="clone"
            onClick={() => handleCloneRow(row.plan_id)}
            stylingMode="contained"
            width={30}
            height={30}
            style={{ marginRight: "5px" }}
          />
          <Button
            text="-"
            className="remove"
            onClick={() => handleRemoveRow(row.plan_id)}
            stylingMode="contained"
            width={30}
            height={30}
          />
        </div>
      ))}
    </div>
  );
});

export default TextBoxList;
