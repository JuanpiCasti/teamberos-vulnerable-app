package database

import (
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sqlx.DB

// InitDB initializes the SQLite database connection and creates tables
func InitDB(dbPath string) error {
	var err error
	DB, err = sqlx.Connect("sqlite3", dbPath)
	if err != nil {
		return err
	}

	// Set connection pool settings
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)

	// Create tables
	if err := createTables(); err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

// createTables creates all necessary tables for the casino application
func createTables() error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'player',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS balances (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL UNIQUE,
		amount REAL NOT NULL DEFAULT 1000.0,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS bets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		bet_type TEXT NOT NULL,
		bet_value TEXT NOT NULL,
		bet_amount REAL NOT NULL,
		game_token TEXT NOT NULL UNIQUE,
		winning_number TEXT,
		winning_color TEXT,
		result TEXT NOT NULL,
		payout REAL NOT NULL DEFAULT 0.0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
	CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at);
	CREATE INDEX IF NOT EXISTS idx_bets_game_token ON bets(game_token);

	CREATE TABLE IF NOT EXISTS password_reset_tokens (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		token TEXT NOT NULL UNIQUE,
		email TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

	-- A04: Race Condition Vulnerability - Token tracking table
	-- This table tracks which game tokens have been credited
	-- VULNERABLE: Queries check this table WITHOUT locks, allowing race conditions
	CREATE TABLE IF NOT EXISTS game_token_credits (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		game_token TEXT NOT NULL UNIQUE,
		user_id INTEGER NOT NULL,
		bet_id INTEGER NOT NULL,
		amount REAL NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_game_token_credits_token ON game_token_credits(game_token);
	CREATE INDEX IF NOT EXISTS idx_game_token_credits_user_id ON game_token_credits(user_id);
	`

	_, err := DB.Exec(schema)
	return err
}

// CloseDB closes the database connection
func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
