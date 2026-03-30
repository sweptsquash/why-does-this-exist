import { describe, expect, it } from 'bun:test';
import { buildContext, buildSystemPrompt, getVerboseContext } from '../src/context-builder';
import type { DecisionTrail, BlameResult, PRContext, IssueContext } from '../src/types';

// Helper to create a minimal valid trail
function createMinimalTrail(overrides?: Partial<DecisionTrail>): DecisionTrail {
  return {
    blame: {
      sha: 'abc123def456789',
      commitMessage: 'feat: add feature',
      diff: '+ new code',
      authorName: 'Test User',
      authorEmail: 'test@example.com',
      authorDate: new Date('2024-01-15T10:00:00Z'),
    },
    pr: null,
    issues: [],
    repoOwner: 'test-org',
    repo: 'test-repo',
    ...overrides,
  };
}

// Helper to create a full trail with PR and issues
function createFullTrail(): DecisionTrail {
  return {
    blame: {
      sha: 'abc123def456789',
      commitMessage: 'feat: add new feature\n\nThis adds a cool new feature.',
      diff: '+ const newFeature = true;\n- const oldCode = false;\n+ // more changes',
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
      authorDate: new Date('2024-01-15T10:00:00Z'),
    },
    pr: {
      number: 42,
      title: 'Add new feature',
      body: 'This PR introduces a new feature.\n\nFixes #10',
      labels: ['enhancement', 'reviewed'],
      state: 'merged',
      reviewComments: [
        {
          id: 1,
          body: 'LGTM!',
          user: 'reviewer1',
          path: 'src/feature.ts',
          line: 10,
          createdAt: new Date('2024-01-15T11:00:00Z'),
        },
        {
          id: 2,
          body: 'Consider adding tests',
          user: 'reviewer2',
          path: 'src/feature.ts',
          line: 20,
          createdAt: new Date('2024-01-15T12:00:00Z'),
        },
      ],
      comments: [
        {
          id: 3,
          body: 'Great work!',
          user: 'manager',
          createdAt: new Date('2024-01-15T12:00:00Z'),
          reactions: 5,
        },
        {
          id: 4,
          body: 'Approved',
          user: 'lead',
          createdAt: new Date('2024-01-15T13:00:00Z'),
          reactions: 2,
        },
      ],
    },
    issues: [
      {
        number: 10,
        title: 'Need performance improvements',
        body: 'The current implementation is too slow.',
        state: 'closed',
        labels: ['bug', 'performance'],
        comments: [
          {
            id: 5,
            body: 'This is blocking production',
            user: 'user1',
            createdAt: new Date('2024-01-10T10:00:00Z'),
            reactions: 10,
          },
        ],
      },
      {
        number: 20,
        title: 'Related feature request',
        body: 'Would be nice to have this feature.',
        state: 'closed',
        labels: ['enhancement'],
        comments: [],
      },
    ],
    repoOwner: 'test-org',
    repo: 'test-repo',
  };
}

describe('buildContext', () => {
  describe('commit information', () => {
    it('should include commit SHA', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('abc123def456789');
    });

    it('should include author name', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('Test User');
    });

    it('should include author email', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('test@example.com');
    });

    it('should include commit message', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('feat: add feature');
    });

    it('should include diff', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('new code');
    });

    it('should include commit date', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('2024-01-15');
    });
  });

  describe('PR information', () => {
    it('should include PR number and title', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('PR #42');
      expect(context).toContain('Add new feature');
    });

    it('should include PR state', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('merged');
    });

    it('should include PR labels', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('enhancement');
      expect(context).toContain('reviewed');
    });

    it('should include PR body', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('introduces a new feature');
    });

    it('should handle missing PR gracefully', () => {
      const trail = createMinimalTrail({ pr: null });
      const context = buildContext(trail);
      expect(context).toContain('No PR found');
      expect(context).toContain('pushed directly to the main branch');
    });

    it('should handle PR with empty body', () => {
      const trail = createMinimalTrail({
        pr: {
          number: 1,
          title: 'Test PR',
          body: '',
          labels: [],
          state: 'open',
          reviewComments: [],
          comments: [],
        },
      });
      const context = buildContext(trail);
      expect(context).toContain('PR #1');
    });
  });

  describe('review comments', () => {
    it('should include review comments', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('LGTM!');
      expect(context).toContain('reviewer1');
    });

    it('should include file path in review comments', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('src/feature.ts');
    });

    it('should include line number in review comments', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain(':10');
    });

    it('should handle review comments without line number', () => {
      const trail = createMinimalTrail({
        pr: {
          number: 1,
          title: 'Test',
          body: '',
          labels: [],
          state: 'open',
          reviewComments: [
            {
              id: 1,
              body: 'General comment',
              user: 'reviewer',
              path: 'file.ts',
              line: null,
              createdAt: new Date(),
            },
          ],
          comments: [],
        },
      });
      const context = buildContext(trail);
      expect(context).toContain('General comment');
    });
  });

  describe('PR comments', () => {
    it('should include PR comments', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('Great work!');
      expect(context).toContain('manager');
    });

    it('should include reaction count', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('5 reactions');
    });

    it('should not show reactions when count is 0', () => {
      const trail = createMinimalTrail({
        pr: {
          number: 1,
          title: 'Test',
          body: '',
          labels: [],
          state: 'open',
          reviewComments: [],
          comments: [
            {
              id: 1,
              body: 'Comment',
              user: 'user',
              createdAt: new Date(),
              reactions: 0,
            },
          ],
        },
      });
      const context = buildContext(trail);
      expect(context).not.toContain('0 reactions');
    });
  });

  describe('issues', () => {
    it('should include issue number and title', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('Issue #10');
      expect(context).toContain('Need performance improvements');
    });

    it('should include issue state', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('closed');
    });

    it('should include issue labels', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('bug');
      expect(context).toContain('performance');
    });

    it('should include issue body', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('current implementation is too slow');
    });

    it('should include issue comments', () => {
      const trail = createFullTrail();
      const context = buildContext(trail);
      expect(context).toContain('blocking production');
    });

    it('should handle issues with empty body', () => {
      const trail = createMinimalTrail({
        issues: [
          {
            number: 1,
            title: 'Test Issue',
            body: '',
            state: 'open',
            labels: [],
            comments: [],
          },
        ],
      });
      const context = buildContext(trail);
      expect(context).toContain('Issue #1');
    });

    it('should handle empty issues array', () => {
      const trail = createMinimalTrail({ issues: [] });
      const context = buildContext(trail);
      expect(context).not.toContain('Linked Issues');
    });
  });

  describe('truncation', () => {
    it('should truncate very long commit messages', () => {
      const longMessage = 'x'.repeat(1000);
      const trail = createMinimalTrail({
        blame: {
          sha: 'abc123',
          commitMessage: longMessage,
          diff: '',
          authorName: 'Test',
          authorEmail: 'test@test.com',
          authorDate: new Date(),
        },
      });
      const context = buildContext(trail);
      // Should be truncated with ellipsis
      expect(context.length).toBeLessThan(longMessage.length + 1000);
    });

    it('should truncate very long diffs', () => {
      const longDiff = '+ ' + 'x'.repeat(5000);
      const trail = createMinimalTrail({
        blame: {
          sha: 'abc123',
          commitMessage: 'test',
          diff: longDiff,
          authorName: 'Test',
          authorEmail: 'test@test.com',
          authorDate: new Date(),
        },
      });
      const context = buildContext(trail);
      expect(context.length).toBeLessThan(longDiff.length + 1000);
    });
  });

  describe('structure', () => {
    it('should include header section', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('# Code Decision Trail');
    });

    it('should include Git Commit section', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('## Git Commit');
    });

    it('should include Pull Request section', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('## Pull Request');
    });

    it('should include diff in code block', () => {
      const trail = createMinimalTrail();
      const context = buildContext(trail);
      expect(context).toContain('```diff');
    });
  });
});

describe('buildSystemPrompt', () => {
  it('should return a non-empty string', () => {
    const prompt = buildSystemPrompt();
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('should include sentence limit guideline', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('3-5 sentences');
  });

  it('should focus on the "why"', () => {
    const prompt = buildSystemPrompt();
    expect(prompt.toLowerCase()).toContain('why');
  });

  it('should mention alternatives', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('alternatives');
  });

  it('should mention gotchas', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('gotchas');
  });

  it('should instruct not to make up information', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('Never make up information');
  });

  it('should mention acknowledging limitations', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('limitations');
  });
});

describe('getVerboseContext', () => {
  it('should include repository info', () => {
    const trail = createMinimalTrail();
    const context = buildContext(trail);
    const verbose = getVerboseContext(trail, context);
    expect(verbose).toContain('test-org/test-repo');
  });

  it('should include commit SHA', () => {
    const trail = createMinimalTrail();
    const context = buildContext(trail);
    const verbose = getVerboseContext(trail, context);
    expect(verbose).toContain('abc123def456789');
  });

  it('should include PR info', () => {
    const trail = createFullTrail();
    const context = buildContext(trail);
    const verbose = getVerboseContext(trail, context);
    expect(verbose).toContain('#42');
  });

  it('should show "None found" for missing PR', () => {
    const trail = createMinimalTrail({ pr: null });
    const context = buildContext(trail);
    const verbose = getVerboseContext(trail, context);
    expect(verbose).toContain('None found');
  });

  it('should include issue numbers', () => {
    const trail = createFullTrail();
    const context = buildContext(trail);
    const verbose = getVerboseContext(trail, context);
    expect(verbose).toContain('#10');
    expect(verbose).toContain('#20');
  });

  it('should include the built context', () => {
    const trail = createMinimalTrail();
    const context = buildContext(trail);
    const verbose = getVerboseContext(trail, context);
    expect(verbose).toContain(context);
  });

  it('should have visual separators', () => {
    const trail = createMinimalTrail();
    const context = buildContext(trail);
    const verbose = getVerboseContext(trail, context);
    expect(verbose).toContain('═══');
    expect(verbose).toContain('───');
  });

  it('should include section headers', () => {
    const trail = createMinimalTrail();
    const context = buildContext(trail);
    const verbose = getVerboseContext(trail, context);
    expect(verbose).toContain('FULL CONTEXT TRAIL');
    expect(verbose).toContain('PROMPT SENT TO CLAUDE');
  });
});
