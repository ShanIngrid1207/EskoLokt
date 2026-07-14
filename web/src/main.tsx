import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import DevHarness from "./DevHarness";
import "./tailwind.css";
import "./styles.css";

// Open with ?dev=1 to see the new mobile screen sandbox instead of the old demo.
const isDev = new URLSearchParams(window.location.search).has("dev");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isDev ? <DevHarness /> : <App />}
  </React.StrictMode>,
);
