import { testDatabaseUrl } from './test-database-url';

// Runs in every test worker before AppModule is imported. ConfigModule prefers
// process.env over .env, so these two values win over the file.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.NODE_ENV = 'test';
