package utils

import (
	"backend/internal/domain/entity"
	"backend/internal/infras/database"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

var googleOauthConfig = &oauth2.Config{
	RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
	ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
	ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
	Endpoint:     google.Endpoint,
}

func GoogleLogin(c *gin.Context) {
	url := googleOauthConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing authorization code",
			"message": "The authorization code is required for Google authentication",
			"code":    "MISSING_CODE",
		})
		return
	}

	token, err := googleOauthConfig.Exchange(c, code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to exchange token",
			"message": "We couldn't validate your Google authorization. Please try again.",
			"code":    "TOKEN_EXCHANGE_FAILED",
		})
		return
	}

	// Call Google API to get user info
	client := googleOauthConfig.Client(c, token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to get user info",
			"message": "We couldn't retrieve your Google profile information. Please try again.",
			"code":    "USER_INFO_FAILED",
		})
		return
	}
	defer response.Body.Close()

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.NewDecoder(response.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to decode user info",
			"message": "We couldn't process your Google profile information. Please try again.",
			"code":    "DECODE_FAILED",
		})
		return
	}

	// Validate email
	if googleUser.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Email is required",
			"message": "We couldn't retrieve your email from Google. Please ensure your Google account has a verified email.",
			"code":    "MISSING_EMAIL",
		})
		return
	}

	// Connect to the database
	db, err := database.Connect()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database connection failed",
			"message": "We're experiencing technical difficulties. Please try again later.",
			"code":    "DB_CONNECTION_FAILED",
		})
		return
	}

	// Check if user exists by Google ID
	var user entity.User
	if err := db.Where("google_id = ?", googleUser.ID).First(&user).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Database query failed",
				"message": "We're experiencing technical difficulties. Please try again later.",
				"code":    "DB_QUERY_FAILED",
			})
			return
		}

		// Check if user exists with the same email
		var existingUser entity.User
		if err := db.Where("email = ?", googleUser.Email).First(&existingUser).Error; err == nil {
			// User exists with this email but doesn't have a Google ID
			if existingUser.GoogleID == nil {
				c.JSON(http.StatusConflict, gin.H{
					"error":   "Email already registered",
					"message": "This email is already registered with a password. Please use your email and password to log in.",
					"code":    "EMAIL_ALREADY_EXISTS",
				})
				return
			}

			// User exists with this email, update Google ID
			googleID := googleUser.ID
			existingUser.GoogleID = &googleID
			existingUser.Picture = googleUser.Picture
			existingUser.Name = googleUser.Name

			err = db.Save(&existingUser).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "Failed to update user",
					"message": "We couldn't update your account information. Please try again later.",
					"code":    "UPDATE_FAILED",
				})
				return
			}
			user = existingUser
		} else {
			// User doesn't exist, create new one
			googleID := googleUser.ID
			user = entity.User{
				GoogleID: &googleID,
				Email:    googleUser.Email,
				Name:     googleUser.Name,
				Picture:  googleUser.Picture,
				Status:   "active",
			}

			err = db.Create(&user).Error
			if err != nil {
				// Handle duplicate key specifically
				if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
					c.JSON(http.StatusConflict, gin.H{
						"error":   "Email already registered",
						"message": "This email is already registered. Please use your existing account to log in.",
						"code":    "EMAIL_ALREADY_EXISTS",
					})
					return
				}

				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "Account creation failed",
					"message": "We couldn't create your account. Please try again later.",
					"code":    "CREATE_FAILED",
				})
				return
			}

			// Create a cart for the new user
			err = createCartForUser(db, user.ID)
			if err != nil {
				fmt.Printf("Failed to create cart for new user %d: %v\n", user.ID, err)
				// Continue even if cart creation fails, just log the error
			}
		}
	} else {
		// User exists with Google ID, check if we need to update their info
		if user.Picture != googleUser.Picture || user.Name != googleUser.Name {
			user.Picture = googleUser.Picture
			user.Name = googleUser.Name

			err = db.Save(&user).Error
			if err != nil {
				// Non-critical update, just log the error and continue
				fmt.Printf("Failed to update user profile: %v\n", err)
			}
		}

		// Check if user has a cart
		if !userHasCart(db, user.ID) {
			err = createCartForUser(db, user.ID)
			if err != nil {
				fmt.Printf("Failed to create cart for existing user %d: %v\n", user.ID, err)
				// Continue even if cart creation fails, just log the error
			}
		}
	}

	// Generate JWT token
	jwtToken, err := GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Authentication failed",
			"message": "We couldn't create your authentication token. Please try again later.",
			"code":    "TOKEN_GENERATION_FAILED",
		})
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	if strings.HasSuffix(frontendURL, "/") {
		frontendURL = strings.TrimSuffix(frontendURL, "/")
	}

	redirectURL := frontendURL + "/auth/google?token=" + jwtToken
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func userHasCart(db *gorm.DB, userID uint) bool {
	var count int64
	db.Table("carts").Where("user_id = ?", userID).Count(&count)
	return count > 0
}

// Helper function to create a cart for a user
func createCartForUser(db *gorm.DB, userID uint) error {
	// This is a simple implementation - adjust according to your cart schema
	result := db.Exec("INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())", userID)
	return result.Error
}
