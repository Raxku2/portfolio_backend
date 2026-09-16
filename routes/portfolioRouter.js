import { Router } from "express";
import {
  addSkill,
  getPortfolio,
  getSkills,
  makeCatagory,
  removeCatagory,
  removeSkill,
  updateCatagory,
  updatePortfolio,
} from "../controllers/portfolioController.js";

const router = Router();

router.get("/info/:id", getPortfolio);

router.put("/info/:id", updatePortfolio);

router.get("/skills", getSkills);

router.post("/skillcatagories", makeCatagory);
//
router.put("/skillcatagories", updateCatagory);
//
router.delete("/skillcatagories", removeCatagory);
//
router.post("/skill", addSkill);
//
// router.put('/skill');
//
router.delete('/skill',removeSkill);

export default router;
