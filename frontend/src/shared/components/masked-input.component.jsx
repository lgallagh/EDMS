import React, {useState, useEffect} from "react";
import TextBox from "devextreme-react/text-box";

function MaskedInput({id, value, onValueChanged, mask}) { // Converts a formatted value (e.g., "(718) 626-8948") to raw digits.
    const toRaw = (formatted) => {
        return formatted ? formatted.replace(/[^0-9]/g, "") : "";
    };

    // Converts raw digits into the desired phone format.
    const formatPhone = (raw) => {
        if (raw.length === 10) {
            return "(" + raw.substring(0, 3) + ") " + raw.substring(3, 6) + "-" + raw.substring(6, 10);
        }
        return raw;
    };

    // Local state holds the raw numeric value for the TextBox.
    const [rawValue, setRawValue] = useState("");

    // Update local rawValue state when the formatted value prop changes.
    useEffect(() => {
        setRawValue(toRaw(value));
    }, [value]);

    // Handle value changes in the TextBox.
    const handleValueChanged = (e) => { // Instead of using e.component.getRawValue(), apply toRaw on e.value.
        const newRawValue = toRaw(e.value);
        setRawValue(newRawValue);
        const formatted = formatPhone(newRawValue);
        // Pass the formatted value back to the parent.
        onValueChanged(formatted);
    };

    return (
        <TextBox id={id}
            value={rawValue}
            onValueChanged={handleValueChanged}
            mask={mask}
            maskChar="_"
            useMaskedValue={true}/>
    );
}

export default MaskedInput;

