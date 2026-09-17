import { Router } from "express";
import {
  inviteAdministrator,
  testSMTP
} from "../controllers/adminInvitation.controller";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";

const router = Router();

/*
 * Test SMTP configuration.
 *
 * GET
 * /api/admin/invitations/test-smtp
 *
 * SUPER ADMIN ONLY
 */
router.get(
  "/test-smtp",
  requireSuperAdmin,
  testSMTP
);

/*
 * Send administrator invitation.
 *
 * POST
 * /api/admin/invitations
 *
 * SUPER ADMIN ONLY
 */
router.post(
  "/",
  requireSuperAdmin,
  inviteAdministrator
);

export default router;
