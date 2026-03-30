import { describe, expect, it } from 'bun:test';
import {
  runAuthFlow,
  showAuthStatus,
  clearAuth,
} from '../src/commands/auth';

describe('commands/auth', () => {
  describe('exports', () => {
    it('should export runAuthFlow function', () => {
      expect(typeof runAuthFlow).toBe('function');
    });

    it('should export showAuthStatus function', () => {
      expect(typeof showAuthStatus).toBe('function');
    });

    it('should export clearAuth function', () => {
      expect(typeof clearAuth).toBe('function');
    });
  });

  describe('runAuthFlow', () => {
    it('should be an async function', () => {
      // Check it returns a promise
      expect(runAuthFlow.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('showAuthStatus', () => {
    it('should be an async function', () => {
      expect(showAuthStatus.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('clearAuth', () => {
    it('should be an async function', () => {
      expect(clearAuth.constructor.name).toBe('AsyncFunction');
    });
  });
});
