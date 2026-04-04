import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    console.log('Initializing database schema...');
    await client.query(schema);
    console.log('✓ Database initialized successfully');
    console.log('Seed users available: admin1, analyst1, analyst2, viewer1');
    console.log('Default seeded password: ChangeMe123! (change after first login)');
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
