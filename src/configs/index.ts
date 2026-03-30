/**
 * Central configuration module
 * Aggregates all config files similar to Laravel's config system
 *
 * Usage:
 *   import { config, github, anthropic, app } from './configs';
 *
 *   // Access via unified config
 *   config().github.apiBase
 *
 *   // Or import specific config
 *   github().apiBase
 */

import { type GitHubConfig, loadGitHubConfig } from './github';
import { type AnthropicConfig, loadAnthropicConfig } from './anthropic';
import { type AppConfig, loadAppConfig } from './app';

export type { GitHubConfig } from './github';
export type { AnthropicConfig } from './anthropic';
export type { AppConfig } from './app';

export interface Config {
  github: GitHubConfig;
  anthropic: AnthropicConfig;
  app: AppConfig;
}

// Cached config instances
let configInstance: Config | null = null;
let githubInstance: GitHubConfig | null = null;
let anthropicInstance: AnthropicConfig | null = null;
let appInstance: AppConfig | null = null;

/**
 * Get the full configuration object
 */
export function config(): Config {
  if (!configInstance) {
    configInstance = {
      github: github(),
      anthropic: anthropic(),
      app: app(),
    };
  }
  return configInstance;
}

/**
 * Get GitHub configuration
 */
export function github(): GitHubConfig {
  if (!githubInstance) {
    githubInstance = loadGitHubConfig();
  }
  return githubInstance;
}

/**
 * Get Anthropic configuration
 */
export function anthropic(): AnthropicConfig {
  if (!anthropicInstance) {
    anthropicInstance = loadAnthropicConfig();
  }
  return anthropicInstance;
}

/**
 * Get app configuration
 */
export function app(): AppConfig {
  if (!appInstance) {
    appInstance = loadAppConfig();
  }
  return appInstance;
}

/**
 * Reload all configuration (useful for testing)
 */
export function reloadConfig(): Config {
  githubInstance = null;
  anthropicInstance = null;
  appInstance = null;
  configInstance = null;
  return config();
}

/**
 * Check if GitHub token is configured
 */
export function hasGitHubToken(): boolean {
  return !!github().token;
}

/**
 * Check if Anthropic API key is configured
 */
export function hasAnthropicKey(): boolean {
  return !!anthropic().apiKey;
}
