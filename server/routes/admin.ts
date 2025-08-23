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
    const userProfiles = await prisma.userProfile.findMany({
      orderBy: { createdAt: "desc" },
    });

    const users = userProfiles.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role?.toLowerCase() || "user",
      emailVerified: true, // Simplified for SQLite version
      createdAt: user.createdAt,
      lastLogin: user.updatedAt, // Use updatedAt as proxy for last login
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
    const { email, displayName, role, contactNumber, department } = req.body;

    if (!email || !displayName || !role) {
      return res.status(400).json({
        success: false,
        error: "Email, display name, and role are required",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.userProfile.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Create user profile
    const newUser = await prisma.userProfile.create({
      data: {
        email,
        firstName: displayName.split(" ")[0] || displayName,
        lastName: displayName.split(" ").slice(1).join(" ") || "",
        phone: contactNumber,
        department,
        role: mapRoleToPrismaEnum(role),
      },
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: `${newUser.firstName} ${newUser.lastName}`.trim(),
        role: newUser.role?.toLowerCase(),
        contactNumber: newUser.phone,
        department: newUser.department,
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
    const user = await prisma.userProfile.findUnique({
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
    await prisma.userProfile.delete({
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

    // Map role to Prisma enum format
    const mapRoleToPrismaEnum = (r: string) => {
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
      return roleMap[r] || "USER";
    };

    await prisma.userProfile.update({
      where: { id },
      data: { role: mapRoleToPrismaEnum(role) },
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
      recipientEmail,
      recipientName || "Test User",
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

