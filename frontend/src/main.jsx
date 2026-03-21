import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SocketProvider } from "./context/SocketContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";
import "./index.css";

axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder_client_id"}>
      <SocketProvider>
        <App />
      </SocketProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);