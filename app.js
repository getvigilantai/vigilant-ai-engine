// Import required packages
require("dotenv").config();
const express = require("express");
const { Client } = require("pg");

// --- Configuration ---
const PORT = process.env.PORT || 8080;

// --- Database Client Setup ---
// The DATABASE_URL is provided by the docker-compose.yml environment variables
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
});

// --- Express App Setup ---
const app = express();

// A simple root route to check if the server is running
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "Vigilant AI Engine is running." });
});

// --- Main Application Logic ---
const startServer = async () => {
  try {
    // Connect to the PostgreSQL database
    await dbClient.connect();
    console.log("✅ Successfully connected to PostgreSQL database.");

    // Start the Express server after the database connection is successful
    app.listen(PORT, () => {
      console.log(`🚀 Vigilant AI Engine is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database or start the server.");
    console.error(error);
    // Exit the process with an error code if we can't connect to the DB
    process.exit(1);
  }
};

// --- Start the Application ---
startServer();
