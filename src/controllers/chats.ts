import { Request, Response } from "express";
import { join } from "path";
import fs from "fs/promises";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { File, IFile, IWorkspace, Workspace } from "../models/Workspace";
import { embeddings, llm } from "./langchainRAG/langchainRAG";
import User from "../models/User";
import mongoose from "mongoose";
import { Chat } from "../models/Chat";
import { Annotation, StateGraph } from "@langchain/langgraph";
const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const VECTOR_STORE_DIR = "./vector_stores";

async function parseDocx(filePath: string) {
	const result = await mammoth.extractRawText({ path: filePath });
	return result.value;
}
async function parsePdf(filePath: string) {
	try {
		const dataBuffer = await fs.readFile(filePath);
		const data = await pdfParse(dataBuffer); // Pass the buffer directly
		return data.text;
	} catch (error) {
		console.error(`Error parsing PDF file ${filePath}:`, error);
		return ""; // Return an empty string if parsing fails
	}
}

async function parseExcalidraw(filePath: string) {
	const data = await fs.readFile(filePath, "utf8");
	const jsonData = JSON.parse(data);
	const textElements = jsonData.elements
		.filter((element: any) => element.type === "text")
		.map((element: any) => element.text);
	return textElements.join(" ");
}

async function processFile(filePath: string) {
	const ext = path.extname(filePath);

	try {
		if (ext === ".docx") {
			return await parseDocx(filePath);
		} else if (ext === ".pdf") {
			return await parsePdf(filePath);
		} else if (ext === ".excalidraw") {
			return await parseExcalidraw(filePath);
		}
	} catch (error) {
		console.error(`Error processing file ${filePath}:`, error);
		return "";
	}
}

async function processWorkspace(workspace: any): Promise<string> {
	let combinedText = "";

	// Recursive function to process nested children
	async function processChildren(children: any[]) {
		for (const child of children) {
			if (child.file) {
				const filePath = path.join(
					"../MemoMateBackend/src/uploads",
					child.file
				);
				const text = await processFile(filePath);
				combinedText += text + "\n";
			}

			// If the child has nested children, process them recursively
			if (child.children && child.children.length > 0) {
				await processChildren(child.children);
			}
		}
	}

	// Start processing from the root children
	await processChildren(workspace.children);

	return combinedText;
}

export const getalltext = async (
	req: Request,
	res: Response
): Promise<any> => {
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

		// Populate the `workspace` array with the referenced objects
		const workspace = await Workspace.findById(id).populate({
			path: "children",
			populate: {
				path: "children",
				model: "File",
			},
		});

		if (!workspace) {
			return res.status(404).json({ message: "Workspace not found." });
		}

		const combinedText = await processWorkspace(workspace);

		// Split the text into chunks
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});
		const docs = await splitter.createDocuments([combinedText]);

		// Create a vector store from the documents
		const vectorStore = await FaissStore.fromDocuments(docs, embeddings);

		// Save the vector store to a file
		const vectorStorePath = join("./vectorstores", `${id}.faiss`);
		await vectorStore.save(vectorStorePath);

		// Create a Chat document linked to this vector store
		const newChat = await Chat.create({
			name: `Chat for Workspace ${id}`,
			vectorStore: vectorStorePath, // Store the vector store file path
		});

		// Associate the chat with the user
		user.chats.push(newChat._id);
		await user.save();

		return res.status(200).json({
			message: "Workspace retrieved, vector store created, and chat linked successfully.",
			workspace: combinedText,
			chat: newChat,
		});
	} catch (error) {
		console.error("Error fetching workspace:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error });
	}
};

export const diagramPrompt = async (req: Request, res: Response) => {
	try {
		const prompt = req.body.prompt;
		if (!prompt)
			res.status(400).json({ message: "Missing required parameter" });
		const answer = await llm.invoke(
			"Everything after the prompt tag is the user prompt, generate mermaid syntax to generate the type of diagram requested by the user, do not reply to any message outside of creating these diagrams, DO NOT ADD FORMATTING, if you find that the diagram is not supported by mermaid syntax come up with a way to represent it. <prompt> " +
				prompt
		);
		res.status(200).json({ response: answer });
	} catch (error) {
		res.status(500).json({ message: "Internal server error", error });
	}
};

export const queryChatVectorStore = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?._id;
        const chatId = req.params.id;
        const { query } = req.body;

        // Input validation
        if (!userId) {
            return res
                .status(401)
                .json({ message: "Unauthorized. User not found." });
        }

        if (!chatId) {
            return res
                .status(400)
                .json({ message: "Chat ID is required." });
        }

        if (!query) {
            return res
                .status(400)
                .json({ message: "Query is required." });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if the user has access to the chat
        const hasAccess = user.chats.includes(chatId);
        if (!hasAccess) {
            return res
                .status(403)
                .json({ message: "Access denied to this chat." });
        }

        // Find the chat document
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found." });
        }

        // Load the vector store from the file path
        const vectorStore = await FaissStore.load(chat.vectorStore, embeddings);

        // Define the RAG workflow
        const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

        const InputStateAnnotation = Annotation.Root({
            question: Annotation<string>,
        });

        const StateAnnotation = Annotation.Root({
            question: Annotation<string>,
            context: Annotation<Document[]>,
            answer: Annotation<string>,
        });

        // Define application steps
        const retrieve = async (state: typeof InputStateAnnotation.State) => {
            const retrievedDocs = await vectorStore.similaritySearch(state.question, 5); // Retrieve top 5 documents
            return { context: retrievedDocs };
        };

        const generate = async (state: typeof StateAnnotation.State) => {
            const docsContent = state.context.map((doc :any) => doc.pageContent).join("\n");
            const messages = await promptTemplate.invoke({
                question: state.question,
                context: docsContent,
            });
            const response = await llm.invoke(messages);
            return { answer: response.content };
        };

        // Compile the RAG workflow
        const graph = new StateGraph(StateAnnotation)
            .addNode("retrieve", retrieve)
            .addNode("generate", generate)
            .addEdge("__start__", "retrieve")
            .addEdge("retrieve", "generate")
            .addEdge("generate", "__end__")
            .compile();

        // Invoke the RAG workflow with the user's query
        const inputs = { question: query };
        const result = await graph.invoke(inputs);

        return res.status(200).json({
            message: "Query executed successfully.",
            answer: result.answer,
        });
    } catch (error) {
        console.error("Error querying chat vector store:", error);
        return res
            .status(500)
            .json({ message: "Internal Server Error", error });
    }
};