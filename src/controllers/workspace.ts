import { Request, Response } from "express";
import {
	IWorkspaceObject,
	IWorkspace,
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
			return res
				.status(401)
				.json({ message: "Unauthorized. User not found." });
		}

		if (!name) {
			return res
				.status(400)
				.json({ message: "Workspace name is required." });
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
		const workspace = await WorkspaceObject.findById(id);
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
		const id = req.params.id;
		const { name } = req.body;

		if (!userId || !id || !name) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		const workspace = await Workspace.findById(id);
		if (!workspace) {
			console.log("here")
			const workspaceObj = await WorkspaceObject.findById(id);
			if (!workspaceObj)
				return res.status(404).json({ message: "Workspace not found" });
			const newNode = new Workspace({
				_id: new mongoose.Types.ObjectId().toString(),
				name,
				children: [],
			});
			workspaceObj.workspace = newNode;
			await newNode.save();
			await workspaceObj.save();
			return res.status(200).json({
				message: "Node added successfully",
				node: newNode,
				workspace: workspaceObj,
			});
		} else {
			// Create new workspace node with unique ID
			const newNode = new Workspace({
				_id: new mongoose.Types.ObjectId().toString(),
				name,
				children: [],
			});

			workspace && workspace.children?.push(newNode);
			await newNode.save()
			await workspace.save()
			return res.status(200).json({
				message: "Node added successfully",
				node: newNode,
				workspace: workspace,
			});
		}
	} catch (error) {
		console.error("Error adding to workspace:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

const updateWorkspace = async (req: Request, res: Response): Promise<any> => {
	try {
		const userId = req.user?._id;
		const id = req.params.id;
		const { workspace } = req.body;

		if (!userId || !id || !workspace) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		const workspaceObj = await WorkspaceObject.findById(id);
		if (!workspaceObj) {
			return res.status(404).json({ message: "Workspace not found" });
		}

		// Update the entire workspace structure
		workspaceObj.workspace = workspace;
		await workspaceObj.save();

		return res.status(200).json({
			message: "Workspace updated successfully",
			workspace: workspaceObj,
		});
	} catch (error) {
		console.error("Error updating workspace:", error);
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
		const id = req.params.id;
		const { workspace, deletedNodeId } = req.body;

		if (!userId || !id || !workspace || !deletedNodeId) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		const workspaceObj = await WorkspaceObject.findById(id);
		if (!workspaceObj) {
			return res.status(404).json({ message: "Workspace not found" });
		}

		// Update with new structure (node already removed from the client-side)
		workspaceObj.workspace = workspace;
		await workspaceObj.save();

		return res.status(200).json({
			message: "Node deleted successfully",
			workspace: workspaceObj,
		});
	} catch (error) {
		console.error("Error deleting from workspace:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

export {
	createWorkspace,
	fetchWorkspace,
	updateWorkspace,
	deleteFromWorkspace,
	addToWorkspace,
};
