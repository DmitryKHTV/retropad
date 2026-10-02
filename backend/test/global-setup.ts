import { execSync } from 'node:child_process';
import { testDatabaseUrl } from './test-database-url';

// Runs once before all suites: brings the test database up to the current
// migrations. Tests create their own users and boards, so no cleanup is needed.
export default function globalSetup(): void {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
  });
}
