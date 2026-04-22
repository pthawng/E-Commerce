import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

let container: StartedPostgreSqlContainer;

/**
 * L8 Pattern: Global setup starts ONE container for the entire integration
 * test run, shared across all test files (but isolated via transactions).
 * This avoids the overhead of spinning up/down a container per file.
 */
export default async function globalSetup() {
  console.log('\n🚀 [Integration] Starting Postgres container...');

  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('ray_paradis_test')
    .withUsername('test_user')
    .withPassword('test_pass')
    .start();

  const dbUrl = container.getConnectionUri();
  process.env.TEST_DATABASE_URL = dbUrl;

  // Run migrations against the clean container
  console.log('⚙️ [Integration] Running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'pipe',
  });

  // Store container reference for teardown
  (global as any).__PG_CONTAINER__ = container;

  console.log('✅ [Integration] Container is ready.\n');
}
