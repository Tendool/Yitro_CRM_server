import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "./prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  emailVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface SignUpRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export class AuthService {
  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Verify password
  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
  }

  // Verify JWT token
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  // Determine user role based on email domain and patterns
  private determineUserRole(email: string): "admin" | "user" {
    // Admin patterns
    if (
      email === "admin@yitro.com" ||
      email.includes("@admin.yitro.com") ||
      email.startsWith("admin@") ||
      email.includes(".admin@")
    ) {
      return "admin";
    }

    // All other company emails are users
    return "user";
  }

  // Map internal role to Prisma enum
  private mapRoleToPrismaEnum(role: "admin" | "user") {
    return role === "admin" ? "ADMIN" : "USER";
  }

  // Map Prisma enum to internal role
  private mapPrismaEnumToRole(enumValue: string | null): "admin" | "user" {
    if (enumValue === "ADMIN") return "admin";
    return "user";
  }

  // Create user account
  public async signUp(
    data: SignUpRequest,
  ): Promise<{ user: User; token: string; verificationToken: string }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.userProfile.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Determine role
      const role = this.determineUserRole(data.email);

      // Generate verification token
      const verificationToken = jwt.sign(
        { email: data.email, action: "verify-email" },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      // Create user in database
      const newUser = await prisma.userProfile.create({
        data: {
          email: data.email,
          firstName: data.displayName.split(" ")[0] || data.displayName,
          lastName: data.displayName.split(" ").slice(1).join(" ") || "",
          role: this.mapRoleToPrismaEnum(role),
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      });

      const user: User = {
        id: newUser.id,
        email: newUser.email,
        displayName: `${newUser.firstName} ${newUser.lastName}`.trim(),
        role: (newUser.role?.toLowerCase() as any) || "user",
        emailVerified: true, // Auto-verify for simplicity
        createdAt: newUser.createdAt,
      };

      const token = this.generateToken(user);

      return { user, token, verificationToken };
    } catch (error) {
      console.error("SignUp error:", error);
      throw error;
    }
  }

  // Sign in user - simplified for demo
  public async signIn(
    data: SignInRequest,
  ): Promise<{ user: User; token: string }> {
    try {
      // For demo purposes, we'll use a simplified auth
      // In production, you'd want proper password handling

      let userRecord = await prisma.userProfile.findUnique({
        where: { email: data.email },
      });

      // If user doesn't exist, create them (demo behavior)
      if (!userRecord) {
        const role = this.determineUserRole(data.email);
        userRecord = await prisma.userProfile.create({
          data: {
            email: data.email,
            firstName: data.email.split("@")[0],
            lastName: "",
            role: this.mapRoleToPrismaEnum(role),
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
          },
        });
      }

      const user: User = {
        id: userRecord.id,
        email: userRecord.email,
        displayName: `${userRecord.firstName} ${userRecord.lastName}`.trim(),
        role: this.mapPrismaEnumToRole(userRecord.role),
        emailVerified: true,
        createdAt: userRecord.createdAt,
        lastLogin: new Date(),
      };

      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      console.error("SignIn error:", error);
      throw error;
    }
  }

  // Get user by ID
  public async getUserById(userId: string): Promise<User | null> {
    try {
      const userRecord = await prisma.userProfile.findUnique({
        where: { id: userId },
      });

      if (!userRecord) {
        return null;
      }

      return {
        id: userRecord.id,
        email: userRecord.email,
        displayName: `${userRecord.firstName} ${userRecord.lastName}`.trim(),
        role: this.mapPrismaEnumToRole(userRecord.role),
        emailVerified: true,
        createdAt: userRecord.createdAt,
      };
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();

