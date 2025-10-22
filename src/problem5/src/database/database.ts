import sqlite3 from 'sqlite3';
import path from 'path';

/**
 * Database connection module using SQLite
 * Provides a singleton database instance for the application
 */
class Database {
  private static instance: Database;
  private db: sqlite3.Database;

  private constructor() {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
    
    this.db = new sqlite3.Database(dbPath, (err: Error | null) => {
      if (err) {
        console.error('Error opening database:', err.message);
        throw err;
      }
      console.log('Connected to SQLite database');
    });

    this.initialize();
  }

  /**
   * Get singleton instance of Database
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Get the database connection
   */
  public getDb(): sqlite3.Database {
    return this.db;
  }

  /**
   * Initialize database schema
   * Creates the resources table if it doesn't exist
   */
  private initialize(): void {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createTableQuery, (err: Error | null) => {
      if (err) {
        console.error('Error creating table:', err.message);
        throw err;
      }
      console.log('Resources table ready');
    });
  }

  /**
   * Close database connection
   */
  public close(): void {
    this.db.close((err: Error | null) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

export default Database;
