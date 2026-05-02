import { Request, Response, NextFunction } from "express";

/**
 * Role-based authorization guard.
 *
 * Pattern:
 * - Apply `requireAuth` first (so `req.user` exists).
 * - Then apply `requireRole("admin")` (or any other role string).
 *
 * Example:
 *   router.use(requireAuth);
 *   router.use(requireRole("admin"));
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // Usually means `requireAuth` middleware was not mounted.
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }

    next();
  };
}
