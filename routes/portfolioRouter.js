import { Router } from "express";
import {
  addExperience,
  addSkill,
  deleteExperience,
  getPortfolio,
  getSkills,
  makeCatagory,
  readExperience,
  removeCatagory,
  removeSkill,
  updateCatagory,
  updateExperience,
  updatePortfolio,
  updateSkill,
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
router.put("/skill", updateSkill);
router.delete("/skill", removeSkill);

router.get("/experience", readExperience);
router.post("/experience", addExperience);
router.put("/experience", updateExperience);
router.delete("/experience", deleteExperience);


export default router;
