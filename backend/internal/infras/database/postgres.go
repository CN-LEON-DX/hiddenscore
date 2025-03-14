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

	host := os.Getenv("POSTGRES_HOST")
	dbname := os.Getenv("POSTGRES_DB")
	user := os.Getenv("POSTGRES_USER")
	port := os.Getenv("POSTGRES_PORT")
	password := os.Getenv("POSTGRES_PASSWORD")

	// Check if all required connection parameters are set
	if host == "" || dbname == "" || user == "" || port == "" || password == "" {
		return nil, fmt.Errorf("missing database connection parameters")
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s", host, user, password, dbname, port)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("database connection error: %w", err)
	}

	// Test connection
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("error getting SQL DB: %w", err)
	}

	err = sqlDB.Ping()
	if err != nil {
		return nil, fmt.Errorf("database ping error: %w", err)
	}

	// Auto migrate to update schema
	if err := db.AutoMigrate(&entity.User{}); err != nil {
		log.Printf("Error auto migrating: %v", err)
	}

	return db, nil
}
