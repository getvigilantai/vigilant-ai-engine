// test-insert.js

// Load environment variables from our .env file
require("dotenv").config();

// Import the 'Pool' class from the 'pg' library.
const { Pool } = require("pg");

// Create a new Pool instance. The connection details are the same as before.
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: "localhost",
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5433,
});

// --- The Core Logic ---

// 1. Define the data for the asset we want to insert.
const assetToInsert = {
  name: "Quarterly Sales Report",
  path: "/mnt/data/reports/quarterly_sales.csv",
  // We don't need to specify status, created_at, or updated_at,
  // as the database will handle them with default values.
};

// 2. Define the SQL query for inserting data.
//    IMPORTANT: We use parameterized queries ($1, $2) to prevent SQL injection.
//    This is a critical security practice. The 'pg' library will safely
//    substitute the values from the 'values' array into the query.
const insertQuery = `
  INSERT INTO monitored_assets(name, path)
  VALUES($1, $2)
  RETURNING *; -- 'RETURNING *' asks the database to return the full row that was just inserted.
`;

// 3. Create an array of values that correspond to the parameters ($1, $2).
const values = [assetToInsert.name, assetToInsert.path];

// We define an async function to run our query.
const insertAsset = async () => {
  let client;
  try {
    console.log("Connecting to the database to insert a new asset...");
    client = await pool.connect();
    console.log("Database connected.");

    // Execute the query with the specified values.
    const result = await client.query(insertQuery, values);

    console.log("✅ Asset inserted successfully!");
    console.log("Inserted Data:");
    // The inserted row data will be in result.rows[0]
    console.log(result.rows[0]);
  } catch (err) {
    // If the asset 'name' already exists, the UNIQUE constraint will cause an error.
    // This is expected behavior and good for data integrity.
    console.error("❌ Error inserting asset:", err.message);
    if (err.code === "23505") {
      // '23505' is the PostgreSQL error code for unique_violation
      console.error(
        'Hint: This error is likely because an asset with this "name" already exists in the table.'
      );
    }
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
insertAsset();
