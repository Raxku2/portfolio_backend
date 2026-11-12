import { Router } from "express";
import {
  googleAuthCallback,
  googleAuthStart,
  logout,
  validateSession,
} from "../controllers/authController.js";

export const authRouter = Router();

authRouter.get("/google", googleAuthStart);
authRouter.get("/google/callback", googleAuthCallback);
authRouter.get("/session", validateSession);
authRouter.post("/logout", logout);
