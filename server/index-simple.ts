import express, { type Express } from "express";
import cors from "cors";
import authSimpleRoutes from "./routes/auth-simple.js";
import sqlite3 from "sqlite3";
import path from "path";

export function createServerSimple(): Express {
  const app = express();
  
  // Initialize SQLite database connection
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
  const db = new sqlite3.Database(dbPath);

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
  
  // Simple admin routes for testing
  app.get("/api/admin/users", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }
    
    db.all("SELECT id, email, displayName, role, emailVerified, createdAt, lastLogin FROM auth_users ORDER BY createdAt DESC", (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, error: "Failed to fetch users" });
      }
      
      const users = rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role?.toUpperCase() || "USER",
        emailVerified: user.emailVerified === 1,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || user.updatedAt,
      }));
      
      res.json({ success: true, users });
    });
  });

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