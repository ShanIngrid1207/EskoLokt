import React from "react";
import ReactDOM from "react-dom/client";

// ─── Conditional entry: ?mobile=1 → mobile screen layer ──────────────────────
const isMobile =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("mobile");

async function boot() {
  if (isMobile) {
    // Load Tailwind-powered mobile CSS only for the mobile harness
    await import("./mobile.css");
    const { default: MobileApp } = await import("./MobileApp");
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <MobileApp />
      </React.StrictMode>,
    );
  } else {
    // Existing desktop dashboard
    await import("./styles.css");
    const { default: App } = await import("./App");
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

boot();

