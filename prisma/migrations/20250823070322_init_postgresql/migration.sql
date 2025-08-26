-- CreateEnum
CREATE TYPE "public"."ContactSource" AS ENUM ('DATA_RESEARCH', 'REFERRAL', 'EVENT');

-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('SUSPECT', 'PROSPECT', 'ACTIVE_DEAL', 'DO_NOT_CALL');

-- CreateEnum
CREATE TYPE "public"."AccountRating" AS ENUM ('PLATINUM', 'GOLD', 'SILVER', 'BRONZE');

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('SUSPECT', 'PROSPECT', 'ACTIVE_DEAL', 'DO_NOT_CALL');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('CALL', 'EMAIL', 'LINKEDIN_MSG', 'SMS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."OutcomeDisposition" AS ENUM ('VOICEMAIL', 'RNR', 'MEETING_FIXED', 'MEETING_COMPLETED', 'MEETING_RESCHEDULED', 'NOT_INTERESTED', 'DO_NOT_CALL', 'CALLBACK_REQUESTED', 'EMAIL_SENT', 'EMAIL_RECEIVED');

-- CreateEnum
CREATE TYPE "public"."BusinessLine" AS ENUM ('HUMAN_CAPITAL', 'MANAGED_SERVICES', 'GCC', 'AUTOMATION', 'SUPPORT', 'PRODUCT', 'SOLUTION', 'RCM');

-- CreateEnum
CREATE TYPE "public"."Geography" AS ENUM ('AMERICAS', 'INDIA', 'PHILIPPINES', 'EMEA', 'ANZ');

-- CreateEnum
CREATE TYPE "public"."Entity" AS ENUM ('YITRO_GLOBAL', 'YITRO_TECH');

-- CreateEnum
CREATE TYPE "public"."DealStage" AS ENUM ('OPPORTUNITY_IDENTIFIED', 'PROPOSAL_SUBMITTED', 'NEGOTIATING', 'CLOSING', 'ORDER_WON', 'ORDER_LOST');

-- CreateEnum
CREATE TYPE "public"."LeadSource" AS ENUM ('WEBSITE', 'REFERRAL', 'TRADE_SHOW', 'COLD_CALL', 'EMAIL', 'PARTNER');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'WORKING', 'QUALIFIED', 'UNQUALIFIED');

-- CreateEnum
CREATE TYPE "public"."LeadRating" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'SALES_MANAGER', 'SALES_REP', 'USER');

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "associatedAccount" TEXT,
    "emailAddress" TEXT,
    "deskPhone" TEXT,
    "mobilePhone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "timeZone" TEXT,
    "source" "public"."ContactSource",
    "owner" TEXT,
    "status" "public"."ContactStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountRating" "public"."AccountRating",
    "accountOwner" TEXT,
    "status" "public"."AccountStatus",
    "industry" TEXT,
    "revenue" TEXT,
    "numberOfEmployees" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "zipPostCode" TEXT,
    "timeZone" TEXT,
    "boardNumber" TEXT,
    "website" TEXT,
    "geo" "public"."Geography",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" TEXT NOT NULL,
    "activityType" "public"."ActivityType" NOT NULL,
    "associatedContact" TEXT,
    "associatedAccount" TEXT,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "followUpSchedule" TEXT,
    "summary" TEXT,
    "outcomeDisposition" "public"."OutcomeDisposition",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."active_deals" (
    "id" TEXT NOT NULL,
    "dealOwner" TEXT,
    "dealName" TEXT NOT NULL,
    "businessLine" "public"."BusinessLine",
    "associatedAccount" TEXT,
    "associatedContact" TEXT,
    "closingDate" TIMESTAMP(3),
    "probability" TEXT,
    "dealValue" TEXT,
    "approvedBy" TEXT,
    "description" TEXT,
    "nextStep" TEXT,
    "geo" "public"."Geography",
    "entity" "public"."Entity",
    "stage" "public"."DealStage",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "active_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "leadSource" "public"."LeadSource",
    "status" "public"."LeadStatus",
    "rating" "public"."LeadRating",
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "department" TEXT,
    "role" "public"."UserRole" DEFAULT 'USER',
    "profilePhoto" TEXT,
    "timezone" TEXT,
    "language" TEXT DEFAULT 'en',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "passwordResetToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityDetails" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_password_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "public"."user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "public"."auth_users"("email");

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_associatedAccount_fkey" FOREIGN KEY ("associatedAccount") REFERENCES "public"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_associatedContact_fkey" FOREIGN KEY ("associatedContact") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_associatedAccount_fkey" FOREIGN KEY ("associatedAccount") REFERENCES "public"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."active_deals" ADD CONSTRAINT "active_deals_associatedAccount_fkey" FOREIGN KEY ("associatedAccount") REFERENCES "public"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."active_deals" ADD CONSTRAINT "active_deals_associatedContact_fkey" FOREIGN KEY ("associatedContact") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_activity_logs" ADD CONSTRAINT "auth_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_password_history" ADD CONSTRAINT "auth_password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
