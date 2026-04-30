import { Request, Response, NextFunction } from "express";
import { getAuth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

/**
 * Authentication guard middleware.
 *
 * What it does:
 * - Asks `better-auth` to resolve the current session from incoming request headers.
 * - If there's no valid session: respond `401 Unauthorized`.
 * - If session exists: attach `req.user` + `req.sessionData` for downstream handlers.
 *
 * Why it returns a Promise:
 * - Session resolution may query MongoDB and is therefore async.
 *
 * Example usage:
 * - `router.use(requireAuth)` before defining protected endpoints.
 * - Then handlers can safely use `req.user!.id`.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Convert Express headers to a format expected by better-auth's Node adapter.
  const session = await getAuth().api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Normalize session fields into our request shape so route code can stay simple.
  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as { role?: string }).role ?? "user",
    image: session.user.image,
  };
  req.sessionData = {
    id: session.session.id,
    userId: session.session.userId,
    expiresAt: session.session.expiresAt,
  };

  next();
}
