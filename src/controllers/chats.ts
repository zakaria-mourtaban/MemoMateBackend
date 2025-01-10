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
}