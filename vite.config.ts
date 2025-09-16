import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "./"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      external: ["next/navigation", "next/router", "next/image"],
    },
  },
  plugins: [
    react({
      // Fix JSX runtime for production builds
      jsxImportSource: "react",
      plugins: [],
    }),
    expressPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  // Ensure proper JSX runtime handling
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Dynamically import the server to avoid loading Prisma during config time
      server.middlewares.use('/api', async (req, res, next) => {
        try {
          const { createServer } = await import("./server");
          const app = createServer();
          app(req, res, next);
        } catch (error) {
          console.error('Error loading server:', error);
          res.statusCode = 500;
          res.end('Server error: ' + error.message);
        }
      });
    },
  };
}
