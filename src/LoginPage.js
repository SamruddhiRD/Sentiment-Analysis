import React from "react";
import { useMsal } from "@azure/msal-react";


const LoginPage = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Welcome to the Sentiment Analysis App</h2>
      <p>Please log in with your Microsoft account to continue.</p>
      <button onClick={handleLogin} style={{
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        padding: "10px 20px",
        fontSize: "16px",
        borderRadius: "5px",
        cursor: "pointer"
      }}>
        Login with Microsoft
      </button>
    </div>
  );
};

export default LoginPage;