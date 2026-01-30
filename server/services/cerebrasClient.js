import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Cerebras client using OpenAI SDK
const cerebras = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: 'https://api.cerebras.ai/v1'
});

/**
 * Generate a chat completion using Cerebras API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Boolean} stream - Whether to stream the response
 * @returns {Promise} - Chat completion response
 */
export async function generateChatCompletion(messages, stream = false) {
    try {
        const response = await cerebras.chat.completions.create({
            model: 'llama-3.3-70b',
            messages,
            stream,
            temperature: 0.7,
            max_tokens: 1024
        });

        return response;
    } catch (error) {
        console.error('Cerebras API Error:', error);
        throw new Error(`Failed to generate response: ${error.message}`);
    }
}

/**
 * Generate a streaming chat completion
 * @param {Array} messages - Array of message objects
 * @returns {AsyncIterable} - Streaming response
 */
export async function generateStreamingCompletion(messages) {
    try {
        const stream = await cerebras.chat.completions.create({
            model: 'llama-3.3-70b',
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1024
        });

        return stream;
    } catch (error) {
        console.error('Cerebras Streaming Error:', error);
        throw new Error(`Failed to generate streaming response: ${error.message}`);
    }
}

export default cerebras;
