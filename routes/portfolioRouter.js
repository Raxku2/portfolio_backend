import { Router } from "express";
import {
    addExperience,
  addSkill,
  getPortfolio,
  getSkills,
  makeCatagory,
  readExperience,
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

router.get('/experience',readExperience);
router.post('/experience',addExperience);
router.patch('/experience',()=>{});
router.delete('/experience',()=>{});


export default router;
