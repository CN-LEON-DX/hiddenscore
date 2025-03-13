package repository

import (
	"backend/internal/domain/entity"
	"errors"
	"gorm.io/gorm"
	"time"
)

type PostgresProductRepository struct {
	DB *gorm.DB
}

func (r *PostgresProductRepository) GetAllProducts(products *[]entity.Product) error {
	return r.DB.Find(products).Error
}

func (r *PostgresProductRepository) Create(product *entity.Product) error {
	now := time.Now()
	product.CreatedAt = now
	product.UpdatedAt = now
	return r.DB.Create(product).Error
}

func (r *PostgresProductRepository) FindByID(id uint) (*entity.Product, error) {
	var product entity.Product
	err := r.DB.First(&product, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("product not found")
		}
		return nil, err
	}
	return &product, nil
}

func (r *PostgresProductRepository) FindAll() ([]entity.Product, error) {
	var products []entity.Product
	err := r.DB.Find(&products).Error
	return products, err
}

func (r *PostgresProductRepository) Update(product *entity.Product) error {
	product.UpdatedAt = time.Now()
	return r.DB.Save(product).Error
}

func (r *PostgresProductRepository) Delete(id uint) error {
	return r.DB.Delete(&entity.Product{}, id).Error
}
