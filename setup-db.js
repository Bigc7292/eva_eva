const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // First, connect to the default postgres database to create our database
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: 'postgres',
    port: 5432,
    database: 'postgres'
  });

  try {
    await client.connect();

    // Check if database exists
    const checkDbResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'call_dashboard'"
    );

    // Create database if it doesn't exist
    if (checkDbResult.rows.length === 0) {
      console.log('Creating database call_dashboard...');
      await client.query('CREATE DATABASE call_dashboard');
      console.log('Database created successfully!');
    } else {
      console.log('Database call_dashboard already exists.');
    }
  } catch (error) {
    console.error('Error creating database:', error);
    return;
  } finally {
    await client.end();
  }

  // Now connect to our new database and run the setup script
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'postgres',
    port: 5432,
    database: 'call_dashboard'
  });

  try {
    // Read the SQL file
    const sqlScript = fs.readFileSync(path.join(__dirname, 'db_setup.sql'), 'utf8');

    // Connect to the database
    const dbClient = await pool.connect();

    try {
      console.log('Executing SQL script...');
      await dbClient.query(sqlScript);
      console.log('Database setup completed successfully!');
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error('Error setting up database schema:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
