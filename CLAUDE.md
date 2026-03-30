# wde - why-does-this-exist

> This file is read by both **Claude Code** (as CLAUDE.md) and **OpenAI Codex** (as AGENTS.md via symlink).

A CLI tool that traces git blame → PRs → issues → reviews and explains legacy code decisions using AI.

## Quick Reference

```bash
bun install          # Install dependencies
bun run src/cli.ts   # Run locally
bun test             # Run tests
bun run typecheck    # Type check
bun run build        # Build binary
```

## Tech Stack

- **Runtime**: Bun (fast startup, native TS, safe shell execution)
- **Language**: TypeScript (strict mode)
- **AI**: Claude API via @anthropic-ai/sdk
- **CLI**: citty (lightweight, TypeScript-first)
- **Testing**: bun:test

## Project Structure

```
src/
├── cli.ts              # Entry point, argument parsing
├── types.ts            # TypeScript interfaces
├── blame.ts            # Git blame operations (TODO)
├── github.ts           # GitHub API client (TODO)
├── context-builder.ts  # Prompt assembly (TODO)
├── ai.ts               # Claude API integration (TODO)
└── renderer.ts         # Output formatting (TODO)
```

## Key Principles

1. **Security First**: Always validate inputs, use Bun's safe `$` shell, sanitize before AI
2. **Graceful Degradation**: Works without GitHub token (local git only)
3. **Minimal Dependencies**: Only 3 runtime deps
4. **Type Safety**: Strict TypeScript, no `any`

## Available Skills

- `/security` - Security guidelines and secure coding patterns
- `/contribute` - Coding standards and contribution workflow
- `wde-dev` - Architecture and implementation details (auto-loaded)

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...  # Required for AI
GITHUB_TOKEN=ghp_...          # Optional, for private repos
```

## Current Status

Phase 1 complete: Project scaffolding, CI/CD, types defined.
Next: Implement blame.ts and github.ts
