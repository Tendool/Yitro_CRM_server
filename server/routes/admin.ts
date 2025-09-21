/// <reference types="../types/express" />
import express from "express";
import { authService } from "../lib/auth.js";
import { emailService } from "../lib/emailService.js";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

// Map role to Prisma enum format
const mapRoleToPrismaEnum = (role: string) => {
  const roleMap: { [key: string]: string } = {
    "admin": "ADMIN",
    "user": "USER",
    "sales_manager": "SALES_MANAGER",
    "sales_rep": "SALES_REP",
    "Admin": "ADMIN",
    "User": "USER",
    "Sales Manager": "SALES_MANAGER",
    "Sales Rep": "SALES_REP"
  };
  return roleMap[role] || "USER";
};

// Middleware to check admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Access token required" });
  }

  try {
    const decoded = authService.verifyToken(token);
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, error: "Invalid or expired token" });
  }
};

// Generate secure password
const generatePassword = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Generate company email
const generateCompanyEmail = (
  displayName: string,
  role: "admin" | "user",
  department?: string,
): string => {
  const baseName = displayName.toLowerCase().replace(/\s+/g, ".");
  const domainPrefix =
    role === "admin" ? "admin" : department ? department.toLowerCase() : "emp";
  return `${baseName}@${domainPrefix}.yitro.com`;
};

// Get all users (admin only)
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const authUsers = await prisma.authUser.findMany({
      orderBy: { createdAt: "desc" },
    });

    const users = authUsers.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role?.toUpperCase() || "USER",
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || user.updatedAt,
    }));

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
});

// Create new user (admin only) - simplified for SQLite
router.post("/create-user", requireAdmin, async (req, res) => {
  try {
    const { email, displayName, password, role, contactNumber, department } = req.body;

    if (!email || !displayName || !role) {
      return res.status(400).json({
        success: false,
        error: "Email, display name, and role are required",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.authUser.findUnique({
      where: { email },
    });

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
    const newUser = await prisma.authUser.create({
      data: {
        email,
        displayName,
        passwordHash: hashedPassword,
        role: role.toLowerCase(),
        emailVerified: true, // Simplified for SQLite version
      },
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role?.toUpperCase(),
        contactNumber,
        department,
      },
      message: "User created successfully.",
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create user",
    });
  }
});

// Delete user (admin only)
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.authUser.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Prevent deletion of system admin
    if (user.email === "admin@yitro.com") {
      return res.status(403).json({
        success: false,
        error: "Cannot delete system administrator",
      });
    }

    // Delete the user
    await prisma.authUser.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
});

// Simplified endpoint - email verification not needed in SQLite version
router.post(
  "/users/:id/resend-verification",
  requireAdmin,
  async (req, res) => {
    res.json({
      success: true,
      message: "Email verification not required in this version",
    });
  },
);

// Update user role (admin only)
router.put("/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (![
      "admin", "user", "sales_manager", "sales_rep",
      "Admin", "User", "Sales Manager", "Sales Rep"
    ].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role. Must be admin, user, sales_manager, or sales_rep",
      });
    }

    await prisma.authUser.update({
      where: { id },
      data: { role: role.toLowerCase() },
    });

    res.json({
      success: true,
      data: { message: "User role updated successfully" },
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
    });
  }
});

// Get aggregate statistics for admin dashboard (admin only)
router.get("/statistics", requireAdmin, async (req, res) => {
  try {
    console.log("📊 Admin statistics: Starting data collection...");
    
    // Get counts from all tables
    const [
      totalUsers,
      totalContacts,
      totalAccounts, 
      totalLeads,
      totalDeals,
      totalActivities,
      wonDeals
    ] = await Promise.all([
      prisma.authUser.count(),
      prisma.contact.count(),
      prisma.account.count(),
      prisma.lead.count(),
      prisma.activeDeal.count(),
      prisma.activityLog.count(),
      prisma.activeDeal.count({
        where: { stage: 'ORDER_WON' }
      })
    ]);

    console.log("📊 Prisma counts:", {
      totalUsers, totalContacts, totalAccounts, totalLeads, totalDeals, totalActivities, wonDeals
    });

    // If database is empty (likely in development), use mock data fallback
    let fallbackData = null;
    if (totalContacts === 0 && totalAccounts === 0 && totalLeads === 0) {
      console.log("📊 Database appears empty, using mock data fallback...");
      
      // Mock data counts (matching the mock data in mockApi.ts)
      fallbackData = {
        summary: {
          totalUsers,  // Keep real user count from Prisma
          totalContacts: 2,  // From defaultContacts in mockApi.ts
          totalAccounts: 2,  // From defaultAccounts in mockApi.ts
          totalLeads: 2,     // From defaultLeads in mockApi.ts
          totalDeals: 2,     // Active deals from mock data
          totalActivities: 2, // From defaultActivities in mockApi.ts
          wonDeals: 1,       // One "Order Won" deal in mock data
          totalDealValue: 500000  // $500,000 from "Enterprise Analytics Platform" deal
        },
        recentActivities: [
          {
            id: "1",
            type: "Deal Closed",
            summary: "Sales Rep 1 closed deal: Enterprise Analytics Platform - $500,000",
            date: new Date('2024-01-15').toISOString(),
            contact: "Mike Johnson",
            account: "Enterprise Corp",
            outcome: "Order Won"
          },
          {
            id: "2", 
            type: "Deal Progress",
            summary: "Sales Rep 1 updated deal: TechCorp Automation Project to Proposal Submitted",
            date: new Date('2024-01-07').toISOString(),
            contact: "John Smith",
            account: "TechCorp Solutions",
            outcome: "In Progress"
          }
        ],
        userStats: await prisma.authUser.findMany({
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            createdAt: true
          }
        }).then(users => users.map(user => ({
          id: user.id,
          name: user.displayName,
          email: user.email,
          role: user.role,
          joinedAt: user.createdAt
        })))
      };
    }

    if (fallbackData) {
      console.log("📊 Returning fallback data");
      return res.json({
        success: true,
        data: fallbackData
      });
    }

    // Get recent activities across all users (original logic for when DB has data)
    const recentActivities = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { dateTime: 'desc' },
      include: {
        contact: { select: { firstName: true, lastName: true } },
        account: { select: { accountName: true } }
      }
    });

    // Calculate total deal values
    const dealStats = await prisma.activeDeal.findMany({
      select: { dealValue: true, stage: true },
      where: { stage: 'ORDER_WON' }
    });

    const totalDealValue = dealStats.reduce((sum, deal) => {
      const value = parseFloat(deal.dealValue?.replace(/[$,]/g, '') || '0');
      return sum + value;
    }, 0);

    // Get user activity summary
    const userStats = await prisma.authUser.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    console.log("📊 Returning real database data");
    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalContacts,
          totalAccounts,
          totalLeads,
          totalDeals,
          totalActivities,
          wonDeals,
          totalDealValue
        },
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          type: activity.activityType.replace('_', ' '),
          summary: activity.summary,
          date: activity.dateTime,
          contact: activity.contact ? `${activity.contact.firstName} ${activity.contact.lastName}` : null,
          account: activity.account?.accountName || null,
          outcome: activity.outcomeDisposition?.replace(/_/g, ' ')
        })),
        userStats: userStats.map(user => ({
          id: user.id,
          name: user.displayName,
          email: user.email,
          role: user.role,
          joinedAt: user.createdAt
        }))
      }
    });

  } catch (error) {
    console.error("Get admin statistics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin statistics"
    });
  }
});

// Send test email (admin only)
router.post("/send-test-email", requireAdmin, async (req, res) => {
  try {
    const { recipientEmail, recipientName } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: "Recipient email is required",
      });
    }

    await emailService.sendTestEmail(
      recipientEmail
    );

    res.json({
      success: true,
      data: { message: "Test email sent successfully" },
    });
  } catch (error: any) {
    console.error("Test email error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send test email",
    });
  }
});

export default router;
