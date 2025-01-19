import { Request, Response } from "express";
import { join } from "path";
import fs from "fs/promises";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { File, IFile, IWorkspace } from "../models/Workspace";
import { embeddings, llm } from "./langchainRAG/langchainRAG";
const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const VECTOR_STORE_DIR = "./vector_stores";

async function parseDocx(filePath: string) {
	const result = await mammoth.extractRawText({ path: filePath });
	return result.value;
}
async function parsePdf(filePath: string) {
	const dataBuffer = fs.readFile(filePath);
	const data = await pdfParse(dataBuffer);
	return data.text;
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

export const getalltext = async (req: Request, res: Response) => {
	
}

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
