package main

import (
	"backend/internal/app/handler"
	"backend/internal/infras/database"
	repository "backend/internal/infras/repos"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment var
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Connect to database
	db, err := database.Connect()
	if err != nil {
		log.Fatal(err)
	}

	// repositories
	userRepo := &repository.PostgresUserRepository{DB: db}
	productRepo := &repository.PostgresProductRepository{DB: db}

	// handlers
	userHandler := &handler.UserHandler{Repo: userRepo}
	authHandler := handler.NewAuthHandler(userRepo)
	productHandler := &handler.ProductHandler{productRepo}

	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// Public routes
	r.GET("/auth/google/login", authHandler.GoogleLogin)
	r.GET("/auth/google/callback", authHandler.GoogleCallback)
	r.GET("/auth/logout", authHandler.Logout)
	r.GET("/products", productHandler.GetProducts)

	// Protected routes
	auth := r.Group("/")
	auth.Use(authHandler.AuthMiddleware())
	{
		auth.GET("/users", func(c *gin.Context) {
			userHandler.GetUsers(c.Writer, c.Request)
		})

		auth.GET("/me", authHandler.GetCurrentUser)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
