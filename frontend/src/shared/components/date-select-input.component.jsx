import React, { useState, useEffect } from "react";
import SelectBox from "devextreme-react/select-box";

const DateSelectInput = ({ id, date, onDateChange, label, yearOptions }) => {
  // Helper function: parse the incoming date string ("YYYY-MM-DD") to a Date object.
  const parseDate = (date) => {
    if (typeof date === "string") {
      const parts = date.split("-");
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    } else if (date instanceof Date) {
      return date;
    }
    return new Date();
  };

  // Initialize local state from the incoming date.
  const [dateParts, setDateParts] = useState(() => {
    const safeDate = parseDate(date);
    return {
      year: safeDate.getFullYear(),
      month: String(safeDate.getMonth() + 1).padStart(2, "0"),
      day: String(safeDate.getDate()).padStart(2, "0")
    };
  });

  // Update local state when the incoming date prop changes.
  useEffect(() => {
    const safeDate = parseDate(date);
    setDateParts({
      year: safeDate.getFullYear(),
      month: String(safeDate.getMonth() + 1).padStart(2, "0"),
      day: String(safeDate.getDate()).padStart(2, "0")
    });
  }, [date]);

  const { year, month, day } = dateParts;

  // Generate options for month and day.
  const monthOptions = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const dayOptions = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  // When any select value changes, update local state and notify the parent.
  const handleChange = (field, value) => {
    let newYear = year;
    let newMonth = month;
    let newDay = day;
    if (field === "year") {
      newYear = Number(value);
    } else if (field === "month") {
      newMonth = String(value).padStart(2, "0");
    } else if (field === "day") {
      newDay = String(value).padStart(2, "0");
    }
    // Update the local state.
    setDateParts({
      year: newYear,
      month: newMonth,
      day: newDay
    });
    // Reassemble the date in "YYYY-MM-DD" format.
    const newDateString = newYear + "-" + newMonth + "-" + newDay;
    onDateChange(newDateString);
  };

  return (
    <div>
      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{label}</div>
      <div style={{ display: "flex", gap: "0px" }}>
        <SelectBox
          id={`${id}-year`}
          items={yearOptions}
          value={year}
          onValueChanged={(e) => handleChange("year", e.value)}
        />
        <SelectBox
          id={`${id}-month`}
          items={monthOptions}
          value={month}
          onValueChanged={(e) => handleChange("month", e.value)}
        />
        <SelectBox
          id={`${id}-day`}
          items={dayOptions}
          value={day}
          onValueChanged={(e) => handleChange("day", e.value)}
        />
      </div>
    </div>
  );
};

export default DateSelectInput;
