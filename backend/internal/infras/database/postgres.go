package database

import (
	"backend/internal/domain/entity"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() (*gorm.DB, error) {
	err := godotenv.Load()
	if err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	// First check for DATABASE_URL (used by Heroku)
	databaseURL := os.Getenv("DATABASE_URL")

	var db *gorm.DB

	if databaseURL != "" {
		// Use the DATABASE_URL if available
		var err error
		db, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
		if err != nil {
			return nil, fmt.Errorf("database connection error using DATABASE_URL: %w", err)
		}
	} else {
		// Fall back to individual connection parameters
		host := os.Getenv("POSTGRES_HOST")
		dbname := os.Getenv("POSTGRES_DB")
		user := os.Getenv("POSTGRES_USER")
		port := os.Getenv("POSTGRES_PORT")
		password := os.Getenv("POSTGRES_PASSWORD")

		if host == "" || dbname == "" || user == "" || port == "" || password == "" {
			return nil, fmt.Errorf("missing database connection parameters")
		}

		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s", host, user, password, dbname, port)
		var err error
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			return nil, fmt.Errorf("database connection error: %w", err)
		}
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("error getting SQL DB: %w", err)
	}

	err = sqlDB.Ping()
	if err != nil {
		return nil, fmt.Errorf("database ping error: %w", err)
	}

	if err := db.AutoMigrate(&entity.User{}); err != nil {
		log.Printf("Error auto migrating: %v", err)
	}

	return db, nil
}
