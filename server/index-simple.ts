import express, { type Express } from "express";
import cors from "cors";
import authSimpleRoutes from "./routes/auth-simple.js";

export function createServerSimple(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Debug middleware
  app.use((req, res, next) => {
    if (req.url.startsWith("/api/")) {
      console.log(`API Request: ${req.method} ${req.url}`);
    }
    next();
  });

  // Simple auth routes
  app.use("/api/auth", authSimpleRoutes);

  // Basic test routes
  app.get("/api/ping", (req, res) => {
    res.json({ 
      message: "pong", 
      timestamp: new Date().toISOString(),
      database: "sqlite-fallback" 
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "1.0.0",
      database: "sqlite",
      timestamp: new Date().toISOString()
    });
  });

  return app;
}