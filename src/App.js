import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadFile from "./UploadFile";
import AnalysisPage from "./AnalysisPage";
import ChatBot from "./ChatBot";
import LoginPage from "./LoginPage";
import { MsalAuthenticationTemplate, useMsal } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";

function ProtectedRoute({ children }) {
  return (
    <MsalAuthenticationTemplate interactionType={InteractionType.Redirect}>
      {children}
    </MsalAuthenticationTemplate>
  );
}

function AppRoutes() {
  const { accounts } = useMsal();

  const isAuthenticated = accounts.length > 0;

  return (
    <Routes>
      {isAuthenticated ? (
        <>
          <Route path="/" element={<ProtectedRoute><UploadFile /></ProtectedRoute>} />
          <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
          <Route path="/chatBot" element={<ProtectedRoute><ChatBot /></ProtectedRoute>} />
        </>
      ) : (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<LoginPage />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;