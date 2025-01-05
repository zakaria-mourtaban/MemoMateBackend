import express, { Request, Response } from "express";
import { createWorkspace, destroyWorkspace, fetchWorkspace, updateWorkspace } from "../controllers/workspace";

const router = express.Router();


//create workspace
router.post("/workspace", createWorkspace)

//fetch workspace
router.post("/workspace/:id", fetchWorkspace)

//update workspace
router.patch("/workspace/:id", updateWorkspace)

//destroy workspace
router.delete("/workspace/:id", destroyWorkspace)

export default router;
