import { Router } from "express";
import {
  createProjects,
  deleteProjects,
  getProjects,
  updateProjects,
} from "../controllers/projectController.js";

const router = Router();

router.get("/", getProjects);
router.post("/", createProjects);
router.put("/:id", updateProjects);
router.delete("/:id", deleteProjects);

export default router;
