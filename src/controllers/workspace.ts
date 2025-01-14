import { Request, Response } from "express";
import multer from "multer";
import { IFile, IWorkspace, File, Workspace } from "../models/Workspace";
import User from "../models/User";
import mongoose, { ObjectId } from "mongoose";
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
		const newWorkspace = await Workspace.create({ name, ownerId: userId });

		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ $push: { workspacesObjects: newWorkspace._id } },
			{ new: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ message: "User not found." });
		}

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
		const id = req.params.id;

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

		const file = req.file;

		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res.status(404).json({ message: "Workspace not found." });
		}

		if (workspace.ownerId.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Unauthorized." });
		}

		const newFile: IFile = new File({
			_id: new mongoose.Types.ObjectId().toString(),
			ownerId: userId,
			name,
			file: file ? file.filename : null,
			children: file ? null : [],
		});

		workspace.workspace?.push(newFile._id);
		await newFile.save();
		await workspace.save();

		return res.status(200).json({
			message: "File or folder added successfully",
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

		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res.status(404).json({ message: "Workspace not found." });
		}

		if (workspace.ownerId !== userId) {
			return res.status(403).json({ message: "Unauthorized." });
		}

		const fileNode = await File.findById(nodeId);
		if (!fileNode) {
			return res.status(404).json({ message: "File node not found." });
		}

		if (fileNode.file) {
			const filePath = path.join(__dirname, "../uploads", fileNode.file);
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

const getWorkspaces = async (req: Request, res: Response): Promise<any> => {
	try {
		const UserId = req.user?.id;

		if (!UserId)
			return res.status(404).json({ message: "User not found." });

		const user = await User.findById(UserId);
		if (!user) return res.status(404).json({ message: "User not found" });
		const workspaceIds = user.workspacesObjects;
		const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });
		return res.status(200).json({workspaces})
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

export {
	createWorkspace,
	fetchWorkspace,
	deleteFromWorkspace,
	addToWorkspace,
	getWorkspaces,
};
