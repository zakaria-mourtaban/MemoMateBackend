import express, { Request, Response } from "express";
import { authenticateUser, registerUser } from "../controllers/auth";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", authenticateUser );

export default router;
