---
name: security
description: Security guidelines and best practices for wde. Use when writing code that handles user input, API calls, shell commands, secrets, or error handling. Enforces secure coding patterns.
user-invocable: true
allowed-tools: Read, Grep, Glob
---

# Security Guidelines for wde

You are working on `wde` (why-does-this-exist), a CLI tool that traces git blame → PRs → issues and explains legacy code using AI. Security is critical because this tool:

- Executes shell commands (git)
- Handles API credentials (GitHub, Anthropic)
- Processes untrusted input (file paths, PR content)
- Makes external API calls

## Core Principles

### 1. Defense in Depth
Apply multiple layers of security. Never rely on a single check.

### 2. Principle of Least Privilege
- GitHub token: only `repo:read` scope needed
- No write operations to repositories
- Minimal file system access (read-only)

### 3. Fail Secure
When in doubt, deny. Errors should not leak sensitive information.

---

## Input Validation

### File Paths - CRITICAL

```typescript
// ALWAYS validate file paths to prevent path traversal
function validateFilePath(input: string): string {
  const resolved = path.resolve(input);
  const cwd = process.cwd();

  // Must be within repository
  if (!resolved.startsWith(cwd)) {
    throw new SecurityError('Path traversal detected');
  }

  // Must be a regular file
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile()) {
    throw new ValidationError('Target must be a regular file');
  }

  // Block sensitive files
  const blocked = [/\.env$/, /\.git\/config$/, /id_rsa/, /\.pem$/, /credentials/i];
  if (blocked.some(p => p.test(resolved))) {
    throw new SecurityError('Access to sensitive files blocked');
  }

  return resolved;
}
```

**NEVER:**
- ❌ `fs.readFileSync(userInput)`
- ❌ Trust `..` in paths
- ❌ Follow symlinks outside repo

### Line Numbers

```typescript
function validateLineNumber(line: unknown): number {
  const num = Number(line);
  if (!Number.isInteger(num) || num < 1 || num > 1_000_000) {
    throw new ValidationError('Invalid line number');
  }
  return num;
}
```

### Function Names

```typescript
function validateFunctionName(name: string): string {
  // Only valid identifier characters
  const sanitized = name.replace(/[^a-zA-Z0-9_$]/g, '');
  if (sanitized !== name || sanitized.length > 255) {
    throw new ValidationError('Invalid function name');
  }
  return sanitized;
}
```

---

## Shell Command Execution - CRITICAL

### Use Bun's Safe Shell

```typescript
import { $ } from 'bun';

// SAFE: Bun's $ automatically escapes arguments
const result = await $`git blame -L ${line},${line} --porcelain -- ${file}`.text();
```

**NEVER:**
```typescript
// ❌ DANGEROUS - Command injection vulnerability
exec(`git blame -L ${line},${line} ${file}`);
exec('git blame -L ' + line + ',' + line + ' ' + file);
Bun.spawn(['sh', '-c', `git blame ${file}`]);
```

### Command Allowlist

```typescript
const ALLOWED_COMMANDS = new Set([
  'git blame',
  'git show',
  'git log',
  'git remote',
  'git rev-parse',
]);

function validateCommand(cmd: string): void {
  const baseCmd = cmd.split(' ').slice(0, 2).join(' ');
  if (!ALLOWED_COMMANDS.has(baseCmd)) {
    throw new SecurityError(`Command not allowed: ${baseCmd}`);
  }
}
```

### Timeouts

```typescript
// Always set timeouts on external commands
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

try {
  const result = await $`git blame ${file}`.timeout(30_000);
} finally {
  clearTimeout(timeout);
}
```

---

## API Security

### GitHub API

```typescript
class GitHubClient {
  private readonly baseUrl = 'https://api.github.com';

  constructor() {
    // Token from environment ONLY
    this.token = process.env.GITHUB_TOKEN;

    // Validate format if present
    if (this.token && !this.isValidToken(this.token)) {
      throw new SecurityError('Invalid GitHub token format');
    }
  }

  private isValidToken(token: string): boolean {
    return /^(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}$/.test(token) ||
           /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/.test(token);
  }

  async fetch(endpoint: string): Promise<Response> {
    // Prevent SSRF - endpoint must start with /
    if (!endpoint.startsWith('/')) {
      throw new SecurityError('Invalid endpoint');
    }

    const url = new URL(endpoint, this.baseUrl);

    // Verify we're only calling GitHub
    if (url.origin !== this.baseUrl) {
      throw new SecurityError('SSRF attempt detected');
    }

    // Set timeout
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10_000);

    return fetch(url.toString(), {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'wde-cli/1.0',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      signal: controller.signal,
    });
  }
}
```

### Anthropic API

```typescript
class AnthropicClient {
  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new ConfigError('ANTHROPIC_API_KEY required');
    }

    if (!apiKey.startsWith('sk-ant-')) {
      throw new SecurityError('Invalid Anthropic API key format');
    }

    this.client = new Anthropic({ apiKey });
  }

  async explain(context: DecisionTrail): Promise<string> {
    // Sanitize before sending to API
    const sanitized = this.sanitizeContext(context);

    // Enforce token limit
    if (this.estimateTokens(sanitized) > 8192) {
      throw new ValidationError('Context too large');
    }

    return this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: this.buildPrompt(sanitized) }],
    });
  }

  private sanitizeContext(context: DecisionTrail): DecisionTrail {
    const patterns = [
      /sk-[a-zA-Z0-9]{32,}/g,           // API keys
      /ghp_[a-zA-Z0-9]{36}/g,           // GitHub tokens
      /-----BEGIN.*PRIVATE KEY-----/gs,  // Private keys
      /password\s*[:=]\s*\S+/gi,        // Passwords
    ];

    const sanitize = (str: string) => {
      let result = str;
      for (const p of patterns) {
        result = result.replace(p, '[REDACTED]');
      }
      return result;
    };

    return {
      ...context,
      blame: {
        ...context.blame,
        commitMessage: sanitize(context.blame.commitMessage),
        diff: sanitize(context.blame.diff),
      },
    };
  }
}
```

---

## Secret Management

### Environment Variables Only

```typescript
// CORRECT: Load from environment
const config = {
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,
};

// NEVER:
// ❌ const key = args.apiKey;           // User input
// ❌ const key = fs.readFileSync('.key'); // File
// ❌ const key = await prompt('Key:');  // Interactive
```

### No Secret Logging

```typescript
function maskSecrets(text: string): string {
  return text
    .replace(/(sk-ant-)[a-zA-Z0-9]+/g, '$1***')
    .replace(/(ghp_)[a-zA-Z0-9]+/g, '$1***')
    .replace(/(Bearer\s+)[a-zA-Z0-9._-]+/g, '$1***');
}

// Use in ALL logging
function log(message: string): void {
  console.log(maskSecrets(message));
}
```

### Secure Errors

```typescript
class SecureError extends Error {
  constructor(message: string, public readonly code: string) {
    super(maskSecrets(message)); // Always mask
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      // NO stack traces in production
    };
  }
}
```

---

## Error Handling

### Typed Error Hierarchy

```typescript
abstract class WdeError extends Error {
  abstract readonly code: string;
  abstract readonly isOperational: boolean;
}

class ValidationError extends WdeError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
}

class SecurityError extends WdeError {
  readonly code = 'SECURITY_ERROR';
  readonly isOperational = true;
}
```

### User-Friendly Messages

```typescript
function formatError(error: unknown): string {
  if (error instanceof ValidationError) {
    return `Invalid input: ${error.message}`;
  }
  if (error instanceof SecurityError) {
    return `Security check failed: ${error.message}`;
  }
  // Unknown errors - don't leak details
  return 'An unexpected error occurred.';
}
```

---

## Security Checklist

Before committing code, verify:

- [ ] All file paths validated against traversal
- [ ] All shell commands use Bun's `$` syntax
- [ ] All external calls have timeouts
- [ ] No secrets in logs or error messages
- [ ] API tokens validated before use
- [ ] Input sanitized before sending to AI
- [ ] Error messages don't leak internals
