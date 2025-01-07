import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const llm = new ChatOpenAI({
	model: "gpt-4o-mini",
	temperature: 0,
});

const embeddings = new OpenAIEmbeddings({
	model: "text-embedding-3-large",
});
