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

		const newWorkspaceObject = await WorkspaceObject.create({
			name,
		});

		return res.status(201).json({
			message: "WorkspaceObject and Workspace created successfully.",
			workspaceObject: newWorkspaceObject,
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
