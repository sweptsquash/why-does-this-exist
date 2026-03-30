---
name: wde-dev
description: Primary development skill for wde CLI tool. Automatically loaded when working on this codebase. Contains architecture, patterns, and implementation guidelines.
user-invocable: false
---

# wde Development Context

You are working on `wde` (why-does-this-exist), a CLI tool that explains legacy code by tracing git blame → PRs → issues → reviews and synthesizing an explanation using Claude AI.

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   cli.ts    │────▶│  blame.ts   │────▶│  github.ts  │
│  (entry)    │     │ (git ops)   │     │  (API)      │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
┌─────────────┐     ┌─────────────┐            │
│ renderer.ts │◀────│   ai.ts     │◀───────────┘
│  (output)   │     │  (Claude)   │     context-builder.ts
└─────────────┘     └─────────────┘        (assembly)
```

## Data Flow

1. **CLI** parses `file:line` or `--fn functionName`
2. **blame.ts** runs `git blame` → extracts commit SHA
3. **blame.ts** runs `git show` → gets commit message, diff
4. **blame.ts** extracts PR number from commit message
5. **github.ts** fetches PR body, review comments, linked issues
6. **context-builder.ts** assembles prompt within token budget
7. **ai.ts** calls Claude API with structured prompt
8. **renderer.ts** formats output with citations

## Key Types

```typescript
interface BlameResult {
  sha: string;
  commitMessage: string;
  diff: string;
  authorName: string;
  authorEmail: string;
  authorDate: Date;
}

interface PRContext {
  number: number;
  title: string;
  body: string;
  labels: string[];
  reviewComments: ReviewComment[];
  comments: Comment[];
}

interface DecisionTrail {
  blame: BlameResult;
  pr: PRContext | null;
  issues: IssueContext[];
  repoOwner: string;
  repo: string;
}
```

## Implementation Guidelines

### Git Operations (blame.ts)

Parse `git blame --porcelain` output:

```typescript
async function getBlame(file: string, line: number): Promise<BlameResult> {
  const output = await $`git blame -L ${line},${line} --porcelain -- ${file}`.text();

  // First line is: <sha> <orig-line> <final-line> <count>
  const sha = output.split(' ')[0];

  // Parse metadata
  const author = output.match(/^author (.+)$/m)?.[1];
  const date = output.match(/^author-time (\d+)$/m)?.[1];

  // Get full commit info
  const commit = await $`git show ${sha} --format="%B" --no-patch`.text();
  const diff = await $`git show ${sha} --format="" --no-color`.text();

  return { sha, commitMessage: commit.trim(), diff, ... };
}
```

Extract PR number from commit message:

```typescript
function extractPRNumber(commitMessage: string): number | null {
  // Pattern: "... (#123)" or "Merge pull request #123"
  const patterns = [
    /\(#(\d+)\)/,
    /Merge pull request #(\d+)/,
    /^#(\d+)/m,
  ];

  for (const pattern of patterns) {
    const match = commitMessage.match(pattern);
    if (match) return parseInt(match[1], 10);
  }

  return null;
}
```

### GitHub API (github.ts)

Fetch PR with review comments:

```typescript
async function fetchPR(owner: string, repo: string, number: number): Promise<PRContext> {
  const [pr, reviews, comments] = await Promise.all([
    fetch(`/repos/${owner}/${repo}/pulls/${number}`),
    fetch(`/repos/${owner}/${repo}/pulls/${number}/comments`),
    fetch(`/repos/${owner}/${repo}/issues/${number}/comments`),
  ]);

  return {
    number,
    title: pr.title,
    body: pr.body,
    labels: pr.labels.map(l => l.name),
    reviewComments: reviews,
    comments: comments,
  };
}
```

Extract linked issues from PR body:

```typescript
function extractLinkedIssues(body: string): number[] {
  const patterns = [
    /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi,
    /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/(\d+)/gi,
  ];

  const issues = new Set<number>();
  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) {
      issues.add(parseInt(match[1], 10));
    }
  }

  return [...issues];
}
```

### Context Building (context-builder.ts)

Token budget: ~8k tokens input

```typescript
function buildContext(trail: DecisionTrail): string {
  const sections: string[] = [];

  // Always include commit info
  sections.push(`## Commit ${trail.blame.sha.slice(0, 7)}`);
  sections.push(trail.blame.commitMessage);
  sections.push('### Diff (relevant portion)');
  sections.push(truncateDiff(trail.blame.diff, 150)); // Max 150 lines

  // PR context if available
  if (trail.pr) {
    sections.push(`## PR #${trail.pr.number}: ${trail.pr.title}`);
    sections.push(trail.pr.body);

    // Top 10 review comments by relevance
    const topComments = trail.pr.reviewComments
      .sort((a, b) => b.reactions - a.reactions)
      .slice(0, 10);
    sections.push('### Key Review Comments');
    topComments.forEach(c => sections.push(`- ${c.user}: ${c.body}`));
  }

  // Linked issues
  trail.issues.forEach(issue => {
    sections.push(`## Issue #${issue.number}: ${issue.title}`);
    sections.push(issue.body);
  });

  return sections.join('\n\n');
}
```

### AI Prompt (ai.ts)

System prompt for Claude:

```typescript
const SYSTEM_PROMPT = `You are explaining why a piece of code exists.

Given context from git history, PRs, and issues, provide:
1. A 3-5 sentence explanation of WHY this code was written
2. The problem it solved
3. Any alternatives that were considered
4. Gotchas or warnings for future developers

Be specific. Reference actual discussions when relevant.
Do not explain WHAT the code does - explain WHY it exists.`;
```

### Output (renderer.ts)

Formatted terminal output:

```typescript
function render(result: ExplainResult): void {
  const { explanation, sources } = result;

  // Header
  console.log(pc.cyan('─'.repeat(70)));

  // Explanation
  console.log(explanation);

  // Sources
  console.log();
  console.log(pc.dim(`Sources: commit ${sources.sha.slice(0, 7)}`
    + (sources.prNumber ? ` • PR #${sources.prNumber}` : '')
    + (sources.issueNumbers.length ? ` • Issues #${sources.issueNumbers.join(', #')}` : '')
  ));

  console.log(pc.cyan('─'.repeat(70)));
}
```

## Edge Cases to Handle

| Scenario | Behavior |
|----------|----------|
| No PR found | Use commit message + diff only |
| Private repo, no token | Clear error with instructions |
| Rate limit hit | Show limit, suggest token |
| Massive PR (500+ comments) | Truncate to top 10 by reactions |
| Non-GitHub remote | "GitLab support coming in v2" |
| Line in untracked file | Friendly git error |

## Security Reminders

When implementing, always:
- Validate file paths (see `/security` skill)
- Use Bun's `$` for shell commands
- Set timeouts on external calls
- Sanitize context before sending to AI
- Never log secrets

Load the `/security` skill for detailed guidelines.
