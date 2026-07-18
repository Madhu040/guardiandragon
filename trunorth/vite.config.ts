import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const clientPort = Number(env.VITE_DEV_PORT || 5173);
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_API_URL || "http://localhost:3001";

  return {
    resolve: {
      alias: { "@": resolve(__dirname, "src") },
    },
    server: {
      port: clientPort,
      proxy: {
        "/api": { target: apiProxyTarget, changeOrigin: true },
      },
    },
    preview: {
      port: Number(env.VITE_PREVIEW_PORT || 4173),
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      rollupOptions: {
        input: { main: resolve(__dirname, "index.html") },
      },
    },
  };
});
