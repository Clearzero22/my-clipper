import React from "react";
import { createRoot } from "react-dom/client";
import NewTabApp from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NewTabApp />
  </React.StrictMode>
);
