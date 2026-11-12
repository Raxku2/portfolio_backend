import { Router } from "express";
import {
  createUploadAuth,
  removeUploadedFile,
} from "../controllers/imagekitController.js";

const router = Router();

router.get("/auth", createUploadAuth);
router.delete("/file", removeUploadedFile);

export default router;
