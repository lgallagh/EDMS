import React, { useEffect, useState } from "react";
import Toast from "devextreme-react/toast";
import { useResultContext } from "../context/result.context";

const SuccessMessage = () => {
  const { successMessage, failureMessage, clearMessage } = useResultContext();
  const [visible, setVisible] = useState(false);
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");

  
  useEffect(() => {
    if (successMessage) {
      setVisible(true);
      setMessageType("success");
      setMessage(successMessage);
    } else if (failureMessage) {
      setVisible(true);
      setMessageType("error");
      setMessage(failureMessage);
    }
  }, [successMessage, failureMessage]);

  return (
    <Toast
      message={message}
      visible={visible}
      onHiding={() => {
        setVisible(false);
        clearMessage();
      }}
      displayTime={3000} 
      closeOnClick={true}
      position="top center"
      type={messageType}
    />
  );
};

export default SuccessMessage;
