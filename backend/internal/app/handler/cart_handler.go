package handler

import (
	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
)

type CartHandler struct {
	CartRepo    repository.CartRepository
	ProductRepo repository.ProductRepository
}

func NewCartHandler(cartRepo repository.CartRepository, productRepo repository.ProductRepository) *CartHandler {
	return &CartHandler{
		CartRepo:    cartRepo,
		ProductRepo: productRepo,
	}
}

// GetCart gets the user's active cart
func (h *CartHandler) GetCart(c *gin.Context) {
	// Get user from context
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
			"code":  "NOT_AUTHENTICATED",
		})
		return
	}

	// Get userID from user object
	var userIDUint uint
	switch u := userObj.(type) {
	case entity.User:
		userIDUint = u.ID
	case *entity.User:
		if u != nil {
			userIDUint = u.ID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid user data",
				"code":  "INTERNAL_ERROR",
			})
			return
		}
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user data type",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	// Find or create cart
	cart, err := h.CartRepo.FindActiveCartByUserID(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve cart: " + err.Error(),
			"code":  "CART_ERROR",
		})
		return
	}

	if cart == nil {
		// No active cart, create one
		cart, err = h.CartRepo.CreateCart(userIDUint)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create cart: " + err.Error(),
				"code":  "CART_ERROR",
			})
			return
		}
	}

	// Get cart items with product details
	cartItems, err := h.CartRepo.GetCartItemsWithProductDetails(cart.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve cart items: " + err.Error(),
			"code":  "CART_ITEMS_ERROR",
		})
		return
	}

	// Return cart with items
	c.JSON(http.StatusOK, gin.H{
		"cart":  cart,
		"items": cartItems,
	})
}

// AddItemRequest represents the request body for adding an item to the cart
type AddItemRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1"`
}

// AddToCart adds an item to the cart
func (h *CartHandler) AddToCart(c *gin.Context) {
	// Get user from context
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
			"code":  "NOT_AUTHENTICATED",
		})
		return
	}

	// Get userID from user object
	var userIDUint uint
	switch u := userObj.(type) {
	case entity.User:
		userIDUint = u.ID
	case *entity.User:
		if u != nil {
			userIDUint = u.ID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid user data",
				"code":  "INTERNAL_ERROR",
			})
			return
		}
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user data type",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	var request AddItemRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if product exists
	product, err := h.ProductRepo.FindByID(request.ProductID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Check stock
	if product.Stock < request.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough stock available"})
		return
	}

	// Get or create active cart
	cart, err := h.CartRepo.FindActiveCartByUserID(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if cart == nil {
		cart, err = h.CartRepo.CreateCart(userIDUint)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Retrieve session
	session := c.MustGet("session").(*sessions.Session)

	// Add item to session
	cartItems, ok := session.Values["cartItems"].([]entity.CartItem)
	if !ok {
		cartItems = []entity.CartItem{}
	}

	// Append new item
	cartItems = append(cartItems, entity.CartItem{
		CartID:    cart.ID,
		ProductID: request.ProductID,
		Quantity:  request.Quantity,
	})

	// Save updated cart items to session
	session.Values["cartItems"] = cartItems

	// Save session
	session.Save(c.Request, c.Writer)

	c.JSON(http.StatusOK, gin.H{"message": "Item added to cart"})
}

// UpdateItemRequest represents the request body for updating a cart item
type UpdateItemRequest struct {
	Quantity int `json:"quantity" binding:"required,min=0"`
}

// UpdateCartItem updates the quantity of an item in the cart
func (h *CartHandler) UpdateCartItem(c *gin.Context) {
	// Get user from context
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
			"code":  "NOT_AUTHENTICATED",
		})
		return
	}

	// Get userID from user object
	var userIDUint uint
	switch u := userObj.(type) {
	case entity.User:
		userIDUint = u.ID
	case *entity.User:
		if u != nil {
			userIDUint = u.ID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid user data",
				"code":  "INTERNAL_ERROR",
			})
			return
		}
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user data type",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	itemID := c.Param("itemID")
	itemIDUint, err := strconv.ParseUint(itemID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	var request UpdateItemRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update item quantity
	err = h.CartRepo.UpdateItemQuantity(uint(itemIDUint), request.Quantity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get updated cart
	updatedCart, err := h.CartRepo.FindActiveCartByUserID(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedCart)
}

// RemoveFromCart removes an item from the cart
func (h *CartHandler) RemoveFromCart(c *gin.Context) {
	// Get user from context
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
			"code":  "NOT_AUTHENTICATED",
		})
		return
	}

	// Get userID from user object
	var userIDUint uint
	switch u := userObj.(type) {
	case entity.User:
		userIDUint = u.ID
	case *entity.User:
		if u != nil {
			userIDUint = u.ID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid user data",
				"code":  "INTERNAL_ERROR",
			})
			return
		}
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user data type",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	itemID := c.Param("itemID")
	itemIDUint, err := strconv.ParseUint(itemID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	// Remove item
	err = h.CartRepo.RemoveItem(uint(itemIDUint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get updated cart
	updatedCart, err := h.CartRepo.FindActiveCartByUserID(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedCart)
}

// ClearCart clears all items from the cart
func (h *CartHandler) ClearCart(c *gin.Context) {
	// Get user from context
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
			"code":  "NOT_AUTHENTICATED",
		})
		return
	}

	// Get userID from user object
	var userIDUint uint
	switch u := userObj.(type) {
	case entity.User:
		userIDUint = u.ID
	case *entity.User:
		if u != nil {
			userIDUint = u.ID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid user data",
				"code":  "INTERNAL_ERROR",
			})
			return
		}
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user data type",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	cart, err := h.CartRepo.FindActiveCartByUserID(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if cart == nil {
		c.JSON(http.StatusOK, gin.H{"message": "No active cart"})
		return
	}

	// Remove all items one by one
	for _, item := range cart.CartItems {
		err = h.CartRepo.RemoveItem(item.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared"})
}

// Checkout processes the checkout of the current cart
func (h *CartHandler) Checkout(c *gin.Context) {
	// Get user from context
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
			"code":  "NOT_AUTHENTICATED",
		})
		return
	}

	// Get userID from user object
	var userIDUint uint
	switch u := userObj.(type) {
	case entity.User:
		userIDUint = u.ID
	case *entity.User:
		if u != nil {
			userIDUint = u.ID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid user data",
				"code":  "INTERNAL_ERROR",
			})
			return
		}
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user data type",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	// Get active cart
	cart, err := h.CartRepo.FindActiveCartByUserID(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if cart == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active cart"})
		return
	}

	// Close the cart
	err = h.CartRepo.CloseCart(cart.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Checkout successful"})
}
