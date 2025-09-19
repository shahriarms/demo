
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local file if it exists
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// This script is intended to be run from the host machine to set up the DB inside the Docker container.
// It should ALWAYS connect to localhost, as the port is mapped in docker-compose.yml.
// If POSTGRES_URL is set for a different remote DB, it will be used, otherwise, it defaults to the local Docker setup.
const connectionString = 'postgresql://user:password@localhost:5432/stockpilot_db';

const pool = new Pool({
  connectionString,
});

async function setupDatabase() {
  console.log('🔵 Attempting to connect to the database at localhost:5432...');
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to the database successfully.');

    // Drop the table if it exists to ensure a fresh start with the correct schema
    await client.query('DROP TABLE IF EXISTS products;');
    console.log("✅ Table 'products' dropped if it existed.");

    // Create the products table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
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
      );
    `;
    await client.query(createTableQuery);
    console.log("✅ Table 'products' created successfully.");

    // You can add more table creation queries here in the future
    // For example:
    // await client.query(`CREATE TABLE IF NOT EXISTS invoices (...)`);
    // console.log("✅ Table 'invoices' created or already exists.");

  } catch (err) {
    if (err instanceof Error) {
        console.error('🔴 Error setting up the database:', err.message);
        console.error('\n🔴 PLEASE ENSURE THAT DOCKER CONTAINERS ARE RUNNING.');
        console.error('Run `docker-compose up -d` in your project root and try again.');
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
