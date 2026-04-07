import { Request, Response, NextFunction } from "express";
import { getAuth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = await getAuth().api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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
