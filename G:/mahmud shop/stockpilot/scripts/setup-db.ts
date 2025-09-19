
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local file if it exists
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// The connection string depends on where the script is being run.
// Inside the Docker container (via npm run db:setup:internal), it uses the service name 'db'.
// If run directly on the host (for other potential dev scenarios), it uses 'localhost'.
const connectionString = process.env.POSTGRES_URL || 'postgresql://user:password@localhost:5432/stockpilot_db';

const pool = new Pool({
  connectionString,
});

const tableCreationQueries = [
  `DROP TABLE IF EXISTS products CASCADE;
   CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      "buyingPrice" NUMERIC(10, 2) NOT NULL,
      "profitMargin" NUMERIC(5, 2) NOT NULL,
      "sellingPrice" NUMERIC(10, 2) NOT NULL,
      stock INTEGER NOT NULL,
      "mainCategory" TEXT NOT NULL,
      category TEXT NOT NULL,
      "subCategory" TEXT NOT NULL
   );`,
  `DROP TABLE IF EXISTS employees CASCADE;
   CREATE TABLE employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      role TEXT NOT NULL,
      salary NUMERIC(10, 2) NOT NULL,
      joining_date DATE NOT NULL
   );`,
  `DROP TABLE IF EXISTS expenses CASCADE;
   CREATE TABLE expenses (
      id TEXT PRIMARY KEY,
      main_category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      amount NUMERIC(10, 2) NOT NULL,
      date TIMESTAMPTZ NOT NULL
   );`,
  `DROP TABLE IF EXISTS buyers CASCADE;
   CREATE TABLE buyers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      invoice_ids JSONB
   );`,
  `DROP TABLE IF EXISTS invoices CASCADE;
   CREATE TABLE invoices (
      id SERIAL PRIMARY KEY,
      buyer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_address TEXT,
      customer_phone TEXT,
      items JSONB NOT NULL,
      subtotal NUMERIC(10, 2) NOT NULL,
      paid_amount NUMERIC(10, 2) NOT NULL,
      due_amount NUMERIC(10, 2) NOT NULL,
      date TIMESTAMPTZ NOT NULL
   );`,
   `DROP TABLE IF EXISTS payments CASCADE;
   CREATE TABLE payments (
      id TEXT PRIMARY KEY,
      invoice_id INTEGER NOT NULL,
      buyer_id TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      date TIMESTAMPTZ NOT NULL
   );`,
   `DROP TABLE IF EXISTS salary_payments CASCADE;
    CREATE TABLE salary_payments (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        paid_by TEXT NOT NULL
    );`,
    `DROP TABLE IF EXISTS attendance CASCADE;
     CREATE TABLE attendance (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL
     );`
];


async function setupDatabase() {
  console.log('🔵 Attempting to connect to the database...');
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to the database successfully.');

    for (const query of tableCreationQueries) {
      const tableNameMatch = query.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/);
      const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown table';
      await client.query(query);
      console.log(`✅ Table '${tableName}' created successfully.`);
    }

  } catch (err) {
    if (err instanceof Error) {
        console.error('🔴 Error setting up the database:', err.message);
        console.error('\n🔴 PLEASE ENSURE THAT DOCKER CONTAINERS ARE RUNNING. Run `docker-compose up -d` in your project root and try again.');
    } else {
        console.error('🔴 An unknown error occurred:', err);
    }
    process.exit(1); // Exit with error code
  } finally {
    if (client) {
        await client.release();
    }
    await pool.end();
    console.log('✅ Database setup complete. Connection closed.');
  }
}

setupDatabase();
