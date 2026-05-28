import { configureApiBaseUrl } from "@shared";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./config/env.schema"; // Staff+ Enforcement: Runtime validation
import { useStore } from "./store/useStore";

// Initialize API configuration
configureApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
void useStore.getState().hydrateExchangeRates();

createRoot(document.getElementById("root")!).render(<App />);
