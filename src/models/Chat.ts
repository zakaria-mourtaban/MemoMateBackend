import mongoose, { Schema, Document, Model } from "mongoose";

// Define interface
export interface IChat extends Document {
    _id: string;
    name: string;
    vectorStore: string;
}

// Define Schema for Chat
export const chatSchema = new Schema<IChat>(
    {
        name: { type: String, required: true },
        vectorStore: { type: String, required: true },  // stores file location
    },
    { timestamps: true }
);

// Create model
export const Chat: Model<IChat> = mongoose.model<IChat>("Chats", chatSchema);