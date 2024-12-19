import { last } from "../util";
import { createChatHistory, LlmMessage, LlmProvider } from "./llm";

const LLM_API_URL = "https://jamsapi.hackclub.dev/openai/chat/completions";

/**
 * Provides an LLM abstraction layer for OpenAI's GPT model.
 */
export class GptLlmProvider implements LlmProvider {
    constructor (
        private model: string
    ) {}

    private async makeLlmRequest(aiRequest: CompletionRequest) {
        const resp = await fetch(LLM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.HACKCLUB_OPENAI_TOKEN}`
            },
            body: JSON.stringify(aiRequest)
        });
    
        if (!resp.ok) {
            console.error(`error: A request to the LLM API has failed with HTTP ${resp.status}.`);
            console.error("error: Request:", aiRequest);
            console.error("error: Response:", resp);
    
            try {
                console.error("error: JSON response:", await resp.json());
            } catch {
                console.error("error: Invalid/no JSON response.");
            }
    
            return null;
        }
    
        const data: CompletionResponse = await resp.json();
        if (data.choices.length == 0) {
            console.error("error: A request to the LLM API succeeded, but there are no completions!", data);
            return null;
        }

        return data;
    }

    async generateConversation(messages: LlmMessage[]): Promise<string | null> {
        const aiRequest = {
            model: this.model,
            messages: messages
        } satisfies CompletionRequest;

        if (last(messages).role != "user")
            throw new Error("The last message should always be a user message.");

        const history = createChatHistory(messages);
    
        let response: string | null = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            const resp = await this.makeLlmRequest(aiRequest);
            if (resp == null)
                return null;
                
            // Filter out messages that are equal to the last AI response.
            const choices = history.length == 0 ? resp.choices : resp.choices.filter(x =>
                x.message.content?.trim() != last(history).ai.trim() &&
                x.message.refusal?.trim() != last(history).ai.trim()
            );
    
            // Find the first choice, first starting with choices that have content,
            // then resorting to the first choice that has a refusal.
            const choice = choices.find(x => x.message.content != null) ?? (choices.length == 0 ? undefined : choices[0]);
            if (choice == undefined) {
                console.warn(`warn: Request to OpenAI failed - trying again (attempt #${attempt})...`, choices, resp.choices);
                continue;
            }
    
            response = choice.message.content ?? choice.message.refusal;
            if (response == null) {
                console.error("error: Both message.content and message.refusal are null!", resp);
                return null;
            }
    
            // Remove all emojis from the response (https://stackoverflow.com/a/69661174/13153269)
            response = response
                .replace(/[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu, '')
                .trim();
    
            break;
        }

        return response;
    }
}

export interface UserMessage {
    content: string | unknown[];
    role: "user";
    name?: string;
}

export interface SystemMessage {
    content: string | unknown[];
    role: "system";
    name?: string;
}

export interface AssistantMessage {
    content: string | unknown[];
    refusal?: string | null;
    role: "assistant";
    name?: string;
    audio?: unknown | null;
    tool_calls?: unknown[];
    function_call?: unknown | null;
}

export interface ToolMessage {
    role: "tool";
    content: string | unknown[];
    tool_call_id: string;
}

export interface FunctionMessage {
    role: "function";
    content: string | null;
    name: string;
}

/**
 * Represents the allowed JSON schema for a request to `/chat/completions`.
 */
export interface CompletionRequest {
    /** A list of messages comprising the conversation so far. Depending on the model you use, different message types (modalities) are supported, like text, images, and audio. */
    messages: (
        UserMessage |
        SystemMessage |
        AssistantMessage |
        ToolMessage |
        FunctionMessage
    )[];

    /** ID of the model to use. */
    model: string;

    /** Whether or not to store the output of this chat completion request for use in our model distillation or evals products. */
    store?: boolean | null;

    /** Developer-defined tags and values used for filtering completions in the dashboard. */
    metadata?: unknown | null;

    /**
     * Number between -2.0 and 2.0. Positive values penalize new tokens based on
     * their existing frequency in the text so far, decreasing the model's
     * likelihood to repeat the same line verbatim.
     */
    frequency_penalty?: number | null;

    /** Modify the likelihood of specified tokens appearing in the completion. */
    logit_bias?: unknown;

    /**
     * Whether to return log probabilities of the output tokens or not. If `true`,
     * returns the log probabilities of each output token returned in the content
     * of message.
     */
    logprobs?: boolean | null;

    /**
     * An integer between 0 and 20 specifying the number of most likely tokens to
     * return at each token position, each with an associated log probability.
     * `logprobs` must be set to true if this parameter is used.
     */
    top_logprobs?: number | null;

    /**
     * The maximum number of tokens that can be generated in the chat completion.
     * This value can be used to control costs for text generated via API.
     * 
     * This value is now deprecated in favor of `max_completion_tokens`, and is not
     * compatible with o1 series models.
     */
    max_tokens?: number | null;

    /**
     * An upper bound for the number of tokens that can be generated for a
     * completion, including visible output tokens and reasoning tokens.
     */
    max_completion_tokens?: number | null;

    /**
     * How many chat completion choices to generate for each input message.
     * Note that you will be charged based on the number of generated tokens
     * across all of the choices. Keep `n` as `1` to minimize costs.
     */
    n?: number | null;

    /** Output types that you would like the model to generate for this request. */
    modalities?: string[] | null;

    /**
     * Configuration for a Predicted Output, which can greatly improve response
     * times when large parts of the model response are known ahead of time. This
     * is most common when you are regenerating a file with only minor changes to
     * most of the content.
     */
    prediction?: unknown;

    /** Parameters for audio output. */
    audio?: unknown | null;

    /**
     * Number between -2.0 and 2.0. Positive values penalize new tokens based
     * on whether they appear in the text so far, increasing the model's
     * likelihood to talk about new topics.
     */
    presence_penalty?: number | null;

    /**
     * An object specifying the format that the model must output. Compatible
     * with GPT-4o, GPT-4o mini, GPT-4 Turbo and all GPT-3.5 Turbo models newer
     * than gpt-3.5-turbo-1106.
     */
    response_format?: unknown | null;

    /**
     * This feature is in Beta. If specified, our system will make a best effort
     * to sample deterministically, such that repeated requests with the same seed
     * and parameters should return the same result. Determinism is not guaranteed,
     * and you should refer to the system_fingerprint response parameter to monitor
     * changes in the backend.
     */
    seed?: number | null;

    /** Specifies the latency tier to use for processing the request. */
    service_tier?: string | null;

    /** Up to 4 sequences where the API will stop generating further tokens. */
    stop?: string | string[] | null;

    /** If set, partial message deltas will be sent, like in ChatGPT. Tokens will be sent as data-only server-sent events as they become available, with the stream terminated by a data: [DONE] message. */
    stream?: boolean | null;

    /** Options for streaming response. Only set this when you set `stream: true`. */
    stream_options?: { include_usage: boolean } | null;

    /**
     * What sampling temperature to use, between 0 and 2. Higher values like
     * 0.8 will make the output more random, while lower values like 0.2 will
     * make it more focused and deterministic.
     */
    temperature?: number | null;

    /**
     * An alternative to sampling with temperature, called nucleus sampling,
     * where the model considers the results of the tokens with `top_p` probability
     * mass. So 0.1 means only the tokens comprising the top 10% probability mass
     * are considered.
     */
    top_p?: number | null;

    /**
     * A list of tools the model may call. Currently, only functions are supported as a tool. Use this to provide a list of functions the model may generate JSON inputs for. A max of 128 functions are supported.
     */
    tools?: unknown[];

    /** Controls which (if any) tool is called by the model. */
    tool_choice?: unknown;

    /** Whether to enable parallel function calling during tool use. */
    parallel_tool_calls?: boolean;

    /** A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. */
    user?: string;

    /** Deprecated in favor of `tool_choice`. */
    function_call?: unknown;

    /** Deprecated in favor of `tools`. */
    functions?: unknown[];
}

/**
 * Represents the JSON schema of a successful response to a request to `/chat/completions`.
 */
export interface CompletionResponse {
    /** A unique identifier for the chat completion. */
    id: string;

    /** A list of chat completion choices. Can be more than one if `n` is greater than 1. */
    choices: {
        finish_reason: string;
        index: number;
        message: {
            content: string | null;
            refusal: string | null;
        };
        logprobs: unknown;
    }[];

    /** The Unix timestamp (in seconds) of when the chat completion was created. */
    created: number;

    /** The model used for the chat completion. */
    model: string;

    /** The service tier used for processing the request. This field is only included if the service_tier parameter is specified in the request. */
    service_tier: string | null;

    /** This fingerprint represents the backend configuration that the model runs with. */
    system_fingerprint: string;

    /** The object type, which is always chat.completion. */
    object: string;

    /** Usage statistics for the completion request. */
    usage: unknown;
}