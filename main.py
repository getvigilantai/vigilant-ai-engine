# engine/main.py

import os
import time
import psycopg2
import hashlib  # <-- Import the hashlib library
from psycopg2 import extras

# --- Database Connection Details ---
DB_HOST = "db"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "postgres"

def get_db_connection():
    """Establishes and returns a connection to the database."""
    while True:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
            print("Database connection established successfully.")
            return conn
        except psycopg2.OperationalError as e:
            print(f"Could not connect to database: {e}. Retrying in 5 seconds...")
            time.sleep(5)

# --- NEW FUNCTION: MD5 Calculation ---
def calculate_md5(file_path):
    """Calculates the MD5 hash of a file."""
    hash_md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            # Read the file in chunks to handle large files efficiently
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return None
    except Exception as e:
        print(f"An error occurred during MD5 calculation for {file_path}: {e}")
        return None

def main():
    """Main monitoring loop."""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=extras.DictCursor)

    while True:
        print("--- Starting monitoring cycle ---")
        try:
            # Find one active and pending asset
            cursor.execute(
                "SELECT * FROM assets WHERE is_active = TRUE AND status = 'pending' ORDER BY created_at LIMIT 1"
            )
            asset = cursor.fetchone()

            if asset:
                print(f"Found {cursor.rowcount} pending asset(s) to check.")
                asset_id = asset['id']
                file_path = asset['file_path']
                print(f"Processing asset ID {asset_id}: {file_path}")

                # --- NEW LOGIC: Calculate hash ---
                md5_hash = calculate_md5(file_path)

                if md5_hash:
                    print(f"Calculated MD5: {md5_hash}")
                    # --- UPDATED QUERY: Store the hash ---
                    cursor.execute(
                        "UPDATE assets SET status = 'complete', md5_hash = %s WHERE id = %s",
                        (md5_hash, asset_id)
                    )
                    conn.commit()
                    print(f"Asset ID {asset_id} marked as 'complete' with its new hash.")
                else:
                    # If hashing failed, mark as 'error'
                    print(f"Failed to calculate MD5 for asset ID {asset_id}. Marking as 'error'.")
                    cursor.execute(
                        "UPDATE assets SET status = 'error' WHERE id = %s",
                        (asset_id,)
                    )
                    conn.commit()

            else:
                print("Found 0 pending asset(s) to check.")

        except (psycopg2.Error, psycopg2.OperationalError) as e:
            print(f"A database error occurred: {e}")
            print("Attempting to reconnect...")
            conn.close()
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=extras.DictCursor)
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            # In case of other errors, we wait before retrying.
            time.sleep(5)

        print(f"--- Monitoring cycle complete. Next check in 5 seconds. ---")
        time.sleep(5)

if __name__ == "__main__":
    main()