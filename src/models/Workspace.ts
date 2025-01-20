import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

// Define interfaces
export interface IWorkspace extends Document {
    _id: ObjectId;
    ownerId: string;
    name: string;
    children: ObjectId[] | null;
}

export interface IFile extends Document {
    _id: ObjectId;
    ownerId: string;
    name: string;
    file: string;
    children?: ObjectId[];
}

export const workspaceSchema = new Schema<IWorkspace>(
    {
        ownerId: { type: String, required: true },
        name: { type: String, required: true },
        children: [
            {
                type: Schema.Types.ObjectId,
                ref: "File",
                default: null,
            },
        ],
    },
    { timestamps: true }
);

// Define Schema for File
export const fileSchema = new Schema<IFile>(
    {
        file: { type: String, required: true },
        ownerId: { type: String, required: true },
        name: { type: String, required: true },
        children: [
            {
                type: Schema.Types.ObjectId,
                ref: "File",
                default: null,
            },
        ],
    },
    { timestamps: true }
);

// Create models
export const Workspace: Model<IWorkspace> = mongoose.model<IWorkspace>(
    "Workspace",
    workspaceSchema
);

export const File: Model<IFile> = mongoose.model<IFile>(
    "File",
    fileSchema
);
