import { last } from "../util";

/**
 * Represents an LLM (Large Language Model) provider. An object implementing
 * the `LlmProvider` interface only describes a single model of an LLM service.
 */
export interface LlmProvider {
    /**
     * Generates the assistant response for the given list of chat messages.
     * This method may return `null` if the request failed. More information about
     * the failure in the case of `null` is available in the console.
     */
    generateConversation(messages: LlmMessage[]): Promise<string | null>;
}

export interface ConversationPart {
    user: string;
    ai: string;
}

/**
 * From a linear, alternating history of LLM messages,
 * @param messages 
 * @returns 
 */
export function createChatHistory(messages: LlmMessage[]): ConversationPart[] {
    if (last(messages).role == "user") {
        messages.pop();
    }

    messages = messages.filter(msg => msg.role !== "system");
    if (messages.length == 0)
        return [];

    const isValid = messages.every((msg, i) => 
        i % 2 === 0 ? msg.role === "user" : msg.role === "assistant"
    );
    
    if (!isValid || messages.length % 2 !== 0)
        throw new Error("Messages must alternate between user and assistant");
    
    return Array.from({ length: messages.length / 2 }, (_, i) => ({
        user: messages[i * 2].content,
        ai: messages[i * 2 + 1].content
    }));
}

export type LlmMessage = UserMessage | SystemMessage | AssistantMessage;

export interface UserMessage {
    content: string;
    role: "user";
}

export interface SystemMessage {
    content: string;
    role: "system";
}

export interface AssistantMessage {
    content: string;
    role: "assistant";
}