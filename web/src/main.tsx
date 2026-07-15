import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster, OfflineBanner } from "./ui/toast";
import "./tailwind.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster />
    <OfflineBanner />
  </React.StrictMode>,
);

// Register the service worker so the app is installable (add to home screen).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* PWA is a progressive enhancement — ignore registration failures */
    });
  });
}
