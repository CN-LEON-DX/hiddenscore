package handler

import (
	"backend/internal/domain/entity"
	"backend/internal/domain/models"
	"backend/internal/domain/repository"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHandler struct {
	Repo repository.UserRepository
}

// Updated to use gin context
func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.Repo.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get users",
			"code":  "DATABASE_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, users)
}

// UpdateProfile updates the user's profile information
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	// Get user ID from the authenticated context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication required",
			"message": "You must be logged in to update your profile.",
			"code":    "AUTH_REQUIRED",
		})
		return
	}

	// Parse request body
	var input struct {
		Name    string `json:"name" binding:"required"`
		Email   string `json:"email" binding:"required,email"`
		Phone   string `json:"phone"`
		Address string `json:"address"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "Please provide valid profile information.",
			"code":    "INVALID_INPUT",
		})
		return
	}

	// Get current user
	user, err := h.Repo.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "User not found",
			"message": "We couldn't find your account. Please try again later.",
			"code":    "USER_NOT_FOUND",
		})
		return
	}

	// Verify the email hasn't changed (email changes require a different process)
	if user.Email != input.Email {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Email change not allowed",
			"message": "You cannot change your email address using this endpoint.",
			"code":    "EMAIL_CHANGE_NOT_ALLOWED",
		})
		return
	}

	// Create a models.User for update
	modelUser := &models.User{
		ID:      user.ID,
		Email:   user.Email,
		Name:    input.Name,
		Status:  user.Status,
		Picture: user.Picture,
	}

	if user.GoogleID != nil {
		modelUser.GoogleID = *user.GoogleID
	}

	if user.Password != "" {
		modelUser.Password = user.Password
	}

	// Update profile information in database
	googleID := modelUser.GoogleID
	var googleIDPtr *string
	if googleID != "" {
		googleIDPtr = &googleID
	}

	if err := h.Repo.UpdateUser(entity.User{
		Model:    gorm.Model{ID: modelUser.ID},
		Email:    modelUser.Email,
		Name:     modelUser.Name,
		Status:   modelUser.Status,
		Picture:  modelUser.Picture,
		GoogleID: googleIDPtr,
		Password: modelUser.Password,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Profile update failed",
			"message": "We couldn't update your profile. Please try again later.",
			"code":    "PROFILE_UPDATE_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user": gin.H{
			"id":      user.ID,
			"email":   user.Email,
			"name":    input.Name,
			"phone":   input.Phone,
			"address": input.Address,
		},
	})
}

// GetUserOrders retrieves the order history for a user
func (h *UserHandler) GetUserOrders(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication required",
			"message": "You must be logged in to view your orders.",
			"code":    "AUTH_REQUIRED",
		})
		return
	}

	log.Printf("Fetching orders for user ID: %v", userID)
	sampleItems1 := []gin.H{
		{
			"id":           1,
			"product_id":   101,
			"product_name": "Gaming Chair",
			"quantity":     1,
			"price":        199.99,
			"total":        199.99,
		},
		{
			"id":           2,
			"product_id":   102,
			"product_name": "Mechanical Keyboard",
			"quantity":     1,
			"price":        89.99,
			"total":        89.99,
		},
	}

	sampleItems2 := []gin.H{
		{
			"id":           3,
			"product_id":   103,
			"product_name": "Gaming Mouse",
			"quantity":     1,
			"price":        49.99,
			"total":        49.99,
		},
	}

	// Sample orders
	sampleOrders := []gin.H{
		{
			"id":         1001,
			"created_at": time.Now().AddDate(0, 0, -5).Format(time.RFC3339),
			"status":     "Completed",
			"total":      289.98,
			"items":      sampleItems1,
		},
		{
			"id":         1002,
			"created_at": time.Now().AddDate(0, 0, -1).Format(time.RFC3339),
			"status":     "Processing",
			"total":      49.99,
			"items":      sampleItems2,
		},
	}

	c.JSON(http.StatusOK, sampleOrders)
}
