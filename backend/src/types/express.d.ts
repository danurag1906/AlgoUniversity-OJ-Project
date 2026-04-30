import "express";

/**
 * Express Request type augmentation.
 *
 * Runtime fields are attached by `src/middleware/requireAuth.ts`.
 * This file only informs TypeScript so route handlers can access `req.user`
 * without unsafe casting everywhere.
 */
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string | null;
    };
    sessionData?: {
      id: string;
      userId: string;
      expiresAt: Date;
    };
  }
}
