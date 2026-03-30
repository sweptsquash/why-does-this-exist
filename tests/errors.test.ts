import { describe, expect, it } from 'bun:test';
import {
  WdeError,
  GitError,
  GitHubError,
  AIError,
  ConfigError,
} from '../src/errors';

describe('WdeError', () => {
  it('should create an error with correct message', () => {
    const error = new WdeError('Test error message');
    expect(error.message).toBe('Test error message');
  });

  it('should have correct name', () => {
    const error = new WdeError('Test');
    expect(error.name).toBe('WdeError');
  });

  it('should be instance of Error', () => {
    const error = new WdeError('Test');
    expect(error instanceof Error).toBe(true);
  });

  it('should be instance of WdeError', () => {
    const error = new WdeError('Test');
    expect(error instanceof WdeError).toBe(true);
  });
});

describe('GitError', () => {
  it('should create an error with correct message', () => {
    const error = new GitError('Git operation failed');
    expect(error.message).toBe('Git operation failed');
  });

  it('should have correct name', () => {
    const error = new GitError('Test');
    expect(error.name).toBe('GitError');
  });

  it('should be instance of WdeError', () => {
    const error = new GitError('Test');
    expect(error instanceof WdeError).toBe(true);
  });

  it('should be instance of GitError', () => {
    const error = new GitError('Test');
    expect(error instanceof GitError).toBe(true);
  });
});

describe('GitHubError', () => {
  it('should create an error with message only', () => {
    const error = new GitHubError('GitHub API failed');
    expect(error.message).toBe('GitHub API failed');
    expect(error.statusCode).toBeUndefined();
  });

  it('should create an error with status code', () => {
    const error = new GitHubError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
  });

  it('should create an error with rate limit info', () => {
    const resetDate = new Date('2024-01-15T12:00:00Z');
    const error = new GitHubError('Rate limited', 403, 0, resetDate);
    expect(error.statusCode).toBe(403);
    expect(error.rateLimitRemaining).toBe(0);
    expect(error.rateLimitReset).toEqual(resetDate);
  });

  it('should have correct name', () => {
    const error = new GitHubError('Test');
    expect(error.name).toBe('GitHubError');
  });

  it('should be instance of WdeError', () => {
    const error = new GitHubError('Test');
    expect(error instanceof WdeError).toBe(true);
  });
});

describe('AIError', () => {
  it('should create an error with correct message', () => {
    const error = new AIError('AI API failed');
    expect(error.message).toBe('AI API failed');
  });

  it('should have correct name', () => {
    const error = new AIError('Test');
    expect(error.name).toBe('AIError');
  });

  it('should be instance of WdeError', () => {
    const error = new AIError('Test');
    expect(error instanceof WdeError).toBe(true);
  });
});

describe('ConfigError', () => {
  it('should create an error with correct message', () => {
    const error = new ConfigError('Missing API key');
    expect(error.message).toBe('Missing API key');
  });

  it('should have correct name', () => {
    const error = new ConfigError('Test');
    expect(error.name).toBe('ConfigError');
  });

  it('should be instance of WdeError', () => {
    const error = new ConfigError('Test');
    expect(error instanceof WdeError).toBe(true);
  });
});
