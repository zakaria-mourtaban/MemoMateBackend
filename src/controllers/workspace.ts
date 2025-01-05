import { Request, Response } from "express";
import {
	IWorkspaceObject,
	Workspace,
	WorkspaceObject,
} from "../models/Workspace";

const createWorkspace = async (req: Request, res: Response): Promise<any> => {
	try {
		const { name } = req.body;
		const user = req.user;

		if (!user) {
			return res.status(401).json({
				message: "Unauthorized. User not found.",
				user: req.user,
			});
		}

		if (!name) {
			return res
				.status(400)
				.json({ message: "Workspace name is required." });
		}

		// Step 1: Create a new Workspace
		const newWorkspace = await Workspace.create({ name });

		// Step 2: Create a new WorkspaceObject linked to the new Workspace
		const newWorkspaceObject = await WorkspaceObject.create({
			name,
			workspace: newWorkspace._id, // Link the newly created workspace
		});

		// Respond with success
		return res.status(201).json({
			message: "WorkspaceObject and Workspace created successfully.",
			workspaceObject: {
				...newWorkspaceObject.toObject(),
				workspace: newWorkspace,
			},
		});
	} catch (error) {
		console.error("Error creating WorkspaceObject and Workspace:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

const fetchWorkspace = (req: Request, res: Response) => {
	const { name, email, password } = req.body;
};

const updateWorkspace = (req: Request, res: Response) => {
	const { name, email, password } = req.body;
};

const destroyWorkspace = (req: Request, res: Response) => {
	const { name, email, password } = req.body;
};

export { createWorkspace, fetchWorkspace, updateWorkspace, destroyWorkspace };
