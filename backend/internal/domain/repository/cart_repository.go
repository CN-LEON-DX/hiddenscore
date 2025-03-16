package repository

import (
	"backend/internal/domain/entity"
)

// CartItem with product details
type CartItemWithProduct struct {
	ID       uint           `json:"id"`
	CartID   uint           `json:"cart_id"`
	Product  entity.Product `json:"product"`
	Quantity int            `json:"quantity"`
	Subtotal float64        `json:"subtotal"`
}

type CartRepository interface {
	// Cart operations
	FindActiveCartByUserID(userID uint) (*entity.Cart, error)
	CreateCart(userID uint) (*entity.Cart, error)

	// Cart item operations
	AddItem(cartID uint, productID uint, quantity int) error
	UpdateItemQuantity(cartItemID uint, quantity int) error
	RemoveItem(cartItemID uint) error
	GetCartItems(cartID uint) ([]entity.CartItem, error)
	GetCartItemsWithProductDetails(cartID uint) ([]CartItemWithProduct, error)

	// Checkout process
	CloseCart(cartID uint) error
}
