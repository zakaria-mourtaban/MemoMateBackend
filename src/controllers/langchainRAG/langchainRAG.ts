import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";


const llm = new ChatOpenAI({
	model: "gpt-4o-mini",
	temperature: 0,
});

const embeddings = new OpenAIEmbeddings({
	model: "text-embedding-3-large",
});

const vectorStore = new FaissStore(embeddings, {});

export { vectorStore, embeddings, llm };
