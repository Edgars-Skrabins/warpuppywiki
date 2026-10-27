import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/ui/global.css";
import { App } from "@/app/App";
import { registerServiceWorker } from "@/app/registerServiceWorker";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  registerServiceWorker();
}
