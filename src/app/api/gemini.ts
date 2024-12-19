import { GoogleGenerativeAI } from "@google/generative-ai";
import { LlmMessage, LlmProvider } from "./llm";

const GEMINI_CLIENT = new GoogleGenerativeAI(process.env.GOOGLE_AI_TOKEN!);

/**
 * Provides an LLM abstraction layer over Google's Gemini model.
 */
export class GeminiLlmProvider implements LlmProvider {
    constructor (
        private model: string
    ) {}

    async generateConversation(messages: LlmMessage[]): Promise<string | null> {
        const systemMessage = messages.find(x => x.role == "system");
        messages = messages.filter(x => x.role != "system");
        
        const model = GEMINI_CLIENT.getGenerativeModel({
            model: this.model,
            systemInstruction: {
                parts: [{
                    text: systemMessage!.content
                }],
                role: "model"
            }
        });

        const results = await model.generateContent({
            contents: messages.map(x => ({
                parts: [{ text: x.content }],
                role: x.role == "user" ? "user" : "model"
            }))
        });

        return results.response.text();
    }
}