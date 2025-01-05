import express, { Request, Response } from "express";

const router = express.Router();


//create workspace
router.post("/workspace")

//fetch workspace
router.post("/workspace/:id")

//update workspace
router.patch("/workspace/:id")

//destroy workspace
router.delete("/workspace/:id")

export default router;
