/**
 * Central configuration module
 * Aggregates all config files similar to Laravel's config system
 *
 * Note: Credentials (API keys, tokens) are NOT stored here.
 * They are managed via system keychain in config-manager.ts
 *
 * Usage:
 *   import { config, github, app } from './configs';
 *
 *   // Access via unified config
 *   config().github.apiBase
 *
 *   // Or import specific config
 *   github().apiBase
 */

import { type GitHubConfig, loadGitHubConfig } from './github';
import { type AppConfig, loadAppConfig } from './app';

export type { GitHubConfig } from './github';
export type { AppConfig } from './app';

export interface Config {
  github: GitHubConfig;
  app: AppConfig;
}

// Cached config instances
let configInstance: Config | null = null;
let githubInstance: GitHubConfig | null = null;
let appInstance: AppConfig | null = null;

/**
 * Get the full configuration object
 */
export function config(): Config {
  if (!configInstance) {
    configInstance = {
      github: github(),
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
  appInstance = null;
  configInstance = null;
  return config();
}
