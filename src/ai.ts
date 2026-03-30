import Anthropic from '@anthropic-ai/sdk';
import { AIError, ConfigError } from './errors';
import { anthropic } from './configs';

let client: Anthropic | null = null;

/**
 * Get or create the Anthropic client
 */
function getClient(): Anthropic {
  if (!client) {
    const cfg = anthropic();
    if (!cfg.apiKey) {
      throw new ConfigError(
        'ANTHROPIC_API_KEY environment variable is required.\n' +
        'Get your API key from https://console.anthropic.com/settings/keys'
      );
    }
    client = new Anthropic({ apiKey: cfg.apiKey });
  }
  return client;
}

/**
 * Stream explanation from Claude
 * Uses streaming to provide real-time feedback
 */
export async function streamExplanation(
  systemPrompt: string,
  context: string,
  model: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const anthropic = getClient();

  try {
    let fullResponse = '';

    const stream = anthropic.messages.stream({
      model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Based on the following context, explain why this code exists:\n\n${context}`,
        },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullResponse += text;
        onChunk(text);
      }
    }

    return fullResponse;
  } catch (error) {
    if (error instanceof ConfigError) throw error;

    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('authentication') || message.includes('api_key')) {
      throw new ConfigError('Invalid ANTHROPIC_API_KEY. Check your API key at https://console.anthropic.com/settings/keys');
    }

    if (message.includes('rate_limit') || message.includes('429')) {
      throw new AIError('Claude API rate limit exceeded. Please try again in a moment.');
    }

    if (message.includes('overloaded') || message.includes('503')) {
      throw new AIError('Claude API is currently overloaded. Please try again in a moment.');
    }

    throw new AIError(`Claude API error: ${message}`);
  }
}

/**
 * Get explanation from Claude (non-streaming, for JSON output mode)
 */
export async function getExplanation(
  systemPrompt: string,
  context: string,
  model: string
): Promise<string> {
  const anthropic = getClient();

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Based on the following context, explain why this code exists:\n\n${context}`,
        },
      ],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new AIError('Unexpected response format from Claude API');
    }

    return textBlock.text;
  } catch (error) {
    if (error instanceof ConfigError || error instanceof AIError) throw error;

    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('authentication') || message.includes('api_key')) {
      throw new ConfigError('Invalid ANTHROPIC_API_KEY. Check your API key at https://console.anthropic.com/settings/keys');
    }

    if (message.includes('rate_limit') || message.includes('429')) {
      throw new AIError('Claude API rate limit exceeded. Please try again in a moment.');
    }

    if (message.includes('overloaded') || message.includes('503')) {
      throw new AIError('Claude API is currently overloaded. Please try again in a moment.');
    }

    throw new AIError(`Claude API error: ${message}`);
  }
}
