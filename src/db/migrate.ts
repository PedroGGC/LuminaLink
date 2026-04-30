import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

const connectionString = process.env.DATABASE_URL || 'postgresql://shorten:shorten@localhost:5432/shorten';
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations completed.');
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed');
  console.error(err);
  process.exit(1);
});
