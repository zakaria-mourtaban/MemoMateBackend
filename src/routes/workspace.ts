import express, { Request, Response } from "express";
import { 
    createWorkspace, 
    addToWorkspace, 
    fetchWorkspace, 
    deleteFromWorkspace 
} from "../controllers/workspace";
import { protect } from "../middleware/auth";
import uploadMiddleware from "../middleware/upload";

const router = express.Router();

router.post("/workspace", createWorkspace);

router.get("/workspace/:id", fetchWorkspace);

router.post("/workspace/:id/add", uploadMiddleware, addToWorkspace);

router.put("/workspace/:id/delete", deleteFromWorkspace);

export default router;