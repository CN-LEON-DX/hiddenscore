package repos

import (
	"backend/internal/domain/entity"
	"backend/internal/infras/interfaces"
	"errors"
	"time"

	"gorm.io/gorm"
)

type ProductRepository struct {
	DB *gorm.DB
}

func (r *ProductRepository) GetAllProducts(products *[]entity.Product) error {
	return r.DB.Find(products).Error
}

func (r *ProductRepository) Create(product *entity.Product) error {
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	return r.DB.Create(product).Error
}

func (r *ProductRepository) SearchProducts(products *[]entity.Product, filter interfaces.ProductFilter) error {
	query := r.DB

	if filter.Name != "" {
		query = query.Where("name LIKE ?", "%"+filter.Name+"%")
	}

	if filter.Description != "" {
		query = query.Where("description LIKE ?", "%"+filter.Description+"%")
	}

	if filter.MinPrice > 0 {
		query = query.Where("price >= ?", filter.MinPrice)
	}

	if filter.MaxPrice > 0 {
		query = query.Where("price <= ?", filter.MaxPrice)
	}

	return query.Find(products).Error
}

func (r *ProductRepository) FindByID(id uint) (*entity.Product, error) {
	var product entity.Product
	result := r.DB.First(&product, id)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("product not found")
		}
		return nil, result.Error
	}

	return &product, nil
}

func (r *ProductRepository) FindAll() ([]entity.Product, error) {
	var products []entity.Product
	err := r.DB.Find(&products).Error
	return products, err
}

func (r *ProductRepository) Update(product *entity.Product) error {
	product.UpdatedAt = time.Now()
	return r.DB.Save(product).Error
}

func (r *ProductRepository) Delete(id uint) error {
	return r.DB.Delete(&entity.Product{}, id).Error
}

// CreateProduct tạo mới một sản phẩm
func (r *ProductRepository) CreateProduct(product entity.Product) (*entity.Product, error) {
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	err := r.DB.Create(&product).Error
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// UpdateProduct cập nhật thông tin sản phẩm
func (r *ProductRepository) UpdateProduct(product entity.Product) (*entity.Product, error) {
	product.UpdatedAt = time.Now()

	err := r.DB.Save(&product).Error
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// DeleteProduct xóa sản phẩm theo ID
func (r *ProductRepository) DeleteProduct(id uint) error {
	return r.DB.Delete(&entity.Product{}, id).Error
}

// CountProducts đếm tổng số sản phẩm
func (r *ProductRepository) CountProducts() (int64, error) {
	var count int64
	result := r.DB.Model(&entity.Product{}).Count(&count)
	return count, result.Error
}
