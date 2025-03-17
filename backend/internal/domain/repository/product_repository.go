package repository

import (
	"backend/internal/domain/entity"
	"backend/internal/infras/interfaces"
)

type ProductRepository interface {
	SearchProducts(product *[]entity.Product, filter interfaces.ProductFilter) error
	GetAllProducts(products *[]entity.Product) error
	Create(product *entity.Product) error
	FindByID(id uint) (*entity.Product, error)
	FindAll() ([]entity.Product, error)
	Update(product *entity.Product) error
	Delete(id uint) error

	// Thêm các phương thức cho admin
	CreateProduct(product entity.Product) (*entity.Product, error)
	UpdateProduct(product entity.Product) (*entity.Product, error)
	DeleteProduct(id uint) error
	CountProducts() (int64, error)
}
