import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" → rutas de assets relativas; funciona servido desde la raíz
// (Vercel/Netlify) o desde un subpath de proyecto (GitHub Pages: /<repo>/).
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { host: true },
});
