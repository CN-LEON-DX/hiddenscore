package handler

import (
	"backend/internal/domain/repository"
	"net/http"

	"github.com/gin-gonic/gin"
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
