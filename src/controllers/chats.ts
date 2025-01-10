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
}