import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Zinx portfolio root element was not found.");
}

// R3F 9.7 delays renderer disposal by 500ms. React 19.2 StrictMode's
// development remount reuses that canvas, so disposal destroys the live renderer.
// Use the production-equivalent lifecycle until that upstream cleanup is guarded.
createRoot(root).render(<App />);
