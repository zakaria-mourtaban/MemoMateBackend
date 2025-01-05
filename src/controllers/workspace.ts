import { Request, Response } from "express";
import {
	IWorkspaceObject,
	Workspace,
	WorkspaceObject,
} from "../models/Workspace";
import User from "../models/User";
import mongoose from "mongoose";

const createWorkspace = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name } = req.body;
        const userId = req.user?._id; 

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized. User not found." });
        }

        if (!name) {
            return res.status(400).json({ message: "Workspace name is required." });
        }
        const newWorkspace = await WorkspaceObject.create({ name }); //create the new workspace object

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $push: { workspacesObjects: newWorkspace._id } }, // Add the workspace reference
            { new: true } // Return the updated user document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Respond with success
        return res.status(201).json({
            message: "Workspace created and added to user successfully.",
            workspace: newWorkspace,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error creating Workspace and updating User:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
};

const fetchWorkspace = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?._id;
        const workspaceId = req.params.workspaceID; // Get workspace ID from route params

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized. User not found." });
        }

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required." });
        }

        // First verify that the user has access to this workspace
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
		}

        const hasAccess = user.workspacesObjects.includes(new mongoose.Types.ObjectId(workspaceId));
        if (!hasAccess) {
            return res.status(403).json({ message: "Access denied to this workspace." });
        }

        // Fetch the workspace object
        const workspace = await WorkspaceObject.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found." });
        }

        return res.status(200).json({
            message: "Workspace retrieved successfully.",
            workspace
        });
    } catch (error) {
        console.error("Error fetching workspace:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
};

const updateWorkspace = (req: Request, res: Response) => {
	const { name, email, password } = req.body;
};

const destroyWorkspace = (req: Request, res: Response) => {
	const { name, email, password } = req.body;
};

export { createWorkspace, fetchWorkspace, updateWorkspace, destroyWorkspace };
