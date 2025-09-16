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

  // Create new user endpoint
  app.post("/api/admin/create-user", async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }

    try {
      const { email, displayName, password, role, contactNumber, department } = req.body;

      if (!email || !displayName || !role) {
        return res.status(400).json({
          success: false,
          error: "Email, display name, and role are required",
        });
      }

      // Check if user already exists
      const checkUserQuery = "SELECT id FROM auth_users WHERE email = ?";
      
      db.get(checkUserQuery, [email], async (err, existingUser) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ success: false, error: "Database error" });
        }

        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: "User with this email already exists",
          });
        }

        // Generate secure password if not provided
        const userPassword = password || generatePassword();
        
        // Hash password
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(userPassword, 12);

        // Create auth user
        const insertQuery = `
          INSERT INTO auth_users (id, email, displayName, passwordHash, role, emailVerified, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const userId = `user-${Date.now()}`;
        const now = new Date().toISOString();
        
        db.run(insertQuery, [
          userId,
          email,
          displayName,
          hashedPassword,
          role.toLowerCase(),
          1, // emailVerified = true
          now,
          now
        ], function(err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, error: "Failed to create user" });
          }

          res.status(201).json({
            success: true,
            user: {
              id: userId,
              email,
              displayName,
              role: role.toUpperCase(),
              contactNumber,
              department,
            },
            message: "User created successfully.",
          });
        });
      });
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create user",
      });
    }
  });

  // Generate secure password helper
  const generatePassword = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

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