import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import {
  config,
  github,
  anthropic,
  app,
  reloadConfig,
  hasGitHubToken,
  hasAnthropicKey,
} from '../src/configs';

describe('Config Module', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset config before each test
    reloadConfig();
  });

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
    reloadConfig();
  });

  describe('github config', () => {
    it('should return default API base when not set', () => {
      delete process.env.GITHUB_API_BASE;
      reloadConfig();
      expect(github().apiBase).toBe('https://api.github.com');
    });

    it('should return custom API base when set', () => {
      process.env.GITHUB_API_BASE = 'https://github.mycompany.com/api/v3';
      reloadConfig();
      expect(github().apiBase).toBe('https://github.mycompany.com/api/v3');
    });

    it('should return null token when not set', () => {
      delete process.env.GITHUB_TOKEN;
      reloadConfig();
      expect(github().token).toBeNull();
    });

    it('should return token when set', () => {
      process.env.GITHUB_TOKEN = 'ghp_test123';
      reloadConfig();
      expect(github().token).toBe('ghp_test123');
    });

    it('should return default user agent', () => {
      delete process.env.WDE_USER_AGENT;
      reloadConfig();
      expect(github().userAgent).toBe('wde-cli');
    });

    it('should return default per page value', () => {
      delete process.env.WDE_GITHUB_PER_PAGE;
      reloadConfig();
      expect(github().perPage).toBe(100);
    });

    it('should return custom per page value', () => {
      process.env.WDE_GITHUB_PER_PAGE = '50';
      reloadConfig();
      expect(github().perPage).toBe(50);
    });

    it('should return default max review comments', () => {
      delete process.env.WDE_MAX_REVIEW_COMMENTS;
      reloadConfig();
      expect(github().maxReviewComments).toBe(10);
    });

    it('should return default max PR comments', () => {
      delete process.env.WDE_MAX_PR_COMMENTS;
      reloadConfig();
      expect(github().maxPRComments).toBe(10);
    });

    it('should return default max issue comments', () => {
      delete process.env.WDE_MAX_ISSUE_COMMENTS;
      reloadConfig();
      expect(github().maxIssueComments).toBe(5);
    });

    it('should return default batch size', () => {
      delete process.env.WDE_GITHUB_BATCH_SIZE;
      reloadConfig();
      expect(github().batchSize).toBe(5);
    });
  });

  describe('anthropic config', () => {
    it('should return null API key when not set', () => {
      delete process.env.ANTHROPIC_API_KEY;
      reloadConfig();
      expect(anthropic().apiKey).toBeNull();
    });

    it('should return API key when set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      reloadConfig();
      expect(anthropic().apiKey).toBe('sk-ant-test123');
    });

    it('should return default model', () => {
      delete process.env.WDE_DEFAULT_MODEL;
      reloadConfig();
      expect(anthropic().defaultModel).toBe('claude-sonnet-4-20250514');
    });

    it('should return custom model when set', () => {
      process.env.WDE_DEFAULT_MODEL = 'claude-3-haiku-20240307';
      reloadConfig();
      expect(anthropic().defaultModel).toBe('claude-3-haiku-20240307');
    });

    it('should return default max tokens', () => {
      delete process.env.WDE_MAX_RESPONSE_TOKENS;
      reloadConfig();
      expect(anthropic().maxTokens).toBe(500);
    });
  });

  describe('app config', () => {
    it('should return app name', () => {
      expect(app().name).toBe('wde');
    });

    it('should return verbose as false by default', () => {
      delete process.env.WDE_VERBOSE;
      reloadConfig();
      expect(app().verbose).toBe(false);
    });

    it('should return verbose as true when set', () => {
      process.env.WDE_VERBOSE = 'true';
      reloadConfig();
      expect(app().verbose).toBe(true);
    });

    it('should return default max token budget', () => {
      delete process.env.WDE_MAX_TOKENS;
      reloadConfig();
      expect(app().maxTokenBudget).toBe(8000);
    });

    it('should return custom max token budget', () => {
      process.env.WDE_MAX_TOKENS = '16000';
      reloadConfig();
      expect(app().maxTokenBudget).toBe(16000);
    });

    it('should return default chars per token', () => {
      delete process.env.WDE_CHARS_PER_TOKEN;
      reloadConfig();
      expect(app().charsPerToken).toBe(4);
    });

    it('should return default max diff lines', () => {
      delete process.env.WDE_MAX_DIFF_LINES;
      reloadConfig();
      expect(app().maxDiffLines).toBe(150);
    });

    it('should return default max linked issues', () => {
      delete process.env.WDE_MAX_LINKED_ISSUES;
      reloadConfig();
      expect(app().maxLinkedIssues).toBe(3);
    });
  });

  describe('unified config', () => {
    it('should return all configs in one object', () => {
      const cfg = config();
      expect(cfg.github).toBeDefined();
      expect(cfg.anthropic).toBeDefined();
      expect(cfg.app).toBeDefined();
    });

    it('should cache config between calls', () => {
      const cfg1 = config();
      const cfg2 = config();
      expect(cfg1).toBe(cfg2);
    });
  });

  describe('helper functions', () => {
    it('hasGitHubToken should return false when token not set', () => {
      delete process.env.GITHUB_TOKEN;
      reloadConfig();
      expect(hasGitHubToken()).toBe(false);
    });

    it('hasGitHubToken should return true when token set', () => {
      process.env.GITHUB_TOKEN = 'ghp_test';
      reloadConfig();
      expect(hasGitHubToken()).toBe(true);
    });

    it('hasAnthropicKey should return false when key not set', () => {
      delete process.env.ANTHROPIC_API_KEY;
      reloadConfig();
      expect(hasAnthropicKey()).toBe(false);
    });

    it('hasAnthropicKey should return true when key set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      reloadConfig();
      expect(hasAnthropicKey()).toBe(true);
    });
  });

  describe('reloadConfig', () => {
    it('should reload config with new values', () => {
      process.env.GITHUB_TOKEN = 'old-token';
      reloadConfig();
      expect(github().token).toBe('old-token');

      process.env.GITHUB_TOKEN = 'new-token';
      reloadConfig();
      expect(github().token).toBe('new-token');
    });
  });
});
