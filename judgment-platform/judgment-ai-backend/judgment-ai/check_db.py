import sqlite3

def check_database():
    print("\n--- Checking SQLite Database ---")
    try:
        conn = sqlite3.connect('judgment_platform.db')
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("Database exists but has no tables yet.")
            return
            
        print(f"Found {len(tables)} tables:\n")
        
        for table in tables:
            table_name = table[0]
            # Count rows in each table
            cursor.execute(f"SELECT count(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"✅ Table: {table_name:<20} | Rows saved: {count}")
            
    except Exception as e:
        print(f"Error reading database: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_database()
