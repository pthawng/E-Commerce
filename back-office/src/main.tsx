import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Providers } from "./providers";
import { configureApiBaseUrl } from "@shared";
import "./index.css";
import App from "./App.tsx";

// Configure API base URL from environment
configureApiBaseUrl(import.meta.env.VITE_API_URL);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </StrictMode>
);
