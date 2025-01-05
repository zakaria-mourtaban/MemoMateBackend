import express, { Request, Response } from "express";
import { 
    createWorkspace, 
    addToWorkspace, 
    fetchWorkspace, 
    deleteFromWorkspace 
} from "../controllers/workspace";
import { protect } from "../middleware/auth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Create a new workspace
router.post("/workspace", createWorkspace);

// Fetch a specific workspace
router.get("/workspace/:id", fetchWorkspace);

// Add a new node to workspace
router.post("/workspace/:id/add", addToWorkspace);


// Delete node from workspace
router.put("/workspace/:id/delete", deleteFromWorkspace);

export default router;