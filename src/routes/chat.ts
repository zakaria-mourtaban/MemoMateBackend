import express, { Request, Response } from "express";
import { protect } from "../middleware/auth";
import { diagramPrompt, getalltext, queryChatVectorStore, getChats } from "../controllers/chats";

const router = express.Router();

router.post("/chat/diagram", diagramPrompt)
router.post("/chat/all/:id", getalltext)
router.post("/chat/:id/call", queryChatVectorStore)
router.post("/chat/giveme", getChats)
export default router