import { Request, Response, NextFunction } from "express";
import { validateSessionToken } from "../../../server/auth";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  adminSession?: any;
}

function parseAuthToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const customHeader = req.headers["x-admin-token"] as string;
  if (customHeader) {
    return customHeader.trim();
  }

  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";");
    for (const cookie of cookies) {
      const [name, val] = cookie.split("=");
      if (name && name.trim() === "shendam_admin_token" && val) {
        return decodeURIComponent(val.trim());
      }
    }
  }

  return "";
}

export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // If user is already attached by upstream middleware or session
  if (!req.user && req.adminSession) {
    req.user = {
      id: req.adminSession.id || req.adminSession.adminId || "",
      email: req.adminSession.adminEmail,
      role: req.adminSession.role
    };
  }

  // If user is still not resolved, try to authenticate via session token
  if (!req.user) {
    const token = parseAuthToken(req);
    if (token) {
      try {
        const validator = (globalThis as any).__shendam_auth?.validateSessionToken || validateSessionToken;
        const session = validator(token);
        if (session) {
          req.user = {
            id: session.adminId || "",
            email: session.adminEmail,
            role: session.role
          };
          req.adminSession = session;
        }
      } catch (err) {
        console.warn("[requireSuperAdmin] Token validation notice:", err);
      }
    }
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only a Super Admin can invite or manage administrators."
    });
  }

  next();
}
