package handler

import (
	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	UserRepo    repository.UserRepository
	ProductRepo repository.ProductRepository
	CartRepo    repository.CartRepository
}

func NewAdminHandler(userRepo repository.UserRepository, productRepo repository.ProductRepository, cartRepo repository.CartRepository) *AdminHandler {
	return &AdminHandler{
		UserRepo:    userRepo,
		ProductRepo: productRepo,
		CartRepo:    cartRepo,
	}
}

// ----- Middleware -----

func (h *AdminHandler) AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("[ADMIN AUTH] Checking admin privileges for request: %s %s", c.Request.Method, c.Request.URL.Path)

		// Get user from context (set by AuthMiddleware)
		userObj, exists := c.Get("user")
		if !exists {
			log.Printf("[ADMIN AUTH] Authentication required - No user in context")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
			c.Abort()
			return
		}

		log.Printf("[ADMIN AUTH] User object found in context: %+v", userObj)

		// Check user role
		var user *entity.User
		switch u := userObj.(type) {
		case entity.User:
			tmp := u
			user = &tmp
			log.Printf("[ADMIN AUTH] User type is entity.User: %+v", u)
		case *entity.User:
			user = u
			log.Printf("[ADMIN AUTH] User type is *entity.User: %+v", *u)
		default:
			log.Printf("[ADMIN AUTH] Invalid user type: %T", userObj)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid user data type",
				"code":  "INTERNAL_ERROR",
			})
			c.Abort()
			return
		}

		log.Printf("[ADMIN AUTH] User attempting admin access - ID: %d, Email: %s, Role: %s",
			user.ID, user.Email, user.Role)

		if user.Role != "admin" {
			log.Printf("[ADMIN AUTH] Access denied - User %d (%s) does not have admin role. Role=%s",
				user.ID, user.Email, user.Role)
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Admin access required",
				"code":  "ADMIN_REQUIRED",
			})
			c.Abort()
			return
		}

		log.Printf("[ADMIN AUTH] Access granted - User %d (%s) has admin role",
			user.ID, user.Email)

		c.Next()
	}
}

// ----- Dashboard -----
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	userCount, err := h.UserRepo.CountUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get user count: " + err.Error(),
		})
		return
	}

	productCount, err := h.ProductRepo.CountProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get product count: " + err.Error(),
		})
		return
	}

	orderCount, err := h.CartRepo.CountCompletedOrders()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get order count: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_count":    userCount,
		"product_count": productCount,
		"order_count":   orderCount,
	})
}

// ----- User Management -----

func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	users, err := h.UserRepo.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get users: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

func (h *AdminHandler) GetUserByID(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	user, err := h.UserRepo.FindByID(uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	var input struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if input.Role != "admin" && input.Role != "user" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role. Must be 'admin' or 'user'",
		})
		return
	}

	err = h.UserRepo.UpdateUserRole(uint(userID), input.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user role: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User role updated successfully",
	})
}

// ----- Product Management -----
func (h *AdminHandler) CreateProduct(c *gin.Context) {
	var input struct {
		Name        string  `json:"name" binding:"required"`
		Description string  `json:"description" binding:"required"`
		Price       float64 `json:"price" binding:"required"`
		ImageURL    string  `json:"image_url" binding:"required"`
		Stock       int     `json:"stock" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	product := entity.Product{
		Name:        input.Name,
		Description: input.Description,
		Price:       input.Price,
		ImageURL:    input.ImageURL,
		Stock:       input.Stock,
	}

	createdProduct, err := h.ProductRepo.CreateProduct(product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create product: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product created successfully",
		"product": createdProduct,
	})
}

// UpdateProduct updates an existing product's information
func (h *AdminHandler) UpdateProduct(c *gin.Context) {
	productID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID",
		})
		return
	}

	var input struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		ImageURL    string  `json:"image_url"`
		Stock       int     `json:"stock"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Get current product
	product, err := h.ProductRepo.FindByID(uint(productID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	// Update product information
	if input.Name != "" {
		product.Name = input.Name
	}
	if input.Description != "" {
		product.Description = input.Description
	}
	if input.Price > 0 {
		product.Price = input.Price
	}
	if input.ImageURL != "" {
		product.ImageURL = input.ImageURL
	}
	if input.Stock >= 0 {
		product.Stock = input.Stock
	}

	updatedProduct, err := h.ProductRepo.UpdateProduct(*product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update product: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"product": updatedProduct,
	})
}

// DeleteProduct removes a product
func (h *AdminHandler) DeleteProduct(c *gin.Context) {
	productID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID",
		})
		return
	}

	err = h.ProductRepo.DeleteProduct(uint(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete product: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product deleted successfully",
	})
}

// ----- Order Management -----

// GetAllOrders returns a list of all orders
func (h *AdminHandler) GetAllOrders(c *gin.Context) {
	orders, err := h.CartRepo.GetAllCompletedCarts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get orders: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
	})
}

// GetOrderByID returns details of a specific order
func (h *AdminHandler) GetOrderByID(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID",
		})
		return
	}

	order, err := h.CartRepo.GetCartWithItems(uint(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order": order,
	})
}

// UpdateOrderStatus updates an order's status
func (h *AdminHandler) UpdateOrderStatus(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID",
		})
		return
	}

	var input struct {
		Status int `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Update status
	err = h.CartRepo.UpdateCartStatus(uint(orderID), input.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update order status: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Order status updated successfully",
	})
}
