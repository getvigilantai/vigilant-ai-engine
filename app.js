// app.js - Vigilant AI Engine Core Logic

// --- 1. SETUP AND CONFIGURATION ---

// Load environment variables from our .env file
require("dotenv").config();

// Import necessary Node.js modules
const http = require("http"); // For the health-check server
const fs = require("fs").promises; // For promise-based file system operations
const { Pool } = require("pg"); // For connecting to PostgreSQL

// Define the monitoring interval in milliseconds.
// We'll check assets every 5 seconds for this demonstration.
const MONITORING_INTERVAL_MS = 5000;

// Create a new PostgreSQL connection pool.
// The pool manages multiple connections efficiently.
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  // IMPORTANT: The hostname is the name of our database service in docker-compose.yml
  host: "db",
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432, // This is the internal port inside the Docker network
});

// --- 2. THE CORE MONITORING LOGIC ---

/**
 * Checks if a file or directory exists at the given path.
 * @param {string} path The path to check.
 * @returns {Promise<boolean>} True if the path exists, false otherwise.
 */
async function pathExists(path) {
  try {
    // fs.access checks for the existence and/or permissions of a file.
    // If it fails, it throws an error.
    await fs.access(path);
    return true;
  } catch (error) {
    // If the error code is 'ENOENT' (Error NO ENTry), it means the file doesn't exist.
    if (error.code === "ENOENT") {
      return false;
    }
    // For other errors (like permission denied), we'll re-throw them.
    throw error;
  }
}

/**
 * The main monitoring loop that runs continuously.
 */
const monitoringLoop = async () => {
  console.log("--- Starting monitoring cycle ---");
  let client;

  try {
    // Get a client from the connection pool
    client = await pool.connect();

    // Query the database for all assets that are currently 'active'
    const query = "SELECT * FROM monitored_assets WHERE status = 'active'";
    const { rows: activeAssets } = await client.query(query);

    console.log(`Found ${activeAssets.length} active asset(s) to check.`);

    // Loop through each active asset and check its status
    for (const asset of activeAssets) {
      const exists = await pathExists(asset.path);
      if (exists) {
        console.log(`[OK] Asset '${asset.name}' exists at path: ${asset.path}`);
      } else {
        console.log(
          `[ALERT] Asset '${asset.name}' NOT FOUND at path: ${asset.path}`
        );
        // In the future, we could trigger an alert or update the database here.
      }
    }
  } catch (error) {
    console.error(
      "❌ An error occurred during the monitoring cycle:",
      error.stack
    );
  } finally {
    if (client) {
      // VERY IMPORTANT: Release the client back to the pool so it can be reused.
      client.release();
    }
    // Schedule the next run of the loop after the specified interval.
    // This is safer than a while(true) loop with a sleep, as it waits for
    // the current cycle to finish (or fail) before scheduling the next one.
    setTimeout(monitoringLoop, MONITORING_INTERVAL_MS);
    console.log(
      `--- Monitoring cycle complete. Next check in ${
        MONITORING_INTERVAL_MS / 1000
      } seconds. ---`
    );
  }
};

// --- 3. THE HEALTH-CHECK WEB SERVER ---

// This server's only job is to respond that the engine is alive.
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      message: "Vigilant AI Engine is running.",
    })
  );
});

const PORT = 8080; // The internal port inside the container
server.listen(PORT, () => {
  console.log(
    `Vigilant AI Engine health-check server listening on port ${PORT}`
  );

  // --- 4. START THE ENGINE ---
  // Kick off the monitoring loop for the first time.
  monitoringLoop();
});
