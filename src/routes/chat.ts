import express, { Request, Response } from "express";
import { protect } from "../middleware/auth";
import { diagramPrompt, getalltext } from "../controllers/chats";

const router = express.Router();

router.post("/chat/diagram", diagramPrompt)
router.get("/chat/all/:id", getalltext)
export default router