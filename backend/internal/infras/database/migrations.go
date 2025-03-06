package database

import (
	"database/sql"
	"log"
)

// RunMigrations runs all database migrations
func RunMigrations(db *sql.DB) {
	// Run migrations in order
	createUsersTable(db)
	createProductsTable(db)
	createCartsTable(db)
	createCartItemsTable(db)
}

// createUsersTable creates the users table if it doesn't exist
func createUsersTable(db *sql.DB) {
	query := `CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		google_id VARCHAR(255) NOT NULL,
		email VARCHAR(255) NOT NULL UNIQUE,
		name VARCHAR(255) NOT NULL,
		picture TEXT,
		created_at TIMESTAMP NOT NULL,
		updated_at TIMESTAMP NOT NULL
	)`

	_, err := db.Exec(query)
	if err != nil {
		log.Fatalf("Error creating users table: %v", err)
	}
}

// createProductsTable creates the products table if it doesn't exist
func createProductsTable(db *sql.DB) {
	query := `CREATE TABLE IF NOT EXISTS products (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		price DECIMAL(10, 2) NOT NULL,
		image_url TEXT,
		stock INT NOT NULL DEFAULT 0,
		created_at TIMESTAMP NOT NULL,
		updated_at TIMESTAMP NOT NULL,
		deleted_at TIMESTAMP
	)`

	_, err := db.Exec(query)
	if err != nil {
		log.Fatalf("Error creating products table: %v", err)
	}
}

// createCartsTable creates the carts table if it doesn't exist
func createCartsTable(db *sql.DB) {
	query := `CREATE TABLE IF NOT EXISTS carts (
		id SERIAL PRIMARY KEY,
		user_id INT NOT NULL,
		active BOOLEAN NOT NULL DEFAULT TRUE,
		created_at TIMESTAMP NOT NULL,
		updated_at TIMESTAMP NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(id)
	)`

	_, err := db.Exec(query)
	if err != nil {
		log.Fatalf("Error creating carts table: %v", err)
	}
}

// createCartItemsTable creates the cart_items table if it doesn't exist
func createCartItemsTable(db *sql.DB) {
	query := `CREATE TABLE IF NOT EXISTS cart_items (
		id SERIAL PRIMARY KEY,
		cart_id INT NOT NULL,
		product_id INT NOT NULL,
		quantity INT NOT NULL DEFAULT 1,
		created_at TIMESTAMP NOT NULL,
		updated_at TIMESTAMP NOT NULL,
		FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
		FOREIGN KEY (product_id) REFERENCES products(id),
		UNIQUE (cart_id, product_id)
	)`

	_, err := db.Exec(query)
	if err != nil {
		log.Fatalf("Error creating cart_items table: %v", err)
	}
}
