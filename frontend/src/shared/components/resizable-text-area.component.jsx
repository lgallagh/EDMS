import React, { useState, useEffect, useRef, memo } from 'react';
import Resizable from 'devextreme-react/resizable';
import TextArea from 'devextreme-react/text-area';

const ResizableTextArea = memo(({ id, value, onValueChanged, initialHeight = 90 }) => {
  const [localValue, setLocalValue] = useState(value);
  const [maxWidth, setMaxWidth] = useState(window.innerWidth);
  const resizableContainerRef = useRef();

  useEffect(() => {
    // Sync local value with parent value
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handleResize = () => {
      if (resizableContainerRef.current) {
        const containerBounds = resizableContainerRef.current.getBoundingClientRect();
        setMaxWidth(window.innerWidth - containerBounds.left - 20); // Adjust for padding/margin
      }
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize); // Attach resize listener

    return () => {
      window.removeEventListener('resize', handleResize); // Cleanup listener
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.value;
    setLocalValue(newValue); // Update local state
    if (onValueChanged) {
      onValueChanged(newValue); // Call the parent handler
    }
  };

  return (
    <div ref={resizableContainerRef} className="resizable-textarea-container">
      <Resizable
        defaultHeight={initialHeight}
        maxWidth={maxWidth}
        keepAspectRatio={false}
        handles="all"
      >
        <TextArea
          inputAttr={{ id }}
          value={localValue}
          onValueChanged={handleInputChange}
          height="100%"
          width="100%"
        />
      </Resizable>
    </div>
  );
});

export default ResizableTextArea;
