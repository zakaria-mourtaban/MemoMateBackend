import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { Error } from "mongoose";

const router = express.Router();

// Register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({ name, email, password });

    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "", { expiresIn: "30d" });
      res.status(201).json({ token });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error : any) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "", { expiresIn: "30d" });
      res.json({ token });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error : any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
