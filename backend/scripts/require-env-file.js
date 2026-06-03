const { existsSync } = require('fs');
const { resolve } = require('path');

const envFile = process.argv[2];

if (!envFile) {
  process.stderr.write('Usage: node scripts/require-env-file.js <env-file>\n');
  process.exit(1);
}

const envPath = resolve(process.cwd(), envFile);

if (!existsSync(envPath)) {
  process.stderr.write(
    [
      `Missing required environment file: ${envPath}`,
      `Create it from ${envFile}.example if available, then run the command again.`,
      '',
    ].join('\n'),
  );
  process.exit(1);
}
