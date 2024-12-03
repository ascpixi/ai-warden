/**
 * The maximum amount of messages the player can send before losing the game.
 */
export const MAX_MESSAGES_COUNT = 10;

/**
 * The maximum size of the history array. This is always equal to `MAX_MESSAGES_COUNT - 1`,
 * as the user can send one last message when the history buffer is full.
 */
export const MAX_HISTORY_LENGTH = MAX_MESSAGES_COUNT - 1;

/**
 * The maximum amount of characters a single user message can have.
 */
export const MAX_USER_MESSAGE_LENGTH = 1024;

/**
 * The maximum length of the secret phrase.
 */
export const MAX_SECRET_PHRASE_LENGTH = 48;