/**
 * Anthropic API Configuration
 * Similar to Laravel's config/services.php pattern
 */

export interface AnthropicConfig {
  apiKey: string | null;
  defaultModel: string;
  maxTokens: number;
}

/**
 * Load Anthropic configuration from environment
 */
export function loadAnthropicConfig(): AnthropicConfig {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY ?? null,
    defaultModel: process.env.WDE_DEFAULT_MODEL ?? 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.WDE_MAX_RESPONSE_TOKENS ?? '500', 10),
  };
}
