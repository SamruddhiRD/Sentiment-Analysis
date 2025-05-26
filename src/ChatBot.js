import React, { useState, useEffect } from "react";
import Chatbot from "react-chatbot-kit";
import "react-chatbot-kit/build/main.css";
import "./Chatbot.css";
import config from "./chatbotConfig";
import MessageParser from "./MessageParser";
import ActionProvider from "./ActionProvider";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 60%)`;
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

const ChatHeader = () => {
  const navigate = useNavigate();
  return (
    <div className="chatbot-header-bar">
      <h3 className="chatbot-title">Chatbot</h3>
      <button className="chatbot-home-btn" onClick={() => navigate("/")}>🏠 Home</button>
    </div>
  );
};

const ChatbotComponent = () => {
  const { accounts } = useMsal();
  const name = accounts[0]?.name || "User";

  const configWithUserAvatar = {
    ...config,
    customComponents: {
      ...config.customComponents,
      header: () => <ChatHeader />, // Chatbot header
      userAvatar: () => <Avatar name={name} />, // Updated avatar
    },
  };

  return (
    <main className="chatbot-container">
      <Header />
      <div className="chat-window">
        <Chatbot
          config={configWithUserAvatar}
          messageParser={MessageParser}
          actionProvider={ActionProvider}
        />
      </div>
    </main>
  );
};

export default ChatbotComponent;