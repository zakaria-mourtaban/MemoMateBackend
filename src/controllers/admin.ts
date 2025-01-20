import { Chat } from '../models/Chat';
import User, { IUser } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Request, Response } from 'express';

export const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  try {
    const users = await User.find({}, '-password')
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAdminMetrics = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: Date.now() - 7 * 24 * 60 * 60 * 1000 }
    });
    const totalWorkspaces = await Workspace.countDocuments();
    const totalChats = await Chat.countDocuments();
    res.status(200).json({
      totalUsers,
      activeUsers,
      totalWorkspaces,
      totalChats
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const banUser = async (req: Request, res: Response) : Promise<any> => {
  const userId = req.params.id;
  try {
    const user = await User.findByIdAndUpdate(userId, { banned: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User banned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changeUserRole = async (req: Request, res: Response): Promise<any>=> {
  const userId = req.params.id;
  const newRole = req.body.role;
  if (!['user', 'admin'].includes(newRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  try {
    const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User role updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};