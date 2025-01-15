import { Request, Response } from "express";
import { join } from "path";
import fs from "fs/promises";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { File, IFile } from "../models/Workspace";
import { embeddings, llm } from "./langchainRAG/langchainRAG";

const VECTOR_STORE_DIR = "./vector_stores";

export class RAGController {
	private static async ensureVectorStoreDir() {
		try {
			await fs.mkdir(VECTOR_STORE_DIR, { recursive: true });
		} catch (error) {
			console.error("Error creating vector store directory:", error);
			throw error;
		}
	}

	private static getVectorStorePath(chatId: string) {
		return join(VECTOR_STORE_DIR, `${chatId}_store`);
	}

	private static async loadOrCreateVectorStore(
		chatId: string,
		documents?: string[]
	) {
		const storePath = this.getVectorStorePath(chatId);

		try {
			// Try to load existing store
			return await FaissStore.load(storePath, embeddings);
		} catch (error) {
			// If store doesn't exist and we have documents, create new one
			if (documents) {
				const vectorStore = await FaissStore.fromTexts(
					documents,
					{},
					embeddings
				);
				await vectorStore.save(storePath);
				return vectorStore;
			}
			throw new Error("Vector store not found and no documents provided");
		}
	}

	private static async processFileTree(
		fileId: string,
		processedIds = new Set<string>()
	): Promise<string[]> {
		// Avoid processing the same file twice
		if (processedIds.has(fileId)) {
			return [];
		}
		processedIds.add(fileId);

		// Fetch the file document
		const file = await File.findById(fileId);
		if (!file) {
			throw new Error(`File not found: ${fileId}`);
		}

		const documents: string[] = [];

		// Process current file's content
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});

		if (file.file) {
			const chunks = await splitter.splitText(file.file);
			documents.push(...chunks);
		}

		// Recursively process children if they exist
		if (file.children && file.children.length > 0) {
			for (const childId of file.children) {
				const childDocs = await this.processFileTree(
					childId.toString(),
					processedIds
				);
				documents.push(...childDocs);
			}
		}

		return documents;
	}

	static async initializeChat(req: Request, res: Response) {
		try {
			await this.ensureVectorStoreDir();
			const { chatId, rootFileId } = req.body;

			if (!rootFileId) {
				return res
					.status(400)
					.json({ error: "Root file ID is required" });
			}

			// Process the entire file tree starting from the root
			const processedIds = new Set<string>();
			const allDocuments = await this.processFileTree(
				rootFileId,
				processedIds
			);

			if (allDocuments.length === 0) {
				return res
					.status(404)
					.json({ error: "No content found in file tree" });
			}

			// Create and save vector store
			await this.loadOrCreateVectorStore(chatId, allDocuments);

			res.status(200).json({
				message: "Chat initialized successfully",
				processedFiles: Array.from(processedIds).length,
			});
		} catch (error) {
			console.error("Error initializing chat:", error);
			res.status(500).json({ error: "Failed to initialize chat" });
		}
	}
	static async query(req: Request, res: Response) {
		try {
			const { chatId, question } = req.body;

			// Load existing vector store
			const vectorStore = await this.loadOrCreateVectorStore(chatId);

			// Retrieve relevant documents
			const retrievedDocs = await vectorStore.similaritySearch(question);

			// Get RAG prompt
			const promptTemplate = await pull<ChatPromptTemplate>(
				"rlm/rag-prompt"
			);

			// Generate response
			const docsContent = retrievedDocs
				.map((doc) => doc.pageContent)
				.join("\n");
			const messages = await promptTemplate.invoke({
				question,
				context: docsContent,
			});
			const response = await llm.invoke(messages);

			res.status(200).json({
				answer: response.content,
				sources: retrievedDocs.map((doc) => ({
					content: doc.pageContent.substring(0, 200) + "...", // Preview of content
					metadata: doc.metadata,
				})),
			});
		} catch (error) {
			console.error("Error processing query:", error);
			res.status(500).json({ error: "Failed to process query" });
		}
	}
}

export const diagramPrompt = async (req: Request, res: Response) => {
	try {
		const prompt = req.body.prompt;
		if (!prompt)
			res.status(400).json({ message: "Missing required parameter" });
		const answer = await llm.invoke(
			"Everything after the prompt tag is the user prompt, generate mermaid syntax to generate the type of diagram requested by the user, do not reply to any message outside of creating these diagrams, if you find that the diagram is not supported by mermaid syntax come up with a way to represent it. <prompt> " +
				prompt
		);
		res.status(200).json({ response: answer });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
};
