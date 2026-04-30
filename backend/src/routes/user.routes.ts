import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/**
 * User routes (requires authentication).
 *
 * Example:
 * - `curl -b cookiejar.txt http://localhost:3001/api/user/profile`
 *
 * (How cookies are obtained depends on `better-auth` flows under `/api/auth/*`.)
 */
router.use(requireAuth);

router.get("/profile", (req, res) => {
  // `req.user` is populated by `requireAuth`.
  res.json({ user: req.user });
});

export default router;
