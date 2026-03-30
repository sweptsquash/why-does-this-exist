#!/usr/bin/env bun

import { defineCommand, runMain } from 'citty';
import { version, description } from '../package.json';
import { getBlame, extractPRNumber, findFunctionLine, getRepoInfo } from './blame';
import { fetchPR, fetchIssues, extractIssueNumbers } from './github';
import { buildContext, buildSystemPrompt, getVerboseContext } from './context-builder';
import { streamExplanation, getExplanation } from './ai';
import {
  printHeader,
  printFooter,
  printError,
  printVerbose,
  printSources,
  startExplanationStream,
  outputJSON,
  createSpinner,
  printFallbackInfo,
  printPlatformWarning,
} from './renderer';
import { WdeError, GitError } from './errors';
import type { DecisionTrail } from './types';
import { anthropic } from './configs';

/**
 * Parse target string into file and line number
 * Supports: file.ts:42, file.ts
 */
function parseTarget(target: string): { file: string; line: number | null } {
  const colonIndex = target.lastIndexOf(':');
  if (colonIndex === -1) {
    return { file: target, line: null };
  }

  const file = target.slice(0, colonIndex);
  const lineStr = target.slice(colonIndex + 1);
  const line = parseInt(lineStr, 10);

  if (isNaN(line) || line < 1) {
    return { file: target, line: null };
  }

  return { file, line };
}

const main = defineCommand({
  meta: {
    name: 'wde',
    version,
    description,
  },
  args: {
    target: {
      type: 'positional',
      description: 'File path with optional line number (e.g., src/file.ts:42)',
      required: false,
    },
    fn: {
      type: 'string',
      description: 'Function name to look up instead of line number',
      alias: 'f',
    },
    json: {
      type: 'boolean',
      description: 'Output as JSON',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Show full context sent to AI',
      alias: 'v',
      default: false,
    },
    model: {
      type: 'string',
      description: 'Claude model to use',
      default: anthropic().defaultModel,
      alias: 'm',
    },
    local: {
      type: 'boolean',
      description: 'Use local git context only (skip GitHub API)',
      default: false,
    },
  },
  async run({ args }) {
    const { target, fn, json, verbose, model, local } = args;

    // Show usage if no target provided
    if (!target && !fn) {
      console.log('Usage: wde <file:line> [options]');
      console.log('       wde <file> --fn <functionName> [options]');
      console.log('\nRun `wde --help` for more information.');
      process.exit(1);
    }

    try {
      // Parse target
      let file: string;
      let line: number;

      if (target) {
        const parsed = parseTarget(target);
        file = parsed.file;

        if (fn) {
          // If both target and --fn provided, use target as file and lookup function
          line = await findFunctionLine(file, fn);
        } else if (parsed.line) {
          line = parsed.line;
        } else {
          throw new GitError('Please provide a line number (file.ts:42) or use --fn to specify a function name');
        }
      } else if (fn) {
        throw new GitError('Please provide a file path when using --fn flag');
      } else {
        throw new GitError('Please provide a target file:line');
      }

      // Print header (unless JSON mode)
      if (!json) {
        printHeader(file, line);
      }

      // Step 1: Git blame
      const blameSpinner = !json ? createSpinner('Tracing git blame...') : null;
      const blame = await getBlame(file, line);
      blameSpinner?.stop();

      // Step 2: Get repo info
      const repoSpinner = !json ? createSpinner('Detecting repository...') : null;
      const repoInfo = await getRepoInfo();
      repoSpinner?.stop();

      // Check platform support
      if (repoInfo.platform !== 'github' && !local) {
        if (!json) {
          printPlatformWarning(repoInfo.platform.charAt(0).toUpperCase() + repoInfo.platform.slice(1));
        }
      }

      // Step 3: Extract PR number and fetch PR context
      let pr = null;
      let issues: DecisionTrail['issues'] = [];

      if (repoInfo.platform === 'github' && !local) {
        const prNumber = extractPRNumber(blame.commitMessage);

        if (prNumber) {
          const prSpinner = !json ? createSpinner(`Fetching PR #${prNumber}...`) : null;
          pr = await fetchPR(repoInfo.owner, repoInfo.repo, prNumber);
          prSpinner?.stop();

          // Step 4: Extract and fetch linked issues
          if (pr) {
            const issueNumbers = extractIssueNumbers(pr.body);
            if (issueNumbers.length > 0) {
              const issueSpinner = !json ? createSpinner(`Fetching ${issueNumbers.length} linked issue(s)...`) : null;
              issues = await fetchIssues(repoInfo.owner, repoInfo.repo, issueNumbers);
              issueSpinner?.stop();
            }
          }
        } else if (!json) {
          printFallbackInfo();
        }
      }

      // Build decision trail
      const trail: DecisionTrail = {
        blame,
        pr,
        issues,
        repoOwner: repoInfo.owner,
        repo: repoInfo.repo,
      };

      // Step 5: Build context
      const context = buildContext(trail);
      const systemPrompt = buildSystemPrompt();

      // Show verbose context if requested
      if (verbose && !json) {
        printVerbose(getVerboseContext(trail, context));
      }

      // Step 6: Get AI explanation
      let explanation: string;

      if (json) {
        // Non-streaming for JSON output
        explanation = await getExplanation(systemPrompt, context, model);
        outputJSON(trail, explanation);
      } else {
        // Streaming for interactive output
        const aiSpinner = createSpinner('Asking Claude...');
        aiSpinner.stop();

        const stream = startExplanationStream();
        explanation = await streamExplanation(systemPrompt, context, model, (chunk) => {
          stream.write(chunk);
        });
        stream.end();

        // Print sources
        printSources(trail);
        printFooter();
      }
    } catch (error) {
      if (error instanceof WdeError) {
        if (json) {
          console.log(JSON.stringify({ error: error.message }, null, 2));
        } else {
          printError(error);
        }
        process.exit(1);
      }

      // Unexpected error
      const message = error instanceof Error ? error.message : String(error);
      if (json) {
        console.log(JSON.stringify({ error: message }, null, 2));
      } else {
        printError(new Error(message));
      }
      process.exit(1);
    }
  },
});

runMain(main);
