import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import AdminStoreProvider
import { AdminStoreProvider } from "./lib/AdminStore";

createRoot(document.getElementById("root")!).render(
  <AdminStoreProvider>
    <App />
  </AdminStoreProvider>
);
