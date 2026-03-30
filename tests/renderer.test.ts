import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import type { DecisionTrail, ExplainResult } from '../src/types';

// We'll test the output functions by checking what they would produce
// Since they write to stdout, we'll mock console.log

describe('renderer module', () => {
  // Store original console methods
  const originalLog = console.log;
  const originalError = console.error;
  let logOutput: string[] = [];
  let errorOutput: string[] = [];

  beforeEach(() => {
    logOutput = [];
    errorOutput = [];
    console.log = (...args: unknown[]) => {
      logOutput.push(args.map(String).join(' '));
    };
    console.error = (...args: unknown[]) => {
      errorOutput.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  // Import after mocking
  const getRenderer = async () => {
    // Reset module cache
    delete require.cache[require.resolve('../src/renderer')];
    return await import('../src/renderer');
  };

  describe('printHeader', () => {
    it('should print file and line number', async () => {
      const renderer = await getRenderer();
      renderer.printHeader('src/test.ts', 42);
      const output = logOutput.join('\n');
      expect(output).toContain('src/test.ts');
      expect(output).toContain('42');
    });

    it('should include wde branding', async () => {
      const renderer = await getRenderer();
      renderer.printHeader('file.ts', 1);
      const output = logOutput.join('\n');
      expect(output).toContain('wde');
    });
  });

  describe('printFooter', () => {
    it('should print a separator line', async () => {
      const renderer = await getRenderer();
      renderer.printFooter();
      const output = logOutput.join('\n');
      expect(output).toContain('━');
    });
  });

  describe('printError', () => {
    it('should print error message', async () => {
      const renderer = await getRenderer();
      const error = new Error('Test error message');
      renderer.printError(error);
      const output = errorOutput.join('\n');
      expect(output).toContain('Test error message');
    });

    it('should include Error label', async () => {
      const renderer = await getRenderer();
      const error = new Error('Something went wrong');
      renderer.printError(error);
      const output = errorOutput.join('\n');
      expect(output).toContain('Error');
    });
  });

  describe('printVerbose', () => {
    it('should print the context', async () => {
      const renderer = await getRenderer();
      renderer.printVerbose('Verbose context content here');
      const output = logOutput.join('\n');
      expect(output).toContain('Verbose context content here');
    });
  });

  describe('printSources', () => {
    it('should print commit information', async () => {
      const renderer = await getRenderer();
      const trail: DecisionTrail = {
        blame: {
          sha: 'abc123def456',
          commitMessage: 'test commit',
          diff: '',
          authorName: 'Test Author',
          authorEmail: 'test@example.com',
          authorDate: new Date(),
        },
        pr: null,
        issues: [],
        repoOwner: 'owner',
        repo: 'repo',
      };
      renderer.printSources(trail);
      const output = logOutput.join('\n');
      expect(output).toContain('abc123d'); // short SHA
      expect(output).toContain('Test Author');
    });

    it('should print PR information when available', async () => {
      const renderer = await getRenderer();
      const trail: DecisionTrail = {
        blame: {
          sha: 'abc123',
          commitMessage: 'test',
          diff: '',
          authorName: 'Author',
          authorEmail: 'a@b.com',
          authorDate: new Date(),
        },
        pr: {
          number: 42,
          title: 'Test PR Title',
          body: '',
          labels: [],
          state: 'merged',
          reviewComments: [],
          comments: [],
        },
        issues: [],
        repoOwner: 'owner',
        repo: 'repo',
      };
      renderer.printSources(trail);
      const output = logOutput.join('\n');
      expect(output).toContain('PR #42');
      expect(output).toContain('Test PR Title');
    });

    it('should print issue information', async () => {
      const renderer = await getRenderer();
      const trail: DecisionTrail = {
        blame: {
          sha: 'abc123',
          commitMessage: 'test',
          diff: '',
          authorName: 'Author',
          authorEmail: 'a@b.com',
          authorDate: new Date(),
        },
        pr: null,
        issues: [
          {
            number: 100,
            title: 'Bug report title',
            body: '',
            state: 'closed',
            labels: [],
            comments: [],
          },
        ],
        repoOwner: 'owner',
        repo: 'repo',
      };
      renderer.printSources(trail);
      const output = logOutput.join('\n');
      expect(output).toContain('Issue #100');
      expect(output).toContain('Bug report title');
    });

    it('should include GitHub URLs', async () => {
      const renderer = await getRenderer();
      const trail: DecisionTrail = {
        blame: {
          sha: 'abc123',
          commitMessage: 'test',
          diff: '',
          authorName: 'Author',
          authorEmail: 'a@b.com',
          authorDate: new Date(),
        },
        pr: null,
        issues: [],
        repoOwner: 'test-owner',
        repo: 'test-repo',
      };
      renderer.printSources(trail);
      const output = logOutput.join('\n');
      expect(output).toContain('github.com/test-owner/test-repo');
    });
  });

  describe('outputJSON', () => {
    it('should output valid JSON', async () => {
      const renderer = await getRenderer();
      const trail: DecisionTrail = {
        blame: {
          sha: 'abc123',
          commitMessage: 'test',
          diff: '',
          authorName: 'Author',
          authorEmail: 'a@b.com',
          authorDate: new Date(),
        },
        pr: { number: 42, title: 'PR', body: '', labels: [], state: 'merged', reviewComments: [], comments: [] },
        issues: [{ number: 10, title: 'Issue', body: '', state: 'closed', labels: [], comments: [] }],
        repoOwner: 'owner',
        repo: 'repo',
      };
      renderer.outputJSON(trail, 'Test explanation');
      const output = logOutput.join('\n');

      // Should be valid JSON
      const parsed = JSON.parse(output);
      expect(parsed).toBeDefined();
    });

    it('should include explanation in JSON', async () => {
      const renderer = await getRenderer();
      const trail: DecisionTrail = {
        blame: { sha: 'abc', commitMessage: '', diff: '', authorName: '', authorEmail: '', authorDate: new Date() },
        pr: null,
        issues: [],
        repoOwner: 'o',
        repo: 'r',
      };
      renderer.outputJSON(trail, 'This is the explanation');
      const output = logOutput.join('\n');
      const parsed = JSON.parse(output);
      expect(parsed.explanation).toBe('This is the explanation');
    });

    it('should include sources in JSON', async () => {
      const renderer = await getRenderer();
      const trail: DecisionTrail = {
        blame: { sha: 'abc123', commitMessage: '', diff: '', authorName: '', authorEmail: '', authorDate: new Date() },
        pr: { number: 99, title: '', body: '', labels: [], state: 'open', reviewComments: [], comments: [] },
        issues: [
          { number: 1, title: '', body: '', state: 'open', labels: [], comments: [] },
          { number: 2, title: '', body: '', state: 'open', labels: [], comments: [] },
        ],
        repoOwner: 'o',
        repo: 'r',
      };
      renderer.outputJSON(trail, 'Explanation');
      const output = logOutput.join('\n');
      const parsed = JSON.parse(output) as ExplainResult;
      expect(parsed.sources.sha).toBe('abc123');
      expect(parsed.sources.prNumber).toBe(99);
      expect(parsed.sources.issueNumbers).toEqual([1, 2]);
    });

    it('should handle null PR in JSON', async () => {
      const renderer = await getRenderer();
      const trail: DecisionTrail = {
        blame: { sha: 'abc', commitMessage: '', diff: '', authorName: '', authorEmail: '', authorDate: new Date() },
        pr: null,
        issues: [],
        repoOwner: 'o',
        repo: 'r',
      };
      renderer.outputJSON(trail, 'Test');
      const output = logOutput.join('\n');
      const parsed = JSON.parse(output) as ExplainResult;
      expect(parsed.sources.prNumber).toBeNull();
    });
  });

  describe('printWarning', () => {
    it('should print warning message', async () => {
      const renderer = await getRenderer();
      renderer.printWarning('This is a warning');
      const output = logOutput.join('\n');
      expect(output).toContain('This is a warning');
    });
  });

  describe('printFallbackInfo', () => {
    it('should mention no PR found', async () => {
      const renderer = await getRenderer();
      renderer.printFallbackInfo();
      const output = logOutput.join('\n');
      expect(output).toContain('No PR found');
    });
  });

  describe('printPlatformWarning', () => {
    it('should mention the platform', async () => {
      const renderer = await getRenderer();
      renderer.printPlatformWarning('GitLab');
      const output = logOutput.join('\n');
      expect(output).toContain('GitLab');
    });

    it('should mention v2 support', async () => {
      const renderer = await getRenderer();
      renderer.printPlatformWarning('Bitbucket');
      const output = logOutput.join('\n');
      expect(output).toContain('v2');
    });
  });

  describe('createSpinner', () => {
    it('should return an object with stop and update methods', async () => {
      const renderer = await getRenderer();
      const spinner = renderer.createSpinner('Loading...');
      expect(typeof spinner.stop).toBe('function');
      expect(typeof spinner.update).toBe('function');
      spinner.stop();
    });

    it('should print the initial message in non-TTY mode', async () => {
      const renderer = await getRenderer();
      renderer.createSpinner('Test message');
      const output = logOutput.join('\n');
      expect(output).toContain('Test message');
    });
  });

  describe('startExplanationStream', () => {
    it('should return write and end functions', async () => {
      const renderer = await getRenderer();
      const stream = renderer.startExplanationStream();
      expect(typeof stream.write).toBe('function');
      expect(typeof stream.end).toBe('function');
      stream.end();
    });

    it('should print Explanation header', async () => {
      const renderer = await getRenderer();
      renderer.startExplanationStream();
      const output = logOutput.join('\n');
      expect(output).toContain('Explanation');
    });
  });
});
