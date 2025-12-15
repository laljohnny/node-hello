// AI Provider Factory
// Supports OpenAI, Anthropic, Gemini, and Local LLMs

const axios = require('axios');

class AIProviderFactory {
    static createProvider(config) {
        switch (config.provider) {
            case 'openai':
                return new OpenAIProvider(config);
            case 'anthropic':
                return new AnthropicProvider(config);
            case 'gemini':
                return new GeminiProvider(config);
            case 'local':
                return new LocalLLMProvider(config);
            default:
                throw new Error(`Unsupported AI provider: ${config.provider}`);
        }
    }
}

class OpenAIProvider {
    constructor(config) {
        this.apiKey = config.api_key;
        this.model = config.model || 'gpt-4';
        this.baseURL = 'https://api.openai.com/v1';
    }

    async generate(prompt) {
        const response = await axios.post(
            `${this.baseURL}/chat/completions`,
            {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            content: response.data.choices[0].message.content,
            tokensUsed: response.data.usage.total_tokens,
            model: this.model,
            provider: 'openai'
        };
    }
}

class AnthropicProvider {
    constructor(config) {
        this.apiKey = config.api_key;
        this.model = config.model || 'claude-3-5-sonnet-20241022';
        this.baseURL = 'https://api.anthropic.com/v1';
    }

    async generate(prompt) {
        const response = await axios.post(
            `${this.baseURL}/messages`,
            {
                model: this.model,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            content: response.data.content[0].text,
            tokensUsed: response.data.usage.input_tokens + response.data.usage.output_tokens,
            model: this.model,
            provider: 'anthropic'
        };
    }
}

class GeminiProvider {
    constructor(config) {
        this.apiKey = config.api_key;
        this.model = config.model || 'gemini-pro';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    }

    async generate(prompt) {
        const response = await axios.post(
            `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        return {
            content: response.data.candidates[0].content.parts[0].text,
            tokensUsed: response.data.usageMetadata?.totalTokenCount || 0,
            model: this.model,
            provider: 'gemini'
        };
    }
}

class LocalLLMProvider {
    constructor(config) {
        this.baseURL = config.base_url || 'http://localhost:11434';
        this.model = config.model || 'llama3';
    }

    async generate(prompt) {
        // Ollama API format
        const response = await axios.post(
            `${this.baseURL}/api/generate`,
            {
                model: this.model,
                prompt: prompt,
                stream: false
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        return {
            content: response.data.response,
            tokensUsed: 0, // Ollama doesn't always return token count
            model: this.model,
            provider: 'local'
        };
    }
}

module.exports = AIProviderFactory;
