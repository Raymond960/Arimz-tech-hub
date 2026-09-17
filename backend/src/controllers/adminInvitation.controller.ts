import { Request, Response } from "express";
import crypto from "crypto";
import {
  sendAdminInvitationEmail,
  verifySMTP
} from "../services/email.service";
import {
  findAdminByEmail,
  createAdminUser,
  updateAdminUser
} from "../../../server/db";
import { AdminRole } from "../../../src/types";

interface AdminRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  adminSession?: any;
}

function generateInvitationToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function parseAdminInviteExpiryMs(expStr?: string): number {
  const val = (expStr || process.env.ADMIN_INVITE_EXP || process.env.ADMIN_INVITE_EXPIRY_HOURS || "24h")
    .trim()
    .toLowerCase();

  if (val.endsWith("h")) {
    const hours = parseFloat(val.slice(0, -1));
    return (isNaN(hours) || hours <= 0 ? 24 : hours) * 60 * 60 * 1000;
  }
  if (val.endsWith("d")) {
    const days = parseFloat(val.slice(0, -1));
    return (isNaN(days) || days <= 0 ? 1 : days) * 24 * 60 * 60 * 1000;
  }
  if (val.endsWith("m")) {
    const mins = parseFloat(val.slice(0, -1));
    return (isNaN(mins) || mins <= 0 ? 1440 : mins) * 60 * 1000;
  }
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0) {
    return num < 1000 ? num * 60 * 60 * 1000 : num;
  }
  return 24 * 60 * 60 * 1000;
}

export async function testSMTP(
  req: AdminRequest,
  res: Response
) {
  try {
    await verifySMTP();

    return res.status(200).json({
      success: true,
      message:
        "SMTP email service is configured and connected successfully."
    });
  } catch (error: any) {
    console.error("SMTP TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS."
    });
  }
}

export async function inviteAdministrator(
  req: AdminRequest,
  res: Response
) {
  try {
    const actingUser = req.user || req.adminSession;
    if (!actingUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    if (actingUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only a Super Admin can invite or add new administrators."
      });
    }

    const { email, name, role: requestedRole, title: requestedTitle } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Administrator email is required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    const expiryMs = parseAdminInviteExpiryMs();
    const expiresAt = new Date(Date.now() + expiryMs);

    const token = generateInvitationToken();
    const hashedToken = hashToken(token);

    const frontendUrl = (
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      "https://shendamconnectapp.vercel.app/"
    ).replace(/\/$/, "");

    const invitationUrl = `${frontendUrl}/?invite_token=${encodeURIComponent(token)}#accept-invite`;

    const validRoles: AdminRole[] = [
      "SUPER_ADMIN",
      "CONTENT_ADMIN",
      "BOOKING_ADMIN",
      "ADVERTISING_ADMIN",
      "SUPPORT_ADMIN",
      "VIEWER"
    ];
    const assignedRole: AdminRole =
      requestedRole && validRoles.includes(requestedRole)
        ? requestedRole
        : "CONTENT_ADMIN";

    // Store invitation in database securely (Hashed token, expiry based on ADMIN_INVITE_EXP)
    try {
      const db = (globalThis as any).__shendam_db || { findAdminByEmail, createAdminUser, updateAdminUser };
      const existing = db.findAdminByEmail(normalizedEmail);

      if (existing) {
        if (existing.status === "active") {
          return res.status(400).json({
            success: false,
            message: "An active administrator account with this email already exists."
          });
        }
        // Update existing invited/disabled record
        db.updateAdminUser(
          existing.id,
          {
            status: "invited",
            invitationToken: hashedToken,
            invitationSentAt: new Date().toISOString(),
            invitationExpiresAt: expiresAt.toISOString(),
            acceptedAt: null as any,
            role: assignedRole,
            name: typeof name === "string" && name.trim() ? name.trim() : existing.name,
            title: requestedTitle || existing.title || "LGA Administrative Staff"
          },
          actingUser.email
        );
      } else {
        // Create new record with hashed invitation token
        db.createAdminUser({
          email: normalizedEmail,
          name: typeof name === "string" && name.trim() ? name.trim() : "Administrator",
          role: assignedRole,
          title: requestedTitle || "LGA Administrative Staff",
          status: "invited",
          createdBy: actingUser.email,
          invitationToken: hashedToken,
          invitationSentAt: new Date().toISOString(),
          invitationExpiresAt: expiresAt.toISOString()
        });
      }
    } catch (dbErr) {
      console.warn("[AdminInvitationController] DB storage notice:", dbErr);
    }

    // Attempt to send email via SMTP - Distinguishes between account creation and email sending
    try {
      await sendAdminInvitationEmail({
        email: normalizedEmail,
        name: typeof name === "string" ? name : undefined,
        invitationUrl,
        expiresAt
      });

      return res.status(201).json({
        success: true,
        accountCreated: true,
        emailSent: true,
        message:
          "Administrator account invitation created and email sent successfully.",
        data: {
          email: normalizedEmail,
          name: typeof name === "string" ? name : null,
          expiresAt,
          invitationUrl
        }
      });
    } catch (emailError: any) {
      console.error("ADMIN INVITATION EMAIL DISPATCH FAILED:", emailError?.message || emailError);
      return res.status(201).json({
        success: true,
        accountCreated: true,
        emailSent: false,
        message:
          "Administrator account created, but invitation email could not be delivered.",
        emailError:
          emailError instanceof Error
            ? emailError.message
            : "Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.",
        data: {
          email: normalizedEmail,
          name: typeof name === "string" ? name : null,
          expiresAt,
          invitationUrl
        }
      });
    }
  } catch (error) {
    console.error("ADMIN INVITATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to process administrator invitation."
    });
  }
}
