package app

import (
	"backend/internal/app/handler"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Use the session middleware
	r.Use(handler.SessionMiddleware())

	// Define your routes here
	// Example: r.GET("/cart", handler.GetCart)

	return r
}
