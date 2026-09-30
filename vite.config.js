import { defineConfig } from "vite";
import paper from "./paper/vite-plugin.js";

export default defineConfig({
  appType: "spa",
  plugins: [paper()],
});
