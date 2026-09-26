import { Router } from "express";
import { saveMessage } from "../controllers/contactController.js";


export const messageRouter = Router();


messageRouter.get('/',()=>{});
messageRouter.post('/', saveMessage );
messageRouter.delete('/',()=>{});
