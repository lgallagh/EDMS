import React, { useState, useEffect } from 'react';
import DateBox from 'devextreme-react/date-box';

function DaySchedule(props) {
  const { initialValue, onChange } = props;
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  function parseTimeString(timeString) {
    const parts = timeString.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (parts) {
      let hours = parseInt(parts[1], 10);
      const minutes = parseInt(parts[2], 10);
      const ampm = parts[3].toLowerCase();
      if (ampm === 'pm' && hours < 12) {
        hours += 12;
      }
      if (ampm === 'am' && hours === 12) {
        hours = 0;
      }
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    }
    return null;
  }

  function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutesFormatted + ' ' + ampm;
  }

  useEffect(() => {
    if (initialValue && initialValue.indexOf('-') !== -1) {
      const times = initialValue.split('-');
      const startStr = times[0].trim();
      const endStr = times[1].trim();
      const start = parseTimeString(startStr);
      const end = parseTimeString(endStr);
      setStartTime(start);
      setEndTime(end);
    }
  }, [initialValue]);

  useEffect(() => {
    if (startTime && endTime) {
      const newValue = formatTime(startTime) + ' - ' + formatTime(endTime);
      if (onChange) {
        onChange(newValue);
      }
    }
  }, [startTime, endTime, onChange]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: '1 1 150px', minWidth: '100px' }}>
        <DateBox
          type="time"
          value={startTime}
          onValueChanged={(e) => setStartTime(e.value)}
          displayFormat="hh:mm a"
          useMaskBehavior={true}
          width="100%"
        />
      </div>
      <span style={{ margin: '0 10px' }}>-</span>
      <div style={{ flex: '1 1 150px', minWidth: '100px' }}>
        <DateBox
          type="time"
          value={endTime}
          onValueChanged={(e) => setEndTime(e.value)}
          displayFormat="hh:mm a"
          useMaskBehavior={true}
          width="100%"
        />
      </div>
    </div>
  );
}

export default DaySchedule;
