package repository

import (
	"backend/internal/domain/entity"
	"errors"
	"gorm.io/gorm"
	"time"
)

type PostgresCartRepository struct {
	DB *gorm.DB
}

// FindActiveCartByUserID finds the active cart for a user
func (r *PostgresCartRepository) FindActiveCartByUserID(userID uint) (*entity.Cart, error) {
	var cart entity.Cart
	err := r.DB.Where("user_id = ? AND active = true", userID).First(&cart).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // No active cart found
		}
		return nil, err
	}

	// Get cart items
	items, err := r.GetCartItems(cart.ID)
	if err != nil {
		return nil, err
	}
	cart.CartItems = items

	return &cart, nil
}

// CreateCart creates a new cart for a user
func (r *PostgresCartRepository) CreateCart(userID uint) (*entity.Cart, error) {
	cart := &entity.Cart{
		UserID: userID,
		Active: true,
	}

	err := r.DB.Create(cart).Error
	if err != nil {
		return nil, err
	}

	return cart, nil
}

// AddItem adds a product to a cart
func (r *PostgresCartRepository) AddItem(cartID uint, productID uint, quantity int) error {
	var cartItem entity.CartItem
	err := r.DB.Where("cart_id = ? AND product_id = ?", cartID, productID).First(&cartItem).Error

	now := time.Now()
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Insert new item
		cartItem = entity.CartItem{
			CartID:    cartID,
			ProductID: productID,
			Quantity:  quantity,
		}
		return r.DB.Create(&cartItem).Error
	} else if err == nil {
		// Update quantity
		cartItem.Quantity += quantity
		cartItem.UpdatedAt = now
		return r.DB.Save(&cartItem).Error
	}

	return err
}

// UpdateItemQuantity updates the quantity of a cart item
func (r *PostgresCartRepository) UpdateItemQuantity(cartItemID uint, quantity int) error {
	if quantity <= 0 {
		return r.RemoveItem(cartItemID)
	}

	return r.DB.Model(&entity.CartItem{}).Where("id = ?", cartItemID).Updates(map[string]interface{}{
		"quantity":   quantity,
		"updated_at": time.Now(),
	}).Error
}

// RemoveItem removes an item from a cart
func (r *PostgresCartRepository) RemoveItem(cartItemID uint) error {
	return r.DB.Delete(&entity.CartItem{}, cartItemID).Error
}

// GetCartItems gets all items in a cart
func (r *PostgresCartRepository) GetCartItems(cartID uint) ([]entity.CartItem, error) {
	var items []entity.CartItem
	err := r.DB.Preload("Product").Where("cart_id = ?", cartID).Find(&items).Error
	return items, err
}

// CloseCart marks a cart as inactive (completed order)
func (r *PostgresCartRepository) CloseCart(cartID uint) error {
	return r.DB.Model(&entity.Cart{}).Where("id = ?", cartID).Updates(map[string]interface{}{
		"active":     false,
		"updated_at": time.Now(),
	}).Error
}
