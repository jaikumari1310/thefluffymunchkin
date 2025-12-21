import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAuthDB } from "./lib/auth-db.ts";

// Initialize the authentication database and default admin user
initializeAuthDB().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
