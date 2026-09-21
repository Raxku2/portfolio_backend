import { Router } from "express";
import { googleAuthCallback, googleAuthStart, validateSession } from "../controllers/authController.js";


export const authRouter = Router();

authRouter.get('/google',googleAuthStart);
authRouter.get('/google/callback',googleAuthCallback);
authRouter.get('/session',validateSession);
