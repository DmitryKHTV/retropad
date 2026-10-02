import 'dotenv/config';

// The e2e suite writes to the database, so it never runs against the one from
// .env: the database name always gets a `_test` suffix (retropad → retropad_test).
// CI passes a URL that already ends in `_test`, which is left as is.
export function testDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      'DATABASE_URL is not set (backend/.env or the environment)',
    );
  }
  const url = new URL(raw);
  if (!url.pathname.endsWith('_test')) {
    url.pathname += '_test';
  }
  return url.toString();
}
