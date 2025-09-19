
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// This script is intended to be run from the host machine to set up the DB inside the Docker container.
// Therefore, it should always connect to localhost.
// The docker-compose.yml file maps the host's port 5432 to the container's port 5432.
const connectionString = 'postgresql://user:password@localhost:5432/stockpilot_db';

const pool = new Pool({
  connectionString,
});

async function setupDatabase() {
  console.log('🔵 Attempting to connect to the database at localhost:5432...');
  const client = await pool.connect();
  console.log('✅ Connected to the database.');

  try {
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
        console.error('🔴 Error setting up the database:', err.stack);
        console.error('\n🔴 Please ensure the Docker containers are running (`docker-compose up -d`).');
    } else {
        console.error('🔴 An unknown error occurred:', err);
    }
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
    console.log('✅ Database setup complete. Connection closed.');
  }
}

setupDatabase();
