import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";

const llm = new ChatOpenAI({
	model: "gpt-4o-mini",
	temperature: 0,
});

const embeddings = new OpenAIEmbeddings({
	model: "text-embedding-3-large",
});

const vectorStore = new Chroma(embeddings, {
	collectionName: "a-test-collection",
});

export { vectorStore, embeddings, llm };
