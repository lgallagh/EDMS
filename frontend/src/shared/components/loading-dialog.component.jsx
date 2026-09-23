import React from "react";
import { useLoading } from "../context/loading.context";
import { Popup } from "devextreme-react/popup";
import { LoadIndicator } from "devextreme-react/load-indicator";

const LoadingDialog = () => {
  const { isLoading } = useLoading();

  return (
    <Popup
      key={isLoading ? "open" : "closed"}
      visible={isLoading} // Show the dialog when isLoading is true
      width={100}
      height={100}
      showTitle={false}
      hideOnOutsideClick={false} // Prevent closing
      shading={true} // Dim the background
      showCloseButton={false} // Prevent closing
      contentRender={() => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <LoadIndicator id="spinner" width={40} height={40} />
        </div>
      )}
    />
  


  );
};

export default LoadingDialog;
