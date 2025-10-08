// test-read.js

// Load environment variables from our .env file
require("dotenv").config();

// Import the 'Pool' class from the 'pg' library.
const { Pool } = require("pg");

// Create a new Pool instance.
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: "localhost",
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5433,
});

// --- The Core Logic ---

// The SQL query to select all columns (*) from the monitored_assets table.
// ORDER BY asset_id ASC ensures the results are always in a predictable order.
const selectQuery = "SELECT * FROM monitored_assets ORDER BY asset_id ASC;";

// We define an async function to run our query.
const readAssets = async () => {
  let client;
  try {
    console.log("Connecting to the database to read assets...");
    client = await pool.connect();
    console.log("Database connected.");

    // Execute the SELECT query.
    const result = await client.query(selectQuery);

    // Check if the query returned any rows.
    if (result.rows.length === 0) {
      console.log("🟡 No assets found in the database.");
    } else {
      console.log("✅ Assets found in the database:");
      // console.table is a fantastic way to display an array of objects in a clean, tabular format.
      console.table(result.rows);
    }
  } catch (err) {
    console.error("❌ Error reading assets:", err.stack);
  } finally {
    if (client) {
      client.release();
      console.log("Database client released.");
    }
    await pool.end();
    console.log("Database pool closed.");
  }
};

// Run the main function.
readAssets();
