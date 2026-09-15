import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ZinxPortfolio from "./ZinxPortfolio";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Zinx portfolio root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <ZinxPortfolio />
  </StrictMode>,
);
