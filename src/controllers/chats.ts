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
		res.status(500).json({ message: "Internal server error", error});
	}
};
