import express, { Request, Response } from "express";
import { protect } from "../middleware/auth";
import { diagramPrompt } from "../controllers/chats";

const router = express.Router();

router.post("/diagram", diagramPrompt)