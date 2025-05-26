import React, { useState } from "react";
import "./FileUploadWidget.css"; 

const FileUploadWidget = ({ actionProvider }) => {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      
      if (actionProvider && typeof actionProvider.handleFileUpload === "function") {
        actionProvider.handleFileUpload(file);
      } else {
        console.error("❌ actionProvider is undefined or handleFileUpload is not a function.");
      }
    }
  };

  return (
    <div className="file-upload-container">
      <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} hidden />
      <label htmlFor="file-upload" className="file-upload-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" className="lucide lucide-upload">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
        <span>{fileName ? "File Uploaded" : "Upload File"}</span>
      </label>
      {fileName && <p className="uploaded-file-name">📂 {fileName}</p>}
    </div>
  );
};

export default FileUploadWidget;