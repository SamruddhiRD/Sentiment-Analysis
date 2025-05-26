import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { motion } from "framer-motion";
import { useMsal } from "@azure/msal-react";

const Header = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });

  useEffect(() => {
    const activeAccount = accounts[0];
    if (activeAccount) {
      setUserInfo({
        name: activeAccount.name || "User",
        email: activeAccount.username || "",
      });
    } else {
      console.warn("No active account found.");
    }
  }, [accounts]);

  const handleLogout = () => {
    localStorage.removeItem("access_token"); 
    instance.logoutRedirect().then(() => {
      navigate("/login");
    });
  };

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 60%)`; 
    return color;
  };
  
  const Avatar = ({ name }) => {
    const initial = name ? name.charAt(0).toUpperCase() : "?";
    const backgroundColor = stringToColor(name || "default");
  
    return (
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor,
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: "1.2rem",
        }}
        title={name}
      >
        {initial}
      </div>
    );
  };
  

  return (
    <header className="header-bar">
      <div className="header-logo">
        <img src="/Group.png" alt="Logo" className="logo-image" />
      </div>
  
      <div className="header-profile" style={{ display: "flex", alignItems: "center" }}>
        <Avatar name={userInfo.name} />
        <div style={{ marginLeft: "10px", textAlign: "left" }}>
          <div style={{ fontWeight: "bold" }}>{userInfo.name}</div>
          <div style={{ fontSize: "12px", color: "#555" }}>{userInfo.email}</div>
        </div>
        <button onClick={handleLogout} className="logoutb" title="Logout" style={{ marginLeft: "15px" }}>
          <svg
            fill="none"
            height="24"
            width="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 16L21 12M21 12L17 8M21 12L7 12M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );  
};

const UploadFile = () => {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const username = accounts[0]?.name || "User";
  const [file, setFile] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.createRef();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
      const allowedExtensions = ["xls", "xlsx"];
      if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid file type. Please upload an XLS or XLSX file.");
        event.target.value = "";
        return;
      }
      setFile(selectedFile);
      setShowCategoryModal(true);
    }
  };

  const handleChooseFileClick = () => fileInputRef.current.click();

  const handleCategorySubmit = async (categoryInputs) => {
    if (categoryInputs.length === 0 || categoryInputs.some(cat => cat.name.trim() === "")) {
      alert("Please enter at least one valid category.");
      return;
    }

    setShowCategoryModal(false);
    // Format the categories in the format expected by the backend (e.g., "category:sentiment,another:sentiment")
    const formattedCategories = categoryInputs.map(cat => `${cat.name}-${cat.sentiment}`).join(",");
    const formData = new FormData();
    formData.append("file", file);
    // IMPORTANT: Use key "user_input" (not "categories") so the backend processes it correctly.
    formData.append("categories", formattedCategories);

    try {
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:8000/analyze", formData, {
           responseType: "text",
         });

      setLoading(false);
      const csvText = response.data;

      const rows = csvText
  .split("\n")
  .filter(row => row.trim() !== "")
  .map(row => row.split(","));

  if (!rows.length || !rows[0] || !rows[0][0]) {
  alert("Invalid or empty analysis result from server.");
  setLoading(false);
  return;
}

      const hasHeader = rows[0][0].toLowerCase().includes("category");
      const dataRows = hasHeader ? rows.slice(1) : rows;

      navigate("/analysis", {
        state: {
          data: dataRows,
          categories: formattedCategories,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Server Busy.\nTry again later...");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCategoryModal(false);
    setFile(null);
  };

  return (
    <div className="upload-file-container">
      <h1 className="welcome-heading">Hello {username}.</h1>
      <p className="welcome-subtext">Please upload a file to generate insights.</p>
      <div className="upload-card">
        <h2>Upload a File</h2>
        <div className="drag-drop-area">
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" className="lucide lucide-upload">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <p>
            Drag and drop file here or{" "}
            <a href="#" onClick={handleChooseFileClick}>choose file</a>
          </p>
          <input
            type="file"
            accept=".xls, .xlsx"
            style={{ display: "none" }}
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </div>
        <div className="file-info">
          Supported format: XLS, XLSX <span className="file-size">Maximum size: 100 MB</span>
        </div>
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Analyzing document...</p>
          </div>
        )}
      </div>

      {showCategoryModal && <CategoryModal onSubmit={handleCategorySubmit} onClose={handleCancel} />}
    </div>
  );
};

const ChatMessage = () => {
  const navigate = useNavigate();
  const handleChatClick = () => {
    navigate("/chatBot");
  };

  return (
    <div className="chat-container">
      <motion.div 
        className="chat-message"
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 50, damping: 10 }}
      >
        AI Assistant....
      </motion.div>

      <button onClick={handleChatClick} className="chat-icon">
        <img src="bot.png" alt="Chat Bot" />
      </button>
    </div>
  );
};

const CategoryModal = ({ onSubmit, onClose }) => {
  const [categoryInputs, setCategoryInputs] = useState([
    { name: "", sentiments: ["positive"] }
  ]);

  const handleInputChange = (index, event) => {
    const newCategories = [...categoryInputs];
    newCategories[index].name = event.target.value;
    setCategoryInputs(newCategories);
  };

  const handleSentimentChange = (index, sentiment) => {
    const newCategories = [...categoryInputs];
    let sentiments = newCategories[index].sentiments;

    if (sentiment === "none") {
      sentiments = ["none"];
    } else {
      sentiments = sentiments.filter(s => s !== "none");

      if (sentiments.includes(sentiment)) {
        sentiments = sentiments.filter(s => s !== sentiment);
      } else {
        sentiments.push(sentiment);
      }
    }

    if (sentiments.length === 0) {
      sentiments = ["none"];
    }

    newCategories[index].sentiments = sentiments;
    setCategoryInputs(newCategories);
  };

  const addCategory = () => {
    setCategoryInputs([...categoryInputs, { name: "", sentiments: ["positive"] }]);
  };

  const deleteCategory = (index) => {
    const newCategories = [...categoryInputs];
    newCategories.splice(index, 1);
    setCategoryInputs(newCategories);
  };

  const handleSubmit = () => {
    if (
      categoryInputs.some(
        cat => cat.name.trim() === "" || cat.sentiments.length === 0
      )
    ) {
      alert("Please enter a valid category with at least one sentiment.");
      return;
    }

    const expandedInputs = categoryInputs.flatMap(cat =>
      cat.sentiments.map(sentiment => ({ name: cat.name, sentiment }))
    );

    onSubmit(expandedInputs);
  };

  return (
    <div className="modal-overlay">
      <div className="category-modal">
        <h3>Enter the Categories</h3>

        {categoryInputs.map((category, index) => (
          <div key={index} className="category-input-row">
            <input
              type="text"
              value={category.name}
              onChange={(event) => handleInputChange(index, event)}
              className="category-input"
              placeholder="Enter category"
            />
            <button onClick={() => deleteCategory(index)} className="delete-category-button">
              Delete
            </button>

            <div className="sentiment-options">
              <label>
                <input
                  type="checkbox"
                  checked={category.sentiments.includes("positive")}
                  onChange={() => handleSentimentChange(index, "positive")}
                />
                Positive
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={category.sentiments.includes("negative")}
                  onChange={() => handleSentimentChange(index, "negative")}
                />
                Negative
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={category.sentiments.includes("none")}
                  onChange={() => handleSentimentChange(index, "none")}
                />
                None
              </label>
            </div>
          </div>
        ))}

        <button onClick={addCategory} className="add-category-button">+</button>
        <br />
        <button onClick={handleSubmit} className="submit-button">Submit</button>
        <button onClick={onClose} className="cancel-button">Cancel</button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <>
      <Header />
      <UploadFile />
      <ChatMessage />
    </>
  );
}