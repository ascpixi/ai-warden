import Groq from "groq-sdk";
import { ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions.mjs";

import { createChatHistory, LlmMessage, LlmProvider } from "./llm";
import { last, removeEmojis, sleep } from "../util";

const GROQ_CLIENT = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/**
 * Provides an LLM abstraction layer over Groq.
 */
export class GroqLlmProvider implements LlmProvider {
    constructor (
        private model: string
    ) {}

    async generateConversation(messages: LlmMessage[]): Promise<string | null> {
        const aiRequest = {
            model: this.model,
            messages: messages,
            temperature: 1,
            max_tokens: 1024,
            top_p: 1
        } satisfies ChatCompletionCreateParamsNonStreaming;

        if (last(messages).role != "user")
            throw new Error("The last message should always be a user message.");

        const history = createChatHistory(messages);
    
        let response: string | null = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            const resp = await GROQ_CLIENT.chat.completions.create(aiRequest);
            if (resp == null)
                return null;
                
            // Filter out messages that are equal to the last AI response.
            const choices = history.length == 0
                ? resp.choices
                : resp.choices.filter(x => x.message.content?.trim() != last(history).ai.trim());
    
                console.log(choices);

            // Find the first choice, first starting with choices that have content,
            // then resorting to the first choice that has a refusal.
            const choice = choices.find(x => x.message.content != null) ?? (choices.length == 0 ? undefined : choices[0]);
            if (choice == undefined) {
                console.warn(`warn: Request to Groq failed - trying again (attempt #${attempt})...`, choices, resp.choices);
                continue;
            }
    
            response = choice.message.content;
            if (response == null) {
                console.error("error: message.content is null!", resp);
                return null;
            }
    
            response = removeEmojis(response);

            const trimmedLen = response.trim().length;
            if (trimmedLen < 6) {
                console.warn(`warn: Groq w/ model ${this.model} returned a trimmed response of ${trimmedLen} charcters - trying again (attempt #${attempt})`);
                console.warn("warn: Response:", resp);
                console.warn("warn: Choices:", resp.choices.map(x => x.message));
                await sleep(100 + (attempt * 200));
                continue;
            }

            break;
        }

        return response;
    }

}