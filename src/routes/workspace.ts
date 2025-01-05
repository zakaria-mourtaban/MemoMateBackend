import express, { Request, Response } from "express";
import { createWorkspace, destroyWorkspace, fetchWorkspace, updateWorkspace } from "../controllers/workspace";
import { protect } from "../middleware/auth";

const router = express.Router();

router.use(protect)
//create workspace
router.post("/workspace", createWorkspace)

//fetch workspace
router.get("/workspace/:workspaceID", fetchWorkspace)

//update workspace
router.patch("/workspace/:workspaceID", updateWorkspace)

//destroy workspace
router.delete("/workspace/:workspaceID", destroyWorkspace)

export default router;
