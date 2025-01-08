import { Request, Response } from "express";
import multer from "multer";
import {
	IFile,
	IWorkspace,
	File,
	Workspace,
} from "../models/Workspace";
import User from "../models/User";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

const createWorkspace = async (req: Request, res: Response): Promise<any> => {
	try {
		const { name } = req.body;
		const userId = req.user?._id;

		if (!userId) {
			return res
				.status(401)
				.json({ message: "Unauthorized. User not found." });
		}

		if (!name) {
			return res
				.status(400)
				.json({ message: "Workspace name is required." });
		}
		const newWorkspace = await Workspace.create({ name, ownerId: userId }); //create the new workspace object

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
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

const fetchWorkspace = async (req: Request, res: Response): Promise<any> => {
	try {
		const userId = req.user?._id;
		const id = req.params.id; // Get workspace ID from route params

		if (!userId) {
			return res
				.status(401)
				.json({ message: "Unauthorized. User not found." });
		}

		if (!id) {
			return res
				.status(400)
				.json({ message: "Workspace ID is required." });
		}

		// First verify that the user has access to this workspace
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		const hasAccess = user.workspacesObjects.includes(
			new mongoose.Types.ObjectId(id)
		);
		if (!hasAccess) {
			return res
				.status(403)
				.json({ message: "Access denied to this workspace." });
		}

		// Fetch the workspace object
		const workspace = await Workspace.findById(id);
		if (!workspace) {
			return res.status(404).json({ message: "Workspace not found." });
		}

		return res.status(200).json({
			message: "Workspace retrieved successfully.",
			workspace,
		});
	} catch (error) {
		console.error("Error fetching workspace:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

const addToWorkspace = async (req: Request, res: Response): Promise<any> => {
	try {
		const userId = req.user?._id;
		const workspaceId = req.params.id;
		const { name } = req.body;

		if (!userId || !workspaceId || !name) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		// Check if a file was uploaded
		const file = req.file;
		if (!file) {
			return res.status(400).json({ message: "File is required." });
		}

		// Fetch the Workspace
		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res
				.status(404)
				.json({ message: "Workspace not found." });
		}

		if (workspace.ownerId.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Unauthorized." });
		}

		// Create a new file node
		const newFile: IFile = new File({
			_id: new mongoose.Types.ObjectId().toString(),
			ownerId: userId,
			name,
			file: file.filename, // Save file metadata
			children: [],
		});

		workspace.workspace?.push(newFile._id);
		await newFile.save();
		await workspace.save();

		return res.status(200).json({
			message: "File added successfully",
			workspace,
		});
	} catch (error) {
		console.error("Error adding to workspace:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

const deleteFromWorkspace = async (
	req: Request,
	res: Response
): Promise<any> => {
	try {
		const userId = req.user?._id;
		const workspaceId = req.params.id;
		const { nodeId } = req.body;

		if (!userId || !workspaceId || !nodeId) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		// Fetch the Workspace
		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res
				.status(404)
				.json({ message: "Workspace not found." });
		}

		if (workspace.ownerId !== userId) {
			return res.status(403).json({ message: "Unauthorized." });
		}

		// Find and delete the file node
		const fileNode = await File.findById(nodeId);
		if (!fileNode) {
			return res.status(404).json({ message: "File node not found." });
		}

		// Optionally delete the associated file from the filesystem
		if (fileNode.file) {
			const filePath = path.join(
				__dirname,
				"../uploads",
				fileNode.file
			);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}

		await fileNode.deleteOne();

		return res.status(200).json({
			message: "File and associated node deleted successfully.",
		});
	} catch (error) {
		console.error("Error deleting from workspace:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

export { createWorkspace, fetchWorkspace, deleteFromWorkspace, addToWorkspace };
