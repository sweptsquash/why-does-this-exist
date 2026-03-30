# AI Agent Skills

This project includes skills compatible with multiple AI coding agents.

## Supported Agents

| Agent | Skills Location | Config Format |
|-------|-----------------|---------------|
| **Claude Code** | `.claude/skills/` | YAML frontmatter in SKILL.md |
| **OpenAI Codex** | `.agents/skills/` | YAML frontmatter + `agents/openai.yaml` |

Both follow the [Agent Skills](https://agentskills.io) open standard.

## Available Skills

### `/security`
Security guidelines and secure coding patterns.

**Activates when:** Writing code that handles user input, file paths, shell commands, API credentials, or error messages.

**Covers:**
- Input validation (path traversal prevention)
- Shell command safety (Bun's `$` syntax)
- API security (SSRF prevention, token validation)
- Secret management (no logging, sanitization)
- Error handling (no internal leaks)

### `/contribute`
Coding standards and contribution workflow.

**Activates when:** Writing new features, fixing bugs, adding tests, or creating PRs.

**Covers:**
- TypeScript strict mode patterns
- Testing with bun:test
- Git workflow and commit messages
- PR process

### `wde-dev` (auto-loaded)
Architecture and implementation details.

**Activates when:** Working on any wde source code.

**Covers:**
- Data flow and architecture diagram
- Key type definitions
- Implementation patterns for each module
- Edge case handling

## Directory Structure

```
.claude/skills/                    # Source of truth
├── security/SKILL.md
├── contribute/SKILL.md
└── wde-dev/SKILL.md

.agents/skills/                    # Codex (symlinked)
├── security/
│   ├── SKILL.md → .claude/skills/security/SKILL.md
│   └── agents/openai.yaml
├── contribute/
│   ├── SKILL.md → .claude/skills/contribute/SKILL.md
│   └── agents/openai.yaml
└── wde-dev/
    ├── SKILL.md → .claude/skills/wde-dev/SKILL.md
    └── agents/openai.yaml

CLAUDE.md                          # Claude Code project memory
```

**Single source of truth:** SKILL.md files live in `.claude/skills/` and are symlinked to `.agents/skills/` for Codex compatibility. Edit once, works everywhere.

## Skill Format

Both agents use YAML frontmatter:

```yaml
---
name: skill-name
description: When to activate this skill. Be specific about triggers.
---

# Skill Content

Instructions for the AI agent...
```

### Claude Code Extras

```yaml
---
name: skill-name
description: ...
user-invocable: true       # Show in /slash menu
allowed-tools: Read, Grep  # Restrict available tools
context: fork              # Run in subagent
---
```

### Codex Extras

`agents/openai.yaml`:
```yaml
interface:
  display_name: "User-facing Name"
  brand_color: "#3B82F6"

policy:
  allow_implicit_invocation: true
```

## Adding a New Skill

1. Create directory in both `.claude/skills/` and `.agents/skills/`
2. Write `SKILL.md` with YAML frontmatter
3. For Codex, add `agents/openai.yaml`
4. Test with both agents

## Best Practices

1. **Clear descriptions** - Be specific about when to activate
2. **Single purpose** - One skill per concern
3. **Actionable content** - Imperative steps, code examples
4. **Cross-reference** - Link to other skills when relevant
5. **Keep updated** - Skills should reflect current codebase
