import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { Request, Response } from "express";

const generateToken = (id: string): string => {
	return jwt.sign({ id }, process.env.JWT_SECRET || "", { expiresIn: "30d" });
};
  
const registerUser = async (req: Request, res: Response): Promise<any> => {
	const { name, email, password } = req.body;
  
	try {
	  const userExists: IUser | null = await User.findOne({ email });
  
	  if (userExists) {
		return res.status(400).json({ message: "User already exists" });
	  }
  
	  const user: IUser = await User.create({ name, email, password });
	  
	  if (user) {
		res.status(201).json({
		  id: user._id,
		  name: user.name,
		  email: user.email,
		  token: generateToken(user._id),
		});
	  } else {
		res.status(400).json({ message: "Invalid user data" });
	  }
	} catch (error : any) {
	  res.status(500).json({ message: error.message });
	}
}
  
const authenticateUser = async (req: Request, res: Response) => {
	const { email, password } = req.body;
  
	try {
	  const user = await User.findOne({ email });
  
	  if (user && (await user.matchPassword(password))) {
		res.json({
		  id: user._id,
		  name: user.name,
		  email: user.email,
		  token: generateToken(user._id),
		});
	  } else {
		res.status(401).json({ message: "Invalid email or password" });
	  }
	} catch (error : any) {
	  res.status(500).json({ message: error.message });
	}
}
  
export {authenticateUser, registerUser}