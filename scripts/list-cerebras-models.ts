import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const cerebras = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: 'https://api.cerebras.ai/v1',
});

async function listModels() {
    try {
        console.log('Querying Cerebras models...');
        const response = await fetch('https://api.cerebras.ai/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response:', text);
            return;
        }

        const data = await response.json();
        console.log('Available Models:');
        data.data.forEach((model: any) => {
            console.log(`- ${model.id}`);
        });
    } catch (err) {
        console.error('Failed to list models:', err);
    }
}

listModels();
