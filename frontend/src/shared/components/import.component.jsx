import React, { useState } from "react";
import AxiosCalls from "../services/axios-calls.service";

const axiosService = new AxiosCalls();

const ImportComponent = ({ heading, endpoint, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", selectedFile); 
  
    try {
      await axiosService.postDataUpload(endpoint, formData); 
      alert("File uploaded successfully.");
      onCancel(); // Return to the previous page
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload the file. Please try again.");
    }
  };

  return (
    <div className="cont_right">
      <div className="inside_area_ctn">
        <p className="cont_heading">{heading}</p>
        <div className="cont_inside">
          <div className="change_password">
            <ul>
              <li>
                <div className="f_text">Browse Excel File (.xlsx):</div>
                <div className="field">
                  <input type="file" onChange={handleFileChange} />
                </div>
              </li>
            </ul>
          </div>
          <div className="change_password">
            <ul className="manage_buttons">
              <li>
                <div className="input submit">
                  <button className="button" onClick={handleSubmit}>
                    Submit
                  </button>
                </div>
                <div className="input button">
                  <button className="button" onClick={onCancel}>
                    Cancel
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportComponent;
