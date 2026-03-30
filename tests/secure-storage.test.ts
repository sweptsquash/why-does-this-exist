import { describe, expect, it } from 'bun:test';
import {
  storeCredential,
  getCredential,
  deleteCredential,
  isSecureStorageAvailable,
  getStoredCredentials,
  clearWdeCredentials,
  type CredentialKey,
} from '../src/secure-storage';

describe('secure-storage', () => {
  describe('exports', () => {
    it('should export storeCredential function', () => {
      expect(typeof storeCredential).toBe('function');
    });

    it('should export getCredential function', () => {
      expect(typeof getCredential).toBe('function');
    });

    it('should export deleteCredential function', () => {
      expect(typeof deleteCredential).toBe('function');
    });

    it('should export isSecureStorageAvailable function', () => {
      expect(typeof isSecureStorageAvailable).toBe('function');
    });

    it('should export getStoredCredentials function', () => {
      expect(typeof getStoredCredentials).toBe('function');
    });

    it('should export clearWdeCredentials function', () => {
      expect(typeof clearWdeCredentials).toBe('function');
    });
  });

  describe('CredentialKey type', () => {
    it('should accept valid credential keys', () => {
      const keys: CredentialKey[] = [
        'anthropic-api-key',
        'openai-api-key',
        'github-token',
      ];
      expect(keys).toHaveLength(3);
    });
  });

  describe('isSecureStorageAvailable', () => {
    it('should return a boolean', async () => {
      const result = await isSecureStorageAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStoredCredentials', () => {
    it('should return an object with credential status', async () => {
      const result = await getStoredCredentials();
      expect(result).toHaveProperty('anthropic');
      expect(result).toHaveProperty('openai');
      expect(result).toHaveProperty('github');
      expect(typeof result.anthropic).toBe('boolean');
      expect(typeof result.openai).toBe('boolean');
      expect(typeof result.github).toBe('boolean');
    });
  });

  describe('storeCredential', () => {
    it('should return a boolean indicating success/failure', async () => {
      // This will likely return false in CI where keychain is unavailable
      const result = await storeCredential('anthropic-api-key', 'test-key');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCredential', () => {
    it('should return null or string', async () => {
      const result = await getCredential('anthropic-api-key');
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('deleteCredential', () => {
    it('should return a boolean indicating success/failure', async () => {
      const result = await deleteCredential('anthropic-api-key');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('clearWdeCredentials', () => {
    it('should complete without throwing', async () => {
      await expect(clearWdeCredentials()).resolves.toBeUndefined();
    });
  });
});
