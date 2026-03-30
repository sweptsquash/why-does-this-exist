import { describe, expect, it } from 'bun:test';
import { extractPRNumber } from '../src/blame';

describe('extractPRNumber', () => {
  describe('merge commit patterns', () => {
    it('should extract PR number from standard merge commit', () => {
      const message = 'Merge pull request #123 from feature/branch';
      expect(extractPRNumber(message)).toBe(123);
    });

    it('should extract PR number from lowercase merge commit', () => {
      const message = 'merge pull request #42 from fix/bug';
      expect(extractPRNumber(message)).toBe(42);
    });

    it('should extract PR number from merge commit with description', () => {
      const message = 'Merge pull request #999 from org/repo\n\nFixes a critical bug';
      expect(extractPRNumber(message)).toBe(999);
    });

    it('should handle merge commit with mixed case', () => {
      const message = 'MERGE PULL REQUEST #555 from main';
      expect(extractPRNumber(message)).toBe(555);
    });
  });

  describe('squash merge patterns', () => {
    it('should extract PR number from squash merge message', () => {
      const message = 'feat: add new feature (#456)';
      expect(extractPRNumber(message)).toBe(456);
    });

    it('should extract PR number from conventional commit', () => {
      const message = 'fix(auth): resolve login issue (#789)';
      expect(extractPRNumber(message)).toBe(789);
    });

    it('should extract PR number with scope', () => {
      const message = 'chore(deps): bump dependencies (#101)';
      expect(extractPRNumber(message)).toBe(101);
    });

    it('should handle multi-line squash merge', () => {
      const message = 'feat: amazing feature (#202)\n\n* Add feature A\n* Add feature B';
      expect(extractPRNumber(message)).toBe(202);
    });
  });

  describe('reference patterns', () => {
    it('should extract PR number from body reference', () => {
      const message = 'Some commit\n\nCloses #789';
      expect(extractPRNumber(message)).toBe(789);
    });

    it('should extract PR number from standalone reference', () => {
      const message = 'Quick fix for #321';
      expect(extractPRNumber(message)).toBe(321);
    });

    it('should extract PR number from Fixes reference', () => {
      const message = 'Update code\n\nFixes #654';
      expect(extractPRNumber(message)).toBe(654);
    });
  });

  describe('edge cases', () => {
    it('should return null when no PR number found', () => {
      const message = 'Initial commit';
      expect(extractPRNumber(message)).toBeNull();
    });

    it('should return null for empty message', () => {
      const message = '';
      expect(extractPRNumber(message)).toBeNull();
    });

    it('should return null for message with no numbers', () => {
      const message = 'Just some text without any issue references';
      expect(extractPRNumber(message)).toBeNull();
    });

    it('should extract first PR number when multiple exist', () => {
      const message = 'Merge pull request #100 from branch\n\nRelated to #200 and #300';
      expect(extractPRNumber(message)).toBe(100);
    });

    it('should handle very large PR numbers', () => {
      const message = 'feat: something (#99999)';
      expect(extractPRNumber(message)).toBe(99999);
    });

    it('should handle PR number at start of message', () => {
      const message = '#123 - Fix bug';
      expect(extractPRNumber(message)).toBe(123);
    });

    it('should handle PR number at end of message', () => {
      const message = 'Fix the bug #456';
      expect(extractPRNumber(message)).toBe(456);
    });
  });

  describe('priority order', () => {
    it('should prioritize merge commit pattern over squash pattern', () => {
      const message = 'Merge pull request #111 from branch (#222)';
      expect(extractPRNumber(message)).toBe(111);
    });

    it('should prioritize squash pattern over reference', () => {
      const message = 'Fix bug (#333)\n\nRelated to #444';
      expect(extractPRNumber(message)).toBe(333);
    });
  });
});
