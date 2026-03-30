# wde - why-does-this-exist

> This file is read by both **Claude Code** (as CLAUDE.md) and **OpenAI Codex** (as AGENTS.md via symlink).

A CLI tool that traces git blame → PRs → issues → reviews and explains legacy code decisions using AI.

## Quick Reference

```bash
bun install              # Install dependencies
bun run src/cli.ts       # Run locally
bun test                 # Run tests (176 tests)
bun run typecheck        # Type check
bun run build            # Build binary
```

## Tech Stack

- **Runtime**: Bun (fast startup, native TS, safe shell execution)
- **Language**: TypeScript (strict mode)
- **AI**: Claude API via @anthropic-ai/sdk with streaming responses
- **CLI**: citty (lightweight, TypeScript-first)
- **Testing**: bun:test

## Project Structure

```
src/
├── cli.ts              # Entry point, argument parsing, orchestration
├── types.ts            # TypeScript interfaces
├── errors.ts           # Custom error classes (WdeError, GitError, etc.)
├── configs/            # Configuration module (Laravel-style)
│   ├── index.ts        # Unified config export
│   ├── github.ts       # GitHub API configuration
│   ├── anthropic.ts    # Anthropic API configuration
│   └── app.ts          # Application configuration
├── blame.ts            # Git blame operations, PR extraction
├── github.ts           # GitHub API client (PRs, issues, comments)
├── context-builder.ts  # Prompt assembly with token budget
├── ai.ts               # Claude API with streaming
└── renderer.ts         # Output formatting, colors, JSON

tests/
├── types.test.ts           # Type interface tests
├── errors.test.ts          # Error class tests
├── configs.test.ts         # Configuration tests
├── blame.test.ts           # Git blame & PR extraction tests
├── github.test.ts          # Issue number extraction tests
├── context-builder.test.ts # Context building tests
└── renderer.test.ts        # Output rendering tests
```

## Key Principles

1. **Config-Driven**: All settings via environment variables through config module
2. **Security First**: Validate inputs, use Bun's safe `$` shell, sanitize before AI
3. **Graceful Degradation**: Works without GitHub token (local git only)
4. **Minimal Dependencies**: Only 3 runtime deps
5. **Type Safety**: Strict TypeScript, no `any`
6. **Streaming AI**: Real-time response display

## Available Skills

- `/security` - Security guidelines and secure coding patterns
- `/contribute` - Coding standards and contribution workflow
- `wde-dev` - Architecture and implementation details (auto-loaded)

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...  # Required for AI

# Optional
GITHUB_TOKEN=ghp_...          # For private repos

# Advanced (see .env.example for full list)
GITHUB_API_BASE=https://api.github.com
WDE_DEFAULT_MODEL=claude-sonnet-4-20250514
WDE_MAX_TOKENS=8000
```

## Current Status

**Phase 1-4 Complete**: Full implementation done!
- ✅ Git blame operations with PR number extraction
- ✅ GitHub API integration (PRs, issues, comments)
- ✅ Context builder with token budget management
- ✅ Claude API with streaming responses
- ✅ Beautiful terminal output with colors
- ✅ JSON output mode for tooling integration
- ✅ Comprehensive test suite (176 tests)
- ✅ Config-driven architecture

**Next**: Phase 5 - Distribution & launch
