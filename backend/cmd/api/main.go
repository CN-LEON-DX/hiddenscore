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
	// Load environment
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Connect to database
	db, err := database.Connect()
	if err != nil {
		log.Fatal(err)
	}

	// repo
	userRepo := &repository.UserRepository{DB: db}
	productRepo := &repository.ProductRepository{DB: db}
	cartRepo := &repository.CartRepository{DB: db}
	tmpRepo := &repository.TmpRepository{DB: db}

	// handlers
	userHandler := &handler.UserHandler{Repo: userRepo}
	authHandler := handler.NewAuthHandler(userRepo, tmpRepo)
	productHandler := handler.NewProductHandler(productRepo)
	cartHandler := handler.NewCartHandler(cartRepo, productRepo)

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL"), "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// Public routes
	r.GET("/auth/google/login", authHandler.GoogleLogin)
	r.GET("/auth/google/callback", authHandler.GoogleCallback)
	// Register, login by gmail
	r.POST("/auth/register", authHandler.RegisterWithGmail)
	r.GET("/auth/confirm", authHandler.ConfirmEmail)
	r.POST("/auth/login", authHandler.LoginWithGmail)
	r.POST("/auth/logout", authHandler.Logout)
	// Password reset routes
	r.POST("/auth/forgot-password", authHandler.ForgotPassword)
	r.POST("/auth/validate-reset-token", authHandler.ValidateResetToken)
	r.POST("/auth/reset-password", authHandler.ResetPassword)

	// Product routes
	r.GET("/products", productHandler.GetProducts)
	r.GET("/products/detail/:id", productHandler.GetProductByID)
	r.POST("/products/search/", productHandler.SearchProducts)

	// Protected routes
	auth := r.Group("/")
	auth.Use(authHandler.AuthMiddleware())
	{
		// User routes
		auth.GET("/users", userHandler.GetUsers)
		auth.GET("/user/me", authHandler.GetCurrentUser)
		auth.POST("/auth/change-password", authHandler.ChangePassword)
		auth.GET("/user/orders", userHandler.GetUserOrders)
		auth.PUT("/user/profile", userHandler.UpdateProfile)

		// Cart routes
		auth.GET("/cart", cartHandler.GetCart)
		auth.POST("/cart/add", cartHandler.AddToCart)
		auth.POST("/cart/remove", cartHandler.RemoveFromCart)
		auth.POST("/cart/update", cartHandler.UpdateCartItem)
		auth.POST("/cart/checkout", cartHandler.Checkout)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
