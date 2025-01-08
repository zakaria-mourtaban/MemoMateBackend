import mongoose, { Schema, Document, Model } from "mongoose";

// Define interfaces
export interface IWorkspace extends Document {
	_id: string;
	ownerId: string;
	name: string;
	workspace: IFile[] | null;
}

export interface IFile extends Document {
	_id: string;
	ownerId: string;
	name: string;
	file: string;
	children?: IFile[];
}

// Define Schema for WorkspaceObject
export const workspaceSchema = new Schema<IWorkspace>(
	{
		ownerId: { type: String, required: true },
		name: { type: String, required: true },
		workspace: [
			{
				type: Schema.Types.ObjectId,
				ref: "Workspace",
			},
		],
	},
	{ timestamps: true }
);

// Define Schema for Workspace
const fileSchema = new Schema<IFile>(
	{
		file: { type: String, required: true },
		ownerId: { type: String, required: true },
		name: { type: String, required: true },
		children: [
			{
				type: Schema.Types.ObjectId,
				ref: "Workspace",
			},
		],
	},
	{ timestamps: true }
);

// Create models
export const Workspace: Model<IWorkspace> = mongoose.model<IWorkspace>(
	"Workspaces",
	workspaceSchema
);

export const File: Model<IFile> = mongoose.model<IFile>("Files", fileSchema);
