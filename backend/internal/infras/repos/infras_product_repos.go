package repository

import (
	"backend/internal/domain/entity"
	"database/sql"
	"errors"
	"time"
)

type PostgresProductRepository struct {
	DB *sql.DB
}

func (r *PostgresProductRepository) Create(product *entity.Product) error {
	now := time.Now()

	stmt, err := r.DB.Prepare("INSERT INTO products (name, description, price, image_url, stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id")
	if err != nil {
		return err
	}

	var id uint
	err = stmt.QueryRow(product.Name, product.Description, product.Price, product.ImageURL, product.Stock, now, now).Scan(&id)
	if err != nil {
		return err
	}

	product.ID = id
	product.CreatedAt = now
	product.UpdatedAt = now

	return nil
}

func (r *PostgresProductRepository) FindByID(id uint) (*entity.Product, error) {
	var product entity.Product
	var createdAt, updatedAt time.Time

	err := r.DB.QueryRow("SELECT id, name, description, price, image_url, stock, created_at, updated_at FROM products WHERE id = $1", id).
		Scan(&product.ID, &product.Name, &product.Description, &product.Price, &product.ImageURL, &product.Stock, &createdAt, &updatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("product not found")
		}
		return nil, err
	}

	product.CreatedAt = createdAt
	product.UpdatedAt = updatedAt

	return &product, nil
}

func (r *PostgresProductRepository) FindAll() ([]entity.Product, error) {
	rows, err := r.DB.Query("SELECT id, name, description, price, image_url, stock, created_at, updated_at FROM products")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []entity.Product
	for rows.Next() {
		var product entity.Product
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&product.ID, &product.Name, &product.Description, &product.Price, &product.ImageURL, &product.Stock, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		product.CreatedAt = createdAt
		product.UpdatedAt = updatedAt
		products = append(products, product)
	}
	return products, nil
}

func (r *PostgresProductRepository) Update(product *entity.Product) error {
	now := time.Now()

	_, err := r.DB.Exec(
		"UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, stock = $5, updated_at = $6 WHERE id = $7",
		product.Name, product.Description, product.Price, product.ImageURL, product.Stock, now, product.ID,
	)

	if err != nil {
		return err
	}

	product.UpdatedAt = now
	return nil
}

func (r *PostgresProductRepository) Delete(id uint) error {
	_, err := r.DB.Exec("DELETE FROM products WHERE id = $1", id)
	return err
}
