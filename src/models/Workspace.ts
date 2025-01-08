import mongoose, { Schema, Document, Model } from "mongoose";

// Define interfaces
export interface IWorkspaceObject extends Document {
	_id: string;
	ownerId: string;
	name: string;
	workspace: IWorkspace | null;
}

export interface IWorkspace extends Document {
	_id: string;
	ownerId: string;
	name: string;
	file: string;
	children?: IWorkspace[];
}

// Define Schema for WorkspaceObject
export const workspaceObjectSchema = new Schema<IWorkspaceObject>(
	{
		ownerId: { type: String, required : true},
		name: { type: String, required: true },
		workspace: {
			type: Schema.Types.ObjectId,
			ref: "Workspace",
			default: null,
		},
	},
	{ timestamps: true }
);

// Define Schema for Workspace
const workspaceSchema = new Schema<IWorkspace>(
	{
		ownerId: { type: String, required : true},
		name: { type: String, required: true },
		children: [{ type: Schema.Types.ObjectId, ref: "Workspace" }],
	},
	{ timestamps: true }
);

// Create models
export const WorkspaceObject: Model<IWorkspaceObject> =
	mongoose.model<IWorkspaceObject>("WorkspaceObject", workspaceObjectSchema);

export const Workspace: Model<IWorkspace> = mongoose.model<IWorkspace>(
	"Workspace",
	workspaceSchema
);
