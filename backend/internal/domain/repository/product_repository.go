package repository

import (
	"backend/internal/domain/entity"
)

type ProductRepository interface {
	GetAllProducts(products *[]entity.Product) error
	Create(product *entity.Product) error
	FindByID(id uint) (*entity.Product, error)
	FindAll() ([]entity.Product, error)
	Update(product *entity.Product) error
	Delete(id uint) error
}
