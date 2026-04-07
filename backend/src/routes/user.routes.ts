import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/profile", (req, res) => {
  res.json({ user: req.user });
});

export default router;
