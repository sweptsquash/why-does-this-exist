<div align="center">

# why-does-this-exist

### `wde` - Decode the *why* behind legacy code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![Claude API](https://img.shields.io/badge/Claude-API-blueviolet)](https://anthropic.com/)

<br/>

**A CLI tool that traces `git blame` → PRs → issues → reviews and explains legacy code decisions in plain English using AI.**

<br/>

```
$ wde src/utils/parser.ts:142

Tracing blame... ████████████████ Done
Fetching PR #234... ████████████████ Done
Fetching issues... ████████████████ Done
Generating explanation...

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  This null check was added to fix a production crash (Issue #198)       │
│  where parser.config could be undefined when called before init().      │
│  The team considered making init() synchronous but rejected it due      │
│  to startup performance concerns noted in PR #234 review comments.      │
│  Watch out: removing this check will break lazy initialization.         │
│                                                                         │
│  Sources: commit a3f9c21 • PR #234 • Issue #198                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

</div>

---

## The Problem

Every developer eventually stares at code where:
- The commit message says `fix`
- The author left the company
- There are zero comments
- The *what* is obvious, but the *why* is buried

The answer exists somewhere — scattered across a PR description, three issue threads, and review comments from 2 years ago. **`wde` reconstructs that trail automatically.**

---

## Features

| Feature | Description |
|---------|-------------|
| **Git Blame Tracing** | Automatically identifies the commit that introduced a line |
| **PR Context Fetching** | Retrieves PR title, body, labels, and all review comments |
| **Issue Linking** | Extracts and fetches all linked issues (`Fixes #123`, `Closes #456`) |
| **AI Explanation** | Claude API synthesizes everything into a 3-5 sentence explanation |
| **Function Lookup** | Use `--fn functionName` to trace by function instead of line number |
| **JSON Output** | `--json` flag for editor/tooling integration |

---

## Installation

```bash
# Using npm
npm install -g why-does-this-exist

# Using bun
bun install -g why-does-this-exist

# Or run directly with npx
npx why-does-this-exist src/file.ts:42
```

### Standalone Binary

Download pre-built binaries from [Releases](https://github.com/zain534102/why-does-this-exist/releases):

```bash
# macOS (Apple Silicon)
curl -fsSL https://github.com/zain534102/why-does-this-exist/releases/latest/download/wde-darwin-arm64 -o wde
chmod +x wde && sudo mv wde /usr/local/bin/

# Linux (x64)
curl -fsSL https://github.com/zain534102/why-does-this-exist/releases/latest/download/wde-linux-x64 -o wde
chmod +x wde && sudo mv wde /usr/local/bin/
```

---

## Setup

```bash
# Required: Anthropic API key for AI explanations
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional: GitHub token for private repos (public repos work without it)
export GITHUB_TOKEN="ghp_..."
```

Create a `.env` file or add to your shell profile.

---

## Usage

```bash
# Explain a specific line
wde src/utils/parser.ts:142

# Explain a function (fuzzy matches function name)
wde --fn parseConfig src/utils/parser.ts

# Output as JSON (for editor integrations)
wde src/file.ts:50 --json

# Show full context sent to AI
wde src/file.ts:50 --verbose

# Use a different Claude model
wde src/file.ts:50 --model claude-haiku-4-5
```

### Flags

| Flag | Description |
|------|-------------|
| `--fn <name>` | Find function by name instead of line number |
| `--json` | Output structured JSON |
| `--verbose` | Show the full context trail sent to Claude |
| `--model <model>` | Claude model to use (default: claude-sonnet-4-20250514) |
| `--help` | Show help |
| `--version` | Show version |

---

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CLI Input   │────▶│  Git Blame   │────▶│  PR Number   │
│  file:line   │     │  + Commit    │     │  Extraction  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Output     │◀────│  Claude API  │◀────│  GitHub API  │
│  Explanation │     │  Synthesis   │     │  PR + Issues │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. **Blame** → Runs `git blame -L N,N --porcelain` to find the commit
2. **Commit** → Fetches full commit message and diff via `git show`
3. **PR Detection** → Parses commit message for PR references (`#123`, merge commits)
4. **GitHub Fetch** → Retrieves PR body, review comments, and linked issues
5. **Context Assembly** → Builds a structured prompt within token budget
6. **AI Explanation** → Claude synthesizes into a clear, actionable explanation
7. **Output** → Formatted terminal output with source citations

---

## Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Runtime | **Bun** | Fast CLI startup, native TS, `$\`...\`` shell helpers |
| Language | **TypeScript** | Type-safe API responses, better DX |
| AI | **Claude API** | Best at reasoning over messy PR/issue text |
| CLI Parser | **citty** | Lightweight, zero deps, TypeScript-first |
| Colors | **picocolors** | Zero deps, respects `NO_COLOR` |
| Testing | **bun:test** | Built-in, no config overhead |
| CI/CD | **GitHub Actions** | Test on push, publish on tag |

---

## MVP Scope

### In Scope (v1.0)
- [x] Git blame on file + line number
- [x] GitHub PR + review comment fetching
- [x] Linked issue extraction + fetching
- [x] Claude API explanation (3-5 sentences)
- [x] Function name lookup (`--fn`)
- [x] Environment variable auth
- [x] Plain stdout + JSON output

### Planned (v2.0)
- [ ] GitLab / Bitbucket support
- [ ] VSCode extension
- [ ] Neovim plugin
- [ ] Local model support (Ollama)
- [ ] Caching layer
- [ ] Interactive TUI mode

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| **No PR found** | Falls back to commit message + diff (still useful) |
| **Private repo, no token** | Clear error with instructions |
| **Rate limit hit** | Shows remaining limit, suggests token |
| **Massive PR (500+ comments)** | Truncates to most relevant content |
| **Non-GitHub remote** | Friendly "GitLab support coming in v2" message |

---

## Contributing

```bash
# Clone and install
git clone https://github.com/zain534102/why-does-this-exist.git
cd why-does-this-exist
bun install

# Run locally
bun run src/cli.ts src/example.ts:10

# Run tests
bun test

# Type check
bun run typecheck
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built by [Zain Ali](https://github.com/zain534102)**

*Stop guessing. Start understanding.*

<br/>

<a href="https://github.com/zain534102/why-does-this-exist/stargazers">
  <img src="https://img.shields.io/github/stars/zain534102/why-does-this-exist?style=social" alt="Stars"/>
</a>

</div>
