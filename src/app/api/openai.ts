export interface ChatCompletionResponse {
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