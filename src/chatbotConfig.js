import { createChatBotMessage } from "react-chatbot-kit";
import React, { useState, useEffect } from "react";
import FileUploadWidget from "./FileUploadWidget";
import ReactMarkdown from "react-markdown";

const Avatar = ({ type }) => {
  const avatarSrc = type === "bot" ? "bot.png" : "profile.png";
  const avatarAlt = type === "bot" ? "Bot" : "User";

  return (
    <div className={`${type}-avatar`}>
      <img src={avatarSrc} alt={avatarAlt} className="avatar-image" />
    </div>
  );
};

const StreamingTextWidget = ({ message }) => {
  const [streamedMessage, setStreamedMessage] = useState("");

  useEffect(() => {
    if (message) {
      setStreamedMessage(message);
    }
  }, [message]);

  return (
    <div
      style={{
        whiteSpace: "pre-line",
        fontSize: "14px",
        color: "#333",
        borderLeft: "4px solid #007bff",
        padding: "8px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
      }}
    >
      <ReactMarkdown>{streamedMessage || "⏳ Waiting for insights..."}</ReactMarkdown>
    </div>
  );
};

const config = {
  botName: "ChatBot",
  initialMessages: [
    createChatBotMessage("Hello! Please upload a file to begin.", { widget: "fileUpload" }),
  ],
  customComponents: {
    botAvatar: () => <Avatar type="bot" />,
    userAvatar: () => <Avatar type="user" />,
  },
  widgets: [
    {
      widgetName: "fileUpload",
      widgetFunc: (props) => <FileUploadWidget {...props} />,
    },
    {
      widgetName: "streamingText",
      widgetFunc: (props) => <StreamingTextWidget {...props} />,
    },
  ],
};

export default config;