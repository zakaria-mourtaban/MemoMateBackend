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
	
	private static async loadOrCreateVectorStore(chatId: string, documents?: string[]) {
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
	
	private static async processFileContent(file: IFile): Promise<string[]> {
        // Read file content and split into chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const docs = await splitter.splitText(file.file);
        return docs;
	}
	
	static async initializeChat(req: Request, res: Response) {
        try {
            await this.ensureVectorStoreDir();
            const { chatId, fileIds } = req.body;

            // Fetch all files
            const files = await File.find({ _id: { $in: fileIds } });
            if (!files.length) {
                return res.status(404).json({ error: "No files found" });
            }

            // Process all files and combine their content
            const allDocuments: string[] = [];
            for (const file of files) {
                const documents = await this.processFileContent(file);
                allDocuments.push(...documents);
            }

            // Create and save vector store
            await this.loadOrCreateVectorStore(chatId, allDocuments);

            res.status(200).json({ message: "Chat initialized successfully" });
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
            const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

            // Generate response
            const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("\n");
            const messages = await promptTemplate.invoke({
                question,
                context: docsContent,
            });
            const response = await llm.invoke(messages);

            res.status(200).json({ 
                answer: response.content,
                sources: retrievedDocs.map(doc => ({
                    content: doc.pageContent.substring(0, 200) + "...", // Preview of content
                    metadata: doc.metadata
                }))
            });
        } catch (error) {
            console.error("Error processing query:", error);
            res.status(500).json({ error: "Failed to process query" });
        }
    }
}