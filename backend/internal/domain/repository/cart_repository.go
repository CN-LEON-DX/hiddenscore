package repository

import (
	"backend/internal/domain/entity"
)

type CartRepository interface {
	// Cart operations
	FindActiveCartByUserID(userID uint) (*entity.Cart, error)
	CreateCart(userID uint) (*entity.Cart, error)

	// Cart item operations
	AddItem(cartID uint, productID uint, quantity int) error
	UpdateItemQuantity(cartItemID uint, quantity int) error
	RemoveItem(cartItemID uint) error
	GetCartItems(cartID uint) ([]entity.CartItem, error)

	// Checkout process
	CloseCart(cartID uint) error
}
