package main

import (
	"backend/internal/app/handler"
	"backend/internal/domain/entity"
	"backend/internal/domain/models"
	"backend/internal/infras/database"
	repository "backend/internal/infras/repos"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
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

	// Start cleanup worker for unconfirmed registrations
	startCleanupWorker(db)

	// repositories
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
	// Register, login by gmail
	r.POST("/auth/register", authHandler.RegisterWithGmail)
	r.GET("/auth/confirm", authHandler.ConfirmEmail)
	r.POST("/auth/login", authHandler.LoginWithGmail)

	r.GET("/auth/logout", authHandler.Logout)
	r.GET("/products", productHandler.GetProducts)
	r.GET("/products/detail/:id", productHandler.GetProductByID)
	r.POST("/products/search/", productHandler.SearchProducts)
	r.POST("/cart/checkout", cartHandler.Checkout)

	auth := r.Group("/")
	auth.Use(authHandler.AuthMiddleware())
	{
		auth.GET("/users", func(c *gin.Context) {
			userHandler.GetUsers(c.Writer, c.Request)
		})

		auth.GET("/me", authHandler.GetCurrentUser)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func startCleanupWorker(db *gorm.DB) {
	go func() {
		log.Println("Starting cleanup worker for expired user registrations")

		for {
			// Wait for 1 minute before each cleanup cycle
			time.Sleep(1 * time.Minute)

			// Find tmp records older than 5 minutes with status = "false" (not confirmed)
			var expiredTmps []models.TmpUser
			cutoffTime := time.Now().Add(-5 * time.Minute)

			// Use table name tmp_users with string status
			if result := db.Table("tmp_users").Where("status = ? AND created_at < ?", "false", cutoffTime).Find(&expiredTmps); result.Error != nil {
				log.Printf("Error finding expired registrations: %v", result.Error)
				continue
			}

			if len(expiredTmps) == 0 {
				continue // No expired registrations to clean up
			}

			log.Printf("Cleaning up %d expired user registrations", len(expiredTmps))

			// For each expired record
			for _, tmp := range expiredTmps {
				// Begin transaction
				tx := db.Begin()

				// 1. Delete user
				if err := tx.Unscoped().Delete(&entity.User{}, tmp.UserID).Error; err != nil {
					tx.Rollback()
					log.Printf("Error deleting expired user %d: %v", tmp.UserID, err)
					continue
				}

				// 2. Delete tmp record
				if err := tx.Table("tmp_users").Unscoped().Delete(&tmp).Error; err != nil {
					tx.Rollback()
					log.Printf("Error deleting expired tmp record: %v", err)
					continue
				}

				// Commit transaction
				if err := tx.Commit().Error; err != nil {
					log.Printf("Error committing deletion transaction: %v", err)
					continue
				}
			}
		}
	}()
}
