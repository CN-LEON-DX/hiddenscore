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
	now := time.Now()
	product.CreatedAt = now
	product.UpdatedAt = now
	return r.DB.Create(product).Error
}

func (r *ProductRepository) SearchProducts(products *[]entity.Product, filter interfaces.ProductFilter) error {
	query := r.DB.Model(&entity.Product{})

	if filter.Name != "" {
		query = query.Where("name ILIKE ?", "%"+filter.Name+"%")
	}
	if filter.MinPrice > 0 {
		query = query.Where("price >= ?", filter.MinPrice)
	}
	if filter.MaxPrice > 0 {
		query = query.Where("price <= ?", filter.MaxPrice)
	}

	err := query.Find(&products).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *ProductRepository) FindByID(id uint) (*entity.Product, error) {
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
