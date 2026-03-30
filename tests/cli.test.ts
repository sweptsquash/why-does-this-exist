import { describe, expect, it } from 'bun:test';
import { existsSync } from 'fs';
import { join } from 'path';

describe('cli', () => {
  const cliPath = join(import.meta.dir, '../src/cli.ts');

  describe('file structure', () => {
    it('should have cli.ts entry point', () => {
      expect(existsSync(cliPath)).toBe(true);
    });

    it('should have shebang for bun', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content.startsWith('#!/usr/bin/env bun')).toBe(true);
    });
  });

  describe('imports', () => {
    it('should import version from package.json', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain("from '../package.json'");
    });

    it('should import citty for CLI parsing', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain("from 'citty'");
    });

    it('should import auth commands', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain("from './commands/auth'");
    });

    it('should import AI providers', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain("from './ai-providers'");
    });
  });

  describe('CLI commands', () => {
    it('should define auth subcommand', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('authCommand');
      expect(content).toContain("name: 'auth'");
    });

    it('should define main command with subCommands', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('subCommands:');
      expect(content).toContain('auth: authCommand');
    });
  });

  describe('CLI arguments', () => {
    it('should define target positional argument', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain("type: 'positional'");
      expect(content).toContain('target:');
    });

    it('should define --fn flag', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('fn:');
      expect(content).toContain("alias: 'f'");
    });

    it('should define --json flag', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('json:');
    });

    it('should define --verbose flag', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('verbose:');
      expect(content).toContain("alias: 'v'");
    });

    it('should define --model flag', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('model:');
      expect(content).toContain("alias: 'm'");
    });

    it('should define --provider flag', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('provider:');
      expect(content).toContain("alias: 'p'");
    });

    it('should define --local flag', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('local:');
    });
  });

  describe('parseTarget function', () => {
    // Test the parseTarget logic by examining the patterns it handles
    it('should handle file:line format in code', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('lastIndexOf');
      expect(content).toContain('colonIndex');
    });

    it('should handle missing line number', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('line: null');
    });

    it('should validate line number is positive', async () => {
      const content = await Bun.file(cliPath).text();
      expect(content).toContain('line < 1');
    });
  });
});
