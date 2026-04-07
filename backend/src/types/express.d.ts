import "express";

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
