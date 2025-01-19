import express, { Request, Response } from "express";
import { 
    createWorkspace, 
    addToWorkspace, 
    fetchWorkspace, 
    deleteFromWorkspace, 
	getWorkspaces,
	deleteWorkspace,
	updateWorksapce
} from "../controllers/workspace";
import { protect } from "../middleware/auth";
import uploadMiddleware from "../middleware/upload";

const router = express.Router();

router.get("/workspace", getWorkspaces);

router.post("/workspace", createWorkspace);

router.get("/workspace/:id", fetchWorkspace);

router.post("/workspace/:id/add", uploadMiddleware, addToWorkspace);

router.put("/workspace/:id/delete", deleteFromWorkspace);

router.patch("/workspace/:id/delete", deleteWorkspace)

router.post("/workspace/:id/update", updateWorksapce)

export default router;