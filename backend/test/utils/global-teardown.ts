import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export default async function globalTeardown() {
  const container: StartedPostgreSqlContainer = (global as any).__PG_CONTAINER__;
  if (container) {
    console.log('\n🛑 [Integration] Stopping Postgres container...');
    await container.stop();
  }
}
