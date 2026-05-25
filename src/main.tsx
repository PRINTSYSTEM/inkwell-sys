import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// if (import.meta.env.DEV) {
//   import('@locator/runtime').then((locator) => {
//     locator.default();
//   });
// }

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
