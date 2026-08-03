import process from 'node:process';

const skippedNpmCommands = new Set(['pack', 'publish']);

const shouldSkip =
  process.env.CI === 'true' ||
  process.env.NODE_ENV === 'production' ||
  skippedNpmCommands.has(process.env.npm_command ?? '');

if (!shouldSkip) {
  const { default: husky } = await import('husky');
  husky();
}
