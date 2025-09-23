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

  // Delete user endpoint
  app.delete("/api/admin/users/:id", async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }

    try {
      const { id } = req.params;

      // Check if user exists
      const checkUserQuery = "SELECT id, email FROM auth_users WHERE id = ?";
      
      db.get(checkUserQuery, [id], (err, existingUser: any) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ success: false, error: "Database error" });
        }

        if (!existingUser) {
          return res.status(404).json({
            success: false,
            error: "User not found",
          });
        }

        // Prevent deletion of system admin
        if (existingUser.email === "admin@yitro.com") {
          return res.status(403).json({
            success: false,
            error: "Cannot delete system administrator",
          });
        }

        // Delete the user
        const deleteQuery = "DELETE FROM auth_users WHERE id = ?";
        db.run(deleteQuery, [id], function(err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, error: "Failed to delete user" });
          }

          res.json({
            success: true,
            message: "User deleted successfully",
          });
        });
      });
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete user",
      });
    }
  });

  // Admin statistics endpoint
  app.get("/api/admin/statistics", async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }
    
    // Basic token validation
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, error: "Invalid token format" });
    }
    
    // For demo purposes, accept any valid-looking JWT token
    // In production, you'd verify the token signature and expiration
    if (!token.includes('.')) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    
    // Get counts from all tables
    const queries = [
      "SELECT COUNT(*) as count FROM auth_users",
      "SELECT COUNT(*) as count FROM contacts",
      "SELECT COUNT(*) as count FROM accounts", 
      "SELECT COUNT(*) as count FROM leads",
      "SELECT COUNT(*) as count FROM active_deals",
      "SELECT COUNT(*) as count FROM activity_logs",
      "SELECT COUNT(*) as count FROM active_deals WHERE stage = 'ORDER_WON'",
      "SELECT SUM(CAST(REPLACE(REPLACE(dealValue, '$', ''), ',', '') AS REAL)) as total FROM active_deals WHERE stage = 'ORDER_WON' AND dealValue IS NOT NULL",
      "SELECT * FROM activity_logs ORDER BY dateTime DESC LIMIT 10",
      "SELECT id, displayName, email, role, createdAt FROM auth_users ORDER BY createdAt DESC"
    ];
    
    let completed = 0;
    const results: any = {};
    
    // Execute all queries
    db.get(queries[0], (err, row: any) => {
      if (err) console.error("Error getting users count:", err);
      results.totalUsers = row?.count || 0;
      if (++completed === 6) processResults();
    });
    
    db.get(queries[1], (err, row: any) => {
      if (err) console.error("Error getting contacts count:", err);
      results.totalContacts = row?.count || 0;
      if (++completed === 6) processResults();
    });
    
    db.get(queries[2], (err, row: any) => {
      if (err) console.error("Error getting accounts count:", err);
      results.totalAccounts = row?.count || 0;
      if (++completed === 6) processResults();
    });
    
    db.get(queries[3], (err, row: any) => {
      if (err) console.error("Error getting leads count:", err);
      results.totalLeads = row?.count || 0;
      if (++completed === 6) processResults();
    });
    
    db.get(queries[4], (err, row: any) => {
      if (err) console.error("Error getting deals count:", err);
      results.totalDeals = row?.count || 0;
      if (++completed === 6) processResults();
    });
    
    db.get(queries[5], (err, row: any) => {
      if (err) console.error("Error getting activities count:", err);
      results.totalActivities = row?.count || 0;
      if (++completed === 6) processResults();
    });
    
    function processResults() {
      // Get won deals count and total value
      db.get(queries[6], (err, row: any) => {
        if (err) console.error("Error getting won deals count:", err);
        results.wonDeals = row?.count || 0;
        
        db.get(queries[7], (err, row: any) => {
          if (err) console.error("Error getting total deal value:", err);
          results.totalDealValue = row?.total || 0;
          
          // Get recent activities
          db.all(queries[8], (err, activities: any[]) => {
            if (err) console.error("Error getting recent activities:", err);
            
            // Get user stats
            db.all(queries[9], (err, users: any[]) => {
              if (err) console.error("Error getting user stats:", err);
              
              // Send response
              res.json({
                success: true,
                data: {
                  summary: {
                    totalUsers: results.totalUsers,
                    totalContacts: results.totalContacts,
                    totalAccounts: results.totalAccounts,
                    totalLeads: results.totalLeads,
                    totalDeals: results.totalDeals,
                    totalActivities: results.totalActivities,
                    wonDeals: results.wonDeals,
                    totalDealValue: results.totalDealValue
                  },
                  recentActivities: (activities || []).map(activity => ({
                    id: activity.id,
                    type: activity.activityType?.replace('_', ' ') || 'Unknown',
                    summary: activity.summary || `${activity.activityType || 'Activity'} recorded`,
                    date: activity.dateTime || activity.createdAt,
                    contact: activity.associatedContact ? `Contact ${activity.associatedContact}` : null,
                    account: activity.associatedAccount ? `Account ${activity.associatedAccount}` : null,
                    outcome: activity.outcomeDisposition?.replace(/_/g, ' ') || null
                  })),
                  userStats: (users || []).map(user => ({
                    id: user.id,
                    name: user.displayName,
                    email: user.email,
                    role: user.role?.toUpperCase() || 'USER',
                    joinedAt: user.createdAt
                  }))
                }
              });
            });
          });
        });
      });
    }
  });

  // Basic CRM Accounts routes for frontend compatibility
  app.get("/api/accounts", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }
    
    db.all("SELECT * FROM accounts ORDER BY createdAt DESC", (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        // Return empty array if table doesn't exist
        return res.json({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
      }
      
      res.json({ 
        success: true, 
        data: rows || [], 
        pagination: { page: 1, limit: 10, total: (rows || []).length, totalPages: 1 }
      });
    });
  });

  app.get("/api/accounts/:id", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }
    
    db.get("SELECT * FROM accounts WHERE id = ?", [req.params.id], (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, error: "Failed to fetch account" });
      }
      
      if (!row) {
        return res.status(404).json({ success: false, error: "Account not found" });
      }
      
      res.json({ success: true, data: row });
    });
  });

  app.post("/api/accounts", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }
    
    const { name, accountName, industry, type, revenue, employees, location, phone, website, owner, rating } = req.body;
    
    if (!accountName && !name) {
      return res.status(400).json({ success: false, error: "Account name is required" });
    }
    
    const finalAccountName = accountName || name;
    const accountId = Date.now().toString();
    const now = new Date().toISOString();
    
    const insertQuery = `
      INSERT INTO accounts (id, accountName, accountRating, accountOwner, industry, revenue, numberOfEmployees, website, createdAt, updatedAt, createdBy, updatedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertQuery, [
      accountId,
      finalAccountName,
      rating || "Cold",
      owner || "Current User",
      industry || "Technology",
      revenue || "$0",
      employees || "1-10",
      website || "",
      now,
      now,
      "system",
      "system"
    ], function(err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, error: "Failed to create account" });
      }
      
      res.status(201).json({
        success: true,
        data: {
          id: accountId,
          name: finalAccountName,
          accountName: finalAccountName,
          industry: industry || "Technology",
          type: type || "Customer",
          revenue: revenue || "$0",
          employees: employees || "1-10",
          location: location || "",
          phone: phone || "",
          website: website || "",
          owner: owner || "Current User",
          rating: rating || "Cold",
          lastActivity: "Just now",
          activeDeals: 0,
          contacts: 0,
          createdAt: now,
          updatedAt: now
        }
      });
    });
  });

  app.put("/api/accounts/:id", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }
    
    const { name, accountName, industry, type, revenue, employees, location, phone, website, owner, rating } = req.body;
    const now = new Date().toISOString();
    const finalAccountName = accountName || name;
    
    const updateQuery = `
      UPDATE accounts SET 
        accountName = ?, accountRating = ?, accountOwner = ?, industry = ?, 
        revenue = ?, numberOfEmployees = ?, website = ?, updatedAt = ?, updatedBy = ?
      WHERE id = ?
    `;
    
    db.run(updateQuery, [
      finalAccountName,
      rating,
      owner,
      industry,
      revenue,
      employees,
      website,
      now,
      "system",
      req.params.id
    ], function(err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, error: "Failed to update account" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Account not found" });
      }
      
      res.json({ success: true, message: "Account updated successfully" });
    });
  });

  app.delete("/api/accounts/:id", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Authorization required" });
    }
    
    db.run("DELETE FROM accounts WHERE id = ?", [req.params.id], function(err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, error: "Failed to delete account" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Account not found" });
      }
      
      res.json({ success: true, message: "Account deleted successfully" });
    });
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