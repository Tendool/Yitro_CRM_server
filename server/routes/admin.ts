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

// Middleware to check if user is authenticated (admin or user)
const requireAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Access token required" });
  }

  try {
    const decoded = authService.verifyToken(token);
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
const generateCompanyEmail = (displayName: string): string => {
  const firstName = displayName.split(' ')[0]?.toLowerCase() || 'user';
  return `${firstName}@yitro.com`;
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
    const { email, displayName, password, role, contactNumber, department, designation } = req.body;

    if (!email || !displayName || !role) {
      return res.status(400).json({
        success: false,
        error: "Email, display name, and role are required",
      });
    }

    // Check if user already exists in both tables
    const [existingAuthUser, existingUserProfile] = await Promise.all([
      prisma.authUser.findUnique({ where: { email } }),
      prisma.userProfile.findUnique({ where: { email } })
    ]);

    if (existingAuthUser || existingUserProfile) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Generate secure password if not provided
    const userPassword = password || generatePassword();
    
    // Validate password
    if (userPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(userPassword, 12);

    // Split display name into first and last name
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] || displayName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create both auth user and user profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create auth user
      const newAuthUser = await tx.authUser.create({
        data: {
          email,
          displayName,
          passwordHash: hashedPassword,
          role: role.toLowerCase(),
          emailVerified: true, // Simplified for SQLite version
        },
      });

      // Create user profile
      const newUserProfile = await tx.userProfile.create({
        data: {
          email,
          firstName,
          lastName,
          phone: contactNumber,
          department,
          title: designation,
          role: mapRoleToPrismaEnum(role),
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      });

      return { authUser: newAuthUser, userProfile: newUserProfile };
    });

    // Try to send welcome email (don't fail user creation if email fails)
    try {
      await emailService.sendWelcomeEmail(email, userPassword, generateCompanyEmail(displayName));
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (emailError) {
      console.warn(`⚠️ Failed to send welcome email to ${email}:`, emailError);
      // Continue without failing the user creation
    }

    res.status(201).json({
      success: true,
      user: {
        id: result.authUser.id,
        email: result.authUser.email,
        displayName: result.authUser.displayName,
        role: result.authUser.role?.toUpperCase(),
        contactNumber,
        department,
        designation,
        emailVerified: result.authUser.emailVerified,
        createdAt: result.authUser.createdAt,
      },
      temporaryPassword: userPassword, // Include temp password in response for admin
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

    // Get recent activities across all users
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

// Get user-specific statistics (for regular users)
router.get("/user-statistics", requireAuth, async (req, res) => {
  try {
    const { user } = req; // From auth middleware
    
    if (!user || !user.email) {
      return res.status(400).json({
        success: false,
        error: "User information not available"
      });
    }

    // Get user display name from auth user or user profile
    let userDisplayName = user.displayName;
    if (!userDisplayName) {
      const userProfile = await prisma.userProfile.findUnique({
        where: { email: user.email },
        select: { firstName: true, lastName: true }
      });
      userDisplayName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : user.email;
    }

    // Get user-specific data based on owner field
    const [
      userContacts,
      userAccounts,
      userLeads,
      userDeals,
      userActivities,
      userWonDeals
    ] = await Promise.all([
      prisma.contact.count({
        where: { owner: userDisplayName }
      }),
      prisma.account.count({
        where: { accountOwner: userDisplayName }
      }),
      prisma.lead.count({
        where: { owner: userDisplayName }
      }),
      prisma.activeDeal.count({
        where: { dealOwner: userDisplayName }
      }),
      prisma.activityLog.count({
        where: { createdBy: userDisplayName }
      }),
      prisma.activeDeal.count({
        where: { 
          dealOwner: userDisplayName,
          stage: 'ORDER_WON' 
        }
      })
    ]);

    // Calculate user's deal values
    const userDealStats = await prisma.activeDeal.findMany({
      select: { dealValue: true, stage: true },
      where: { 
        dealOwner: userDisplayName,
        stage: 'ORDER_WON' 
      }
    });

    const userTotalDealValue = userDealStats.reduce((sum, deal) => {
      const value = parseFloat(deal.dealValue?.replace(/[$,]/g, '') || '0');
      return sum + value;
    }, 0);

    // Get user's recent activities
    const recentActivities = await prisma.activityLog.findMany({
      take: 5,
      where: { createdBy: userDisplayName },
      orderBy: { dateTime: 'desc' },
      include: {
        contact: { select: { firstName: true, lastName: true } },
        account: { select: { accountName: true } }
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalContacts: userContacts,
          totalAccounts: userAccounts,
          totalLeads: userLeads,
          totalDeals: userDeals,
          totalActivities: userActivities,
          wonDeals: userWonDeals,
          totalDealValue: userTotalDealValue
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
        userInfo: {
          name: userDisplayName,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error("Get user statistics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user statistics"
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
