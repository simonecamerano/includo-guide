/**
 * AI UTILITIES - Bridge
 * Single entry point for the two AI capabilities of this application:
 * vector embeddings, computed locally, and text generation, served by Anthropic.
 *
 * The split matters for privacy: the questions people ask this guide can reveal a
 * disability, their own or a family member's. The retrieval side never leaves this
 * server; only the generation side reaches a provider, and that provider is under
 * a data processing agreement.
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { embedText } from './embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

/** Generation model. Same tier and same model as the other portfolio applications. */
export const CHAT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

/** The Anthropic API requires an explicit output ceiling on every request. */
const MAX_OUTPUT_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS || 3000);

/**
 * Lazily built client. Built on first use rather than on import, so the server can
 * boot and serve retrieval even with no generation key configured.
 */
let _anthropic = null;
const getAnthropicClient = () => {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 60000,
    });
  }
  return _anthropic;
};

/**
 * GENERATE EMBEDDING
 * Converts a string into a 384-dimensional vector using the local model.
 * No API key and no network call are involved: the text stays on this server.
 * @param {string} text - The input text to vectorize.
 * @param {'query'|'passage'} [kind='query'] - Search query or indexed document.
 * @returns {Promise<Array<number>>} The resulting vector embedding.
 */
export const generateEmbedding = async (text, kind = 'query') => embedText(text, kind);

/**
 * GET CHAT RESPONSE
 * Sends a conversation to the Messages API and returns the assembled message.
 *
 * Differences from the Chat Completions shape this used to speak: the system prompt
 * is a top-level parameter instead of the first message, tools carry their schema
 * directly under input_schema without a function wrapper, and the reply arrives as
 * an array of content blocks rather than a single message object.
 *
 * @param {Object} params
 * @param {Array<Object>} params.messages - Conversation turns (user/assistant only).
 * @param {string|Array<Object>} [params.system] - System prompt.
 * @param {Array<Object>|null} [params.tools=null] - Tool definitions.
 * @param {string} [params.model=CHAT_MODEL] - Model override.
 * @returns {Promise<Object>} The Anthropic message.
 */
export const getChatResponse = async ({ messages, system, tools = null, model = CHAT_MODEL }) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured.");
  }

  const request = {
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages,
  };

  if (system) request.system = system;
  if (tools) request.tools = tools;

  return await getAnthropicClient().messages.create(request);
};

/**
 * DESCRIBE FAILURE
 * Turns an SDK error into a message the visitor can read. The typed exceptions are
 * matched instead of the error text, which changes between SDK versions.
 * @param {unknown} error - The caught error.
 * @returns {{category: string, message: string}}
 */
export const describeFailure = (error) => {
  if (error instanceof Anthropic.RateLimitError) {
    return { category: 'rate_limit', message: "Troppe richieste in questo momento. Riprova tra poco." };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return { category: 'auth', message: "Il servizio di orientamento non è configurato correttamente." };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return { category: 'network', message: "Collegamento al servizio interrotto. Riprova tra poco." };
  }
  return { category: 'general', message: "Errore nell'elaborazione della risposta." };
};

/**
 * EXTRACT TEXT
 * Joins the text blocks of a message, ignoring tool-use blocks.
 * @param {Object} message - An Anthropic message.
 * @returns {string} The readable text.
 */
export const extractText = (message) => {
  if (!message || !Array.isArray(message.content)) return '';
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
};

/**
 * EXTRACT TOOL USES
 * Returns the tool-use blocks of a message.
 * @param {Object} message - An Anthropic message.
 * @returns {Array<Object>} The tool-use blocks.
 */
export const extractToolUses = (message) => {
  if (!message || !Array.isArray(message.content)) return [];
  return message.content.filter((block) => block.type === 'tool_use');
};
