/**
 * postToolUse: run repo checks after .ts/.tsx Write/Edit; print JSON on stdout
 * for Cursor hooks.
 * @see https://cursor.com/docs/agent/hooks
 */
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

interface PostToolUseHookInput {
  cwd?: string;
}

interface PackageJson {
  scripts?: Record<string, string>;
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function resolveProjectRoot(stdinText: string): string {
  try {
    const trimmed = stdinText.trim();
    if (!trimmed) {
      return process.cwd();
    }
    const j = JSON.parse(trimmed) as PostToolUseHookInput;
    if (typeof j.cwd === 'string' && j.cwd.length > 0) {
      return j.cwd;
    }
  } catch {
    // ignore invalid JSON
  }
  return process.cwd();
}

function readScripts(projectRoot: string): Record<string, string> {
  try {
    const packageJson = JSON.parse(
      readFileSync(`${projectRoot}/package.json`, 'utf8'),
    ) as PackageJson;
    return packageJson.scripts ?? {};
  } catch {
    return {};
  }
}

function formatFailure(commandLabel: string, log: string): string {
  const body = log.length > 14000 ? `...\n${log.slice(-14000)}` : log;
  const msg = `**Verify failed after .ts/.tsx change** (\`${commandLabel}\`).

\`\`\`
${body}
\`\`\`
`;
  return JSON.stringify({ additional_context: msg });
}

function runNpmScript(
  npmBin: string,
  scriptName: string,
  projectRoot: string,
): SpawnSyncReturns<string> {
  return spawnSync(npmBin, ['run', scriptName], {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    env: process.env,
  });
}

function main(): void {
  if (process.env.CURSOR_SKIP_AGENT_VERIFY === '1') {
    console.log('{}');
    return;
  }

  const projectRoot = resolveProjectRoot(readStdin());
  const packageJsonPath = `${projectRoot}/package.json`;

  if (!existsSync(packageJsonPath)) {
    console.log('{}');
    return;
  }

  const scripts = readScripts(projectRoot);
  const scriptsToRun = scripts['verify:agent-hook']
    ? ['verify:agent-hook']
    : ['typecheck', 'lint', 'test'].filter((script) => scripts[script]);

  if (scriptsToRun.length === 0) {
    console.log('{}');
    return;
  }

  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  for (const script of scriptsToRun) {
    const result = runNpmScript(npmBin, script, projectRoot);
    const log = `${result.stdout ?? ''}${result.stderr ?? ''}`;

    if (result.error) {
      console.log(
        formatFailure(
          `npm run ${script}`,
          `${result.error.message}\n${log}`.trim() || String(result.error),
        ),
      );
      return;
    }

    if (result.status !== 0) {
      console.log(
        formatFailure(
          `npm run ${script}`,
          log.trim() || `(exit ${result.status ?? 'unknown'})`,
        ),
      );
      return;
    }
  }

  console.log('{}');
}

main();
