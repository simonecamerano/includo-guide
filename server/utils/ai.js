/**
 * AI UTILITIES - Bridge
 * Single entry point for the two AI capabilities of this application:
 * vector embeddings, computed locally, and chat completions, served by a provider.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { embedText } from './embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Lazily built OpenAI client. Built on first use rather than on import, so the
 * server can boot (and serve retrieval) without a generation key configured.
 */
let _openai = null;
const getOpenAI = () => {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
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
 * Sends a sequence of messages to the OpenAI Chat Completion API.
 * Supports tool calling and structured outputs.
 * @param {Array<Object>} messages - The conversation history.
 * @param {string} [model="gpt-4o"] - The model to use.
 * @param {Array<Object>|null} [tools=null] - Optional tool definitions.
 * @returns {Promise<Object>} The full API response from OpenAI.
 */
export const getChatResponse = async (messages, model = "gpt-4o", tools = null) => {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('...')) {
            throw new Error("OPENAI_API_KEY not configured.");
        }
        
        const options = {
            model: model,
            messages: messages.map(m => {
                const msg = { role: m.role, content: m.content || "" };
                // Ensure tool calls and IDs are passed back to the model if present
                if (m.tool_calls) msg.tool_calls = m.tool_calls;
                if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
                return msg;
            }),
            temperature: 0.7,
        };

        if (tools) options.tools = tools;

        return await getOpenAI().chat.completions.create(options);
    } catch (error) {
        console.error("OpenAI Bridge Error:", error.message);
        throw error;
    }
};
