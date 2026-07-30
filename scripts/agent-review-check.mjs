#!/usr/bin/env node
/**
 * agent-review-check - automated, AI-free pre-review checklist for
 * @epam/ai-dial-react-file-manager. Complements the `code-reviewer` agent that
 * runs in Cursor / Claude Code / Codex (see agents/code-reviewer.md).
 *
 * What it does:
 *  - Detects changed files (vs origin/development, origin/main, or
 *    origin/master, falling back to HEAD).
 *  - Flags changed components without colocated *.spec.tsx / stories when the
 *    repository structure makes that expectation clear.
 *  - Flags public component files that look unexported from a detected entry
 *    point.
 *  - Flags inline styles, hex colors, console.log, and risky HTML/eval usage in
 *    changed source files.
 *  - Optionally runs `npm run typecheck` and a lint script with --strict.
 *
 * Usage:
 *   node scripts/agent-review-check.mjs
 *   node scripts/agent-review-check.mjs --base origin/main
 *   node scripts/agent-review-check.mjs --strict
 *
 * Exit codes:
 *   0 - no must-fix findings
 *   1 - at least one must-fix finding (or strict checks failed)
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const getFlagValue = (name) => {
  const idx = argv.findIndex((a) => a === name);
  return idx >= 0 && argv[idx + 1] && !argv[idx + 1].startsWith('--')
    ? argv[idx + 1]
    : null;
};

const STRICT = flags.has('--strict');
const STAGED_ONLY = flags.has('--staged-only');
const BASE_OVERRIDE = getFlagValue('--base');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    ...opts,
  });
  return {
    status: r.status ?? -1,
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
  };
}

function gitRefExists(ref) {
  return run('git', ['rev-parse', '--verify', '--quiet', ref]).status === 0;
}

function detectBase() {
  if (BASE_OVERRIDE) return BASE_OVERRIDE;
  const candidates = ['origin/development', 'origin/main', 'origin/master'];
  for (const c of candidates) {
    if (gitRefExists(c)) return c;
  }
  return null;
}

function listChangedFiles(base) {
  if (STAGED_ONLY) {
    const staged = run('git', ['diff', '--name-only', '--cached']);
    return staged.stdout ? staged.stdout.split('\n').filter(Boolean) : [];
  }

  const workingTree = run('git', ['diff', '--name-only', 'HEAD']);
  const staged = run('git', ['diff', '--name-only', '--cached']);
  const untracked = run('git', ['ls-files', '--others', '--exclude-standard']);
  const local = [workingTree, staged, untracked]
    .flatMap((r) => (r.stdout ? r.stdout.split('\n') : []))
    .filter(Boolean);

  if (base) {
    const r = run('git', ['diff', '--name-only', `${base}...HEAD`]);
    const tracked = r.stdout ? r.stdout.split('\n').filter(Boolean) : [];
    return [...new Set([...tracked, ...local])];
  }
  return [...new Set(local)];
}

function fileExists(p) {
  try {
    return existsSync(resolve(process.cwd(), p));
  } catch {
    return false;
  }
}

function readFileSafe(p) {
  try {
    return readFileSync(resolve(process.cwd(), p), 'utf8');
  } catch {
    return '';
  }
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function readPackageJson() {
  try {
    return JSON.parse(readFileSafe('package.json'));
  } catch {
    return {};
  }
}

const findings = { mustFix: [], niceToHave: [] };
const pushMust = (msg) => findings.mustFix.push(msg);
const pushNice = (msg) => findings.niceToHave.push(msg);

function detectEntryPoints() {
  const pkg = readPackageJson();
  const candidates = [];

  if (typeof pkg.source === 'string') candidates.push(pkg.source);
  if (typeof pkg.main === 'string') candidates.push(pkg.main);
  if (typeof pkg.module === 'string') candidates.push(pkg.module);
  if (typeof pkg.types === 'string') candidates.push(pkg.types);

  if (pkg.exports && typeof pkg.exports === 'object') {
    for (const value of Object.values(pkg.exports)) {
      if (typeof value === 'string') candidates.push(value);
      if (value && typeof value === 'object') {
        for (const nested of Object.values(value)) {
          if (typeof nested === 'string') candidates.push(nested);
        }
      }
    }
  }

  return [
    ...new Set([
      ...candidates
        .map((p) => p.replace(/^\.?\//, ''))
        .filter((p) => p.startsWith('src/') && fileExists(p)),
      'src/index.ts',
      'src/index.tsx',
      'src/main.ts',
      'src/main.tsx',
    ]),
  ].filter(fileExists);
}

function isComponentImplementation(file) {
  if (!/^src\/.+\.(tsx)$/.test(file)) return false;
  if (/\.stories\.|\.spec\.|\.test\.|\/__tests__\//.test(file)) return false;
  const name = basename(file, '.tsx');
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function isPublicComponentCandidate(file) {
  return /^src\/components\/([^/]+)\/\1\.tsx$/.test(file);
}

function checkComponentColocation(file) {
  if (!isPublicComponentCandidate(file)) return;

  const componentDir = dirname(file);
  const componentName = basename(file, '.tsx');
  const siblingFiles = [
    `${componentDir}/${componentName}.spec.tsx`,
    `${componentDir}/${componentName}.test.tsx`,
    `${componentDir}/__tests__/${componentName}.spec.tsx`,
    `${componentDir}/${componentName}.stories.tsx`,
    `${componentDir}/${componentName}.stories.ts`,
  ];
  const repoHasSpecsOrStories = listKnownFiles().some((known) =>
    /\.(spec|test|stories)\.tsx?$/.test(known),
  );

  if (!repoHasSpecsOrStories) return;

  const hasSpec = siblingFiles
    .filter((candidate) => /\.(spec|test)\.tsx$/.test(candidate))
    .some(fileExists);
  const hasStory = siblingFiles
    .filter((candidate) => /\.stories\.tsx?$/.test(candidate))
    .some(fileExists);

  if (!hasSpec) {
    pushMust(`${file} - component changed without a colocated spec.`);
  }
  if (!hasStory) {
    pushNice(`${file} - component changed without a colocated story/example.`);
  }
}

let knownFilesCache = null;
function listKnownFiles() {
  if (knownFilesCache) return knownFilesCache;
  const r = run('git', ['ls-files']);
  knownFilesCache = r.stdout ? r.stdout.split('\n').filter(Boolean) : [];
  return knownFilesCache;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkPublicExport(file, entryPoints) {
  if (!isPublicComponentCandidate(file) || entryPoints.length === 0) return;

  const source = readFileSafe(file);
  const componentName = basename(file, '.tsx');
  const expectedPublicName = `Dial${componentName}`;
  const exportedNames = [
    ...source.matchAll(/export\s+(?:const|function|class)\s+([A-Z]\w*)\b/g),
  ]
    .map((match) => match[1])
    .filter((name) => name === expectedPublicName);

  if (exportedNames.length === 0) return;

  const entrySource = entryPoints.map(readFileSafe).join('\n');
  for (const exportedName of exportedNames) {
    const exportRegex = new RegExp(`\\b${escapeRegex(exportedName)}\\b`);
    if (!exportRegex.test(entrySource)) {
      pushNice(
        `${entryPoints.join(', ')} - cannot find public export for ${exportedName} declared in ${file}.`,
      );
    }
  }
}

function checkInlineStylesAndRiskyPatterns(file) {
  if (!/\.(tsx|ts|scss|css)$/.test(file)) return;
  if (/\.spec\.|\/__tests__\/|\.test\.|\.stories\./.test(file)) return;
  const source = readFileSafe(file);
  if (!source) return;
  const sourceWithoutComments = stripComments(source);

  if (/\.tsx$/.test(file)) {
    const inlineStyle = sourceWithoutComments.match(/style\s*=\s*\{\{/g);
    if (inlineStyle && inlineStyle.length > 0) {
      pushNice(
        `${file} - uses inline \`style={{ ... }}\` ${inlineStyle.length} time(s); prefer the repository styling system.`,
      );
    }
  }

  const hexMatches =
    sourceWithoutComments.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  if (hexMatches.length > 0 && /\.(tsx|ts)$/.test(file)) {
    pushNice(
      `${file} - ${hexMatches.length} hex literal(s) (${hexMatches.slice(0, 3).join(', ')}${hexMatches.length > 3 ? ', ...' : ''}); prefer design tokens.`,
    );
  }

  if (/\.tsx?$/.test(file)) {
    const consoleHits =
      sourceWithoutComments.match(/console\.(log|debug|warn|error)\(/g) || [];
    const isTest = /\.spec\.|\/__tests__\/|\.test\.|\.stories\./.test(file);
    const allowsConsole = isTest || file.startsWith('.cursor/hooks/');
    if (consoleHits.length > 0 && !allowsConsole) {
      pushMust(
        `${file} - ${consoleHits.length} \`console.*\` call(s); remove before shipping.`,
      );
    }

    if (/dangerouslySetInnerHTML/.test(sourceWithoutComments)) {
      pushNice(
        `${file} - uses \`dangerouslySetInnerHTML\`; confirm the input is sanitized.`,
      );
    }

    if (/\beval\s*\(|new\s+Function\s*\(/.test(sourceWithoutComments)) {
      pushMust(`${file} - uses eval-like code execution; remove or justify.`);
    }

    const objectUrlCreates =
      sourceWithoutComments.match(/URL\.createObjectURL\s*\(/g) || [];
    if (
      objectUrlCreates.length > 0 &&
      !/URL\.revokeObjectURL\s*\(/.test(sourceWithoutComments)
    ) {
      pushNice(
        `${file} - creates object URLs without an obvious revoke path; clean them up to avoid leaks.`,
      );
    }
  }
}

function runStrictChecks() {
  if (!STRICT) return;
  const scripts = readPackageJson().scripts ?? {};

  if (scripts.typecheck) {
    console.log('\n-> Running `npm run typecheck` (--strict)...');
    const tc = run('npm', ['run', '-s', 'typecheck'], { stdio: 'inherit' });
    if (tc.status !== 0) {
      pushMust('npm run typecheck - failed; fix TypeScript errors.');
    }
  }

  const lintScript = scripts['lint:check'] ? 'lint:check' : 'lint';
  if (scripts[lintScript]) {
    console.log(`-> Running \`npm run ${lintScript}\` (--strict)...`);
    const lint = run('npm', ['run', '-s', lintScript], { stdio: 'inherit' });
    if (lint.status !== 0) {
      pushMust(`npm run ${lintScript} - failed; fix ESLint errors.`);
    }
  }
}

function printReport(base, files) {
  const baseLabel =
    base || '(no remote tracking - using working tree + staged diff)';
  console.log('\n=== agent-review-check ===');
  console.log(`Base:            ${baseLabel}`);
  console.log(`Changed files:   ${files.length}`);
  if (files.length > 0) {
    for (const f of files.slice(0, 25)) console.log(`  - ${f}`);
    if (files.length > 25) console.log(`  ... and ${files.length - 25} more`);
  }

  console.log('\n### Must-fix');
  if (findings.mustFix.length === 0) {
    console.log('None.');
  } else {
    findings.mustFix.forEach((m, i) => console.log(`${i + 1}. ${m}`));
  }

  console.log('\n### Nice-to-have');
  if (findings.niceToHave.length === 0) {
    console.log('None.');
  } else {
    findings.niceToHave.forEach((m, i) => console.log(`${i + 1}. ${m}`));
  }

  console.log(
    '\nHandoff: run the `code-reviewer` agent (/code-review in Cursor or Claude, or the .codex/prompts/code-review.md prompt in Codex) for a full semantic review.',
  );
}

function main() {
  if (run('git', ['rev-parse', '--is-inside-work-tree']).status !== 0) {
    console.error('agent-review-check: not inside a git work tree.');
    process.exit(2);
  }

  const base = detectBase();
  const files = listChangedFiles(base);
  const entryPoints = detectEntryPoints();

  for (const f of files) {
    if (!fileExists(f)) continue;
    checkComponentColocation(f);
    checkPublicExport(f, entryPoints);
    checkInlineStylesAndRiskyPatterns(f);
  }

  runStrictChecks();
  printReport(base, files);

  process.exit(findings.mustFix.length > 0 ? 1 : 0);
}

main();
