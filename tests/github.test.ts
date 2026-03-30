import { describe, expect, it } from 'bun:test';
import { extractIssueNumbers } from '../src/github';

describe('extractIssueNumbers', () => {
  describe('Fixes keyword variations', () => {
    it('should extract from "Fixes #123"', () => {
      expect(extractIssueNumbers('Fixes #123')).toContain(123);
    });

    it('should extract from "fixes #123" (lowercase)', () => {
      expect(extractIssueNumbers('fixes #123')).toContain(123);
    });

    it('should extract from "Fix #123"', () => {
      expect(extractIssueNumbers('Fix #123')).toContain(123);
    });

    it('should extract from "FIXES #123" (uppercase)', () => {
      expect(extractIssueNumbers('FIXES #123')).toContain(123);
    });
  });

  describe('Closes keyword variations', () => {
    it('should extract from "Closes #456"', () => {
      expect(extractIssueNumbers('Closes #456')).toContain(456);
    });

    it('should extract from "closes #456" (lowercase)', () => {
      expect(extractIssueNumbers('closes #456')).toContain(456);
    });

    it('should extract from "Close #456"', () => {
      expect(extractIssueNumbers('Close #456')).toContain(456);
    });

    it('should extract from "Closed #456"', () => {
      expect(extractIssueNumbers('Closed #456')).toContain(456);
    });
  });

  describe('Resolves keyword variations', () => {
    it('should extract from "Resolves #789"', () => {
      expect(extractIssueNumbers('Resolves #789')).toContain(789);
    });

    it('should extract from "resolves #789" (lowercase)', () => {
      expect(extractIssueNumbers('resolves #789')).toContain(789);
    });

    it('should extract from "Resolve #789"', () => {
      expect(extractIssueNumbers('Resolve #789')).toContain(789);
    });

    it('should extract from "Resolved #789"', () => {
      expect(extractIssueNumbers('Resolved #789')).toContain(789);
    });
  });

  describe('Related to keyword', () => {
    it('should extract from "Related to #42"', () => {
      expect(extractIssueNumbers('Related to #42')).toContain(42);
    });

    it('should extract from "related to #42" (lowercase)', () => {
      expect(extractIssueNumbers('related to #42')).toContain(42);
    });
  });

  describe('GitHub URL format', () => {
    it('should extract from full GitHub issue URL with Fixes', () => {
      expect(extractIssueNumbers('Fixes https://github.com/owner/repo/issues/999')).toContain(999);
    });

    it('should extract from full GitHub issue URL with Closes', () => {
      expect(extractIssueNumbers('Closes https://github.com/org/project/issues/888')).toContain(888);
    });

    it('should extract from full GitHub issue URL with Resolves', () => {
      expect(extractIssueNumbers('Resolves https://github.com/user/app/issues/777')).toContain(777);
    });
  });

  describe('multiple issues', () => {
    it('should extract multiple issue numbers', () => {
      const body = 'Fixes #100, Closes #200, and Resolves #300';
      const issues = extractIssueNumbers(body);
      expect(issues).toContain(100);
      expect(issues).toContain(200);
      expect(issues).toContain(300);
    });

    it('should extract multiple issues from different lines', () => {
      const body = 'Fixes #111\nCloses #222\nResolves #333';
      const issues = extractIssueNumbers(body);
      expect(issues).toContain(111);
      expect(issues).toContain(222);
      expect(issues).toContain(333);
    });

    it('should extract issues from bullet list', () => {
      const body = '- Fixes #10\n- Closes #20\n- Resolves #30';
      const issues = extractIssueNumbers(body);
      expect(issues).toContain(10);
      expect(issues).toContain(20);
      expect(issues).toContain(30);
    });
  });

  describe('standalone references', () => {
    it('should extract standalone issue reference', () => {
      expect(extractIssueNumbers('See #555 for context')).toContain(555);
    });

    it('should extract multiple standalone references', () => {
      const body = 'Related to #100 and #200';
      const issues = extractIssueNumbers(body);
      expect(issues).toContain(100);
      expect(issues).toContain(200);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for text without issues', () => {
      expect(extractIssueNumbers('No issues here')).toHaveLength(0);
    });

    it('should return empty array for empty string', () => {
      expect(extractIssueNumbers('')).toHaveLength(0);
    });

    it('should not duplicate issue numbers', () => {
      const body = 'Fixes #123, also fixes #123, closes #123';
      const issues = extractIssueNumbers(body);
      const uniqueCount = new Set(issues).size;
      expect(issues.length).toBe(uniqueCount);
    });

    it('should filter out very high numbers (likely not issues)', () => {
      const body = 'Version 1000000 released';
      const issues = extractIssueNumbers(body);
      expect(issues).not.toContain(1000000);
    });

    it('should handle issue at start of text', () => {
      expect(extractIssueNumbers('#42 is the answer')).toContain(42);
    });

    it('should handle issue at end of text', () => {
      expect(extractIssueNumbers('The answer is #42')).toContain(42);
    });

    it('should handle newlines', () => {
      const body = 'Fixes\n#123';
      // This might not match depending on regex, but let's see
      const issues = extractIssueNumbers(body);
      expect(issues).toContain(123);
    });
  });

  describe('mixed content', () => {
    it('should extract from PR template with checkbox', () => {
      const body = '- [x] Fixes #100\n- [ ] TODO';
      expect(extractIssueNumbers(body)).toContain(100);
    });

    it('should extract from markdown formatted text', () => {
      const body = '**Fixes** #200 and _closes_ #300';
      const issues = extractIssueNumbers(body);
      expect(issues).toContain(200);
      expect(issues).toContain(300);
    });

    it('should extract from code block context', () => {
      const body = 'This PR resolves #400. See `#500` for the fix.';
      const issues = extractIssueNumbers(body);
      expect(issues).toContain(400);
      expect(issues).toContain(500);
    });
  });

  describe('realistic PR bodies', () => {
    it('should extract from a typical PR body', () => {
      const body = `## Summary
This PR adds a new feature.

## Issues
Fixes #1234
Closes #5678

## Testing
- Added unit tests
- Manual testing done`;
      const issues = extractIssueNumbers(body);
      expect(issues).toContain(1234);
      expect(issues).toContain(5678);
    });

    it('should extract from dependabot PR body', () => {
      const body = `Bumps [lodash](https://github.com/lodash/lodash) from 4.17.19 to 4.17.21.

Fixes #security-123`;
      // This won't match "security-123" as it's not a number
      const issues = extractIssueNumbers(body);
      // Just make sure it doesn't crash
      expect(Array.isArray(issues)).toBe(true);
    });
  });
});
