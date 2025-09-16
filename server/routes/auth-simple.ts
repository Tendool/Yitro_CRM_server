/// <reference types="../types/express" />
import express from "express";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { dbFallback } from "../lib/database-fallback.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-for-testing";

// Simple signin endpoint that works without Prisma
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    console.log(`🔐 Signin attempt for: ${email}`);

    // Find user in database
    const user = await dbFallback.findUserByEmail(email);
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create session
    const sessionData = {
      userId: user.id,
      tokenHash: await bcrypt.hash(token, 10),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    await dbFallback.createSession(sessionData);

    // Update last login
    await dbFallback.updateUser(user.id, { lastLogin: new Date().toISOString() });

    console.log(`✅ Signin successful for: ${email}`);

    // Set cookie for session persistence
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(200).json({
      success: true,
      message: "Signed in successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          emailVerified: user.emailVerified
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Signin error:', error);
    return res.status(500).json({
      success: false,
      error: "Internal server error: " + error.message
    });
  }
});

// Simple middleware to check authentication
export const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: "Access token required" 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: "Invalid or expired token" 
    });
  }
};

// Signout endpoint  
router.post("/signout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      // Deactivate all user sessions
      await dbFallback.deactivateUserSessions(userId);
      console.log(`User ${userId} signed out successfully`);
    }

    // Clear cookie
    res.clearCookie('auth_token');

    return res.status(200).json({
      success: true,
      message: "Signed out successfully"
    });

  } catch (error: any) {
    console.error('Signout error:', error);
    return res.status(500).json({
      success: false,
      error: "Internal server error: " + error.message
    });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid authentication"
      });
    }

    const user = await dbFallback.get(
      'SELECT id, email, displayName, role, emailVerified, lastLogin FROM auth_users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: "Internal server error: " + error.message
    });
  }
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ 
    message: "Auth system is working!",
    timestamp: new Date().toISOString()
  });
});

export default router;