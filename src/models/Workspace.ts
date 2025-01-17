import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

// Define interfaces
export interface IWorkspace extends Document {
	_id: ObjectId;
	ownerId: string;
	name: string;
	files: ObjectId[] | null;
}

export interface IFile extends Document {
	_id: ObjectId;
	ownerId: string;
	name: string;
	file: string;
	files?: IFile[];
}

// Define Schema for WorkspaceObject
export const workspaceSchema = new Schema<IWorkspace>(
	{
		ownerId: { type: String, required: true },
		name: { type: String, required: true },
		files: [
			{
				type: Schema.Types.ObjectId,
				ref: "Files",
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
		files: [
			{
				type: Schema.Types.ObjectId,
				ref: "Files",
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
