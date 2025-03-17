package repos

import (
	"backend/internal/domain/entity"
	domainrepo "backend/internal/domain/repository"
	"errors"
	"time"

	"gorm.io/gorm"
)

type CartRepository struct {
	DB *gorm.DB
}

// FindActiveCartByUserID finds the active cart for a user
func (r *CartRepository) FindActiveCartByUserID(userID uint) (*entity.Cart, error) {
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
func (r *CartRepository) CreateCart(userID uint) (*entity.Cart, error) {
	cart := &entity.Cart{
		UserID: userID,
		Status: 1, // Using integer status (1 = active)
		Active: true,
	}

	err := r.DB.Create(cart).Error
	if err != nil {
		return nil, err
	}

	return cart, nil
}

// AddItem adds a product to a cart
func (r *CartRepository) AddItem(cartID uint, productID uint, quantity int) error {
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
func (r *CartRepository) UpdateItemQuantity(cartItemID uint, quantity int) error {
	if quantity <= 0 {
		return r.RemoveItem(cartItemID)
	}

	return r.DB.Model(&entity.CartItem{}).Where("id = ?", cartItemID).Updates(map[string]interface{}{
		"quantity":   quantity,
		"updated_at": time.Now(),
	}).Error
}

// RemoveItem removes an item from a cart
func (r *CartRepository) RemoveItem(cartItemID uint) error {
	return r.DB.Delete(&entity.CartItem{}, cartItemID).Error
}

// GetCartItems gets all items in a cart
func (r *CartRepository) GetCartItems(cartID uint) ([]entity.CartItem, error) {
	var items []entity.CartItem
	err := r.DB.Preload("Product").Where("cart_id = ?", cartID).Find(&items).Error
	return items, err
}

// CloseCart marks a cart as inactive (completed order)
func (r *CartRepository) CloseCart(cartID uint) error {
	return r.DB.Model(&entity.Cart{}).Where("id = ?", cartID).Updates(map[string]interface{}{
		"active":     false,
		"status":     2, // 2 = completed
		"updated_at": time.Now(),
	}).Error
}

// GetCartItemsWithProductDetails gets cart items with product details
func (r *CartRepository) GetCartItemsWithProductDetails(cartID uint) ([]domainrepo.CartItemWithProduct, error) {
	var cartItems []entity.CartItem
	var result []domainrepo.CartItemWithProduct

	// Get cart items with their associated products
	if err := r.DB.Where("cart_id = ?", cartID).Preload("Product").Find(&cartItems).Error; err != nil {
		return nil, err
	}

	// Map to the domain repository type
	for _, item := range cartItems {
		// Calculate subtotal
		subtotal := float64(item.Quantity) * item.Product.Price

		// Create cart item with product
		itemWithProduct := domainrepo.CartItemWithProduct{
			ID:       item.ID,
			CartID:   item.CartID,
			Product:  item.Product,
			Quantity: item.Quantity,
			Subtotal: subtotal,
		}

		result = append(result, itemWithProduct)
	}

	return result, nil
}

// GetAllCompletedCarts trả về danh sách tất cả đơn hàng đã hoàn thành
func (r *CartRepository) GetAllCompletedCarts() ([]entity.Cart, error) {
	var carts []entity.Cart
	err := r.DB.Where("active = false").Preload("User").Find(&carts).Error
	return carts, err
}

// GetCartWithItems trả về thông tin chi tiết của một đơn hàng bao gồm các sản phẩm
func (r *CartRepository) GetCartWithItems(cartID uint) (*entity.Cart, error) {
	var cart entity.Cart
	err := r.DB.Preload("User").Preload("CartItems.Product").First(&cart, cartID).Error
	if err != nil {
		return nil, err
	}
	return &cart, nil
}

// UpdateCartStatus cập nhật trạng thái đơn hàng
func (r *CartRepository) UpdateCartStatus(cartID uint, status int) error {
	return r.DB.Model(&entity.Cart{}).Where("id = ?", cartID).Update("status", status).Error
}

// CountCompletedOrders đếm tổng số đơn hàng đã hoàn thành
func (r *CartRepository) CountCompletedOrders() (int64, error) {
	var count int64
	result := r.DB.Model(&entity.Cart{}).Where("active = false").Count(&count)
	return count, result.Error
}
