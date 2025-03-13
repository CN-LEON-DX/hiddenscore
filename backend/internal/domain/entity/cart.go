package entity

import (
	"gorm.io/gorm"
)

// Cart represents a user's shopping cart
type Cart struct {
	gorm.Model
	UserID    uint       `json:"user_id"`
	User      User       `json:"user" gorm:"foreignKey:UserID"`
	CartItems []CartItem `json:"cart_items"`
	Status    int        `json:"status" gorm:"default:0"`
	Active    bool       `json:"active" gorm:"default:true"`
}

// CartItem represents a product in a cart with its quantity
type CartItem struct {
	gorm.Model
	CartID    uint    `json:"cart_id"`
	ProductID uint    `json:"product_id"`
	Product   Product `json:"product" gorm:"foreignKey:ProductID"`
	Quantity  int     `json:"quantity" gorm:"default:1"`
}
