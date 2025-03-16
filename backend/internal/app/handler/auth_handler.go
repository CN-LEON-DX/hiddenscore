package handler

import (
	"backend/internal/domain/entity"
	"backend/internal/domain/models"
	"backend/internal/domain/repository"
	"backend/internal/infras/database"
	cryptorand "crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/dgrijalva/jwt-go"
	"gorm.io/gorm"
)

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	VerifiedEmail bool   `json:"verified_email"`
}

type AuthHandler struct {
	UserRepo    repository.UserRepository
	OAuthConfig *oauth2.Config
	tmpRepo     repository.TmpRepository
}

func NewAuthHandler(userRepo repository.UserRepository, tmpRepo repository.TmpRepository) *AuthHandler {
	oauthConfig := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}

	return &AuthHandler{
		UserRepo:    userRepo,
		OAuthConfig: oauthConfig,
		tmpRepo:     tmpRepo,
	}
}

// hashPassword hashes the given password using bcrypt
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// checkPasswordHash
func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// sendConfirmationEmail sends a confirmation email to the user

// RegisterWithGmail handles user registration with Gmail and sends confirmation email
func (h *AuthHandler) RegisterWithGmail(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Name     string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "Please check your information and try again. Email and password are required.",
			"code":    "INVALID_INPUT",
		})
		return
	}

	// Check if email is valid Gmail address
	if !strings.HasSuffix(input.Email, "@gmail.com") {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid email domain",
			"message": "Please use a Gmail address for registration.",
			"code":    "INVALID_EMAIL_DOMAIN",
		})
		return
	}

	// Check if user already exists
	existingUser, err := h.UserRepo.FindByEmail(input.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": "We're experiencing technical difficulties. Please try again later.",
			"code":    "DB_ERROR",
		})
		return
	}

	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "Email already registered",
			"message": "This email address is already registered. Please try logging in instead.",
			"code":    "EMAIL_ALREADY_EXISTS",
		})
		return
	}
	// Generate confirmation token
	token, err := generateToken(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Token generation failed",
			"message": "We couldn't generate your confirmation. Please try again later.",
			"code":    "TOKEN_GENERATION_FAILED",
		})
		return
	}

	if err := sendConfirmationEmail(input.Email, token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Email sending failed",
			"message": "We couldn't send the confirmation email. Please try again later.",
			"code":    "EMAIL_SENDING_FAILED",
		})
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Password processing failed",
			"message": "We couldn't process your password. Please try again later.",
			"code":    "PASSWORD_PROCESSING_ERROR",
		})
		return
	}

	// Create user
	user := &entity.User{
		Email:    input.Email,
		Password: string(hashedPassword),
		Name:     input.Name,
		Status:   "pending",
	}

	newUser, err := h.UserRepo.CreateUser(*user)
	if err != nil {
		// Check for duplicate error
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "Email already registered",
				"message": "This email address is already registered. Please try logging in instead.",
				"code":    "EMAIL_ALREADY_EXISTS",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Registration failed",
			"message": "We couldn't complete your registration. Please try again later.",
			"code":    "REGISTRATION_FAILED",
		})
		return
	}

	// Store in tmp table
	tmpRecord := &models.TmpUser{
		UserID:      newUser.ID,
		Status:      "false",
		TokenRemain: token,
		CreatedAt:   time.Now(),
	}

	if err := h.tmpRepo.Create(tmpRecord); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Temporary record creation failed",
			"message": "We couldn't create your confirmation record. Please try again later.",
			"code":    "TMP_RECORD_FAILED",
		})
		return
	}

	err = h.createCartForUser(newUser.ID)
	if err != nil {
		log.Printf("Failed to create cart for new user %d: %v", newUser.ID, err)
	}

	// Check environment - in development, auto-confirm and bypass email
	if os.Getenv("APP_ENV") != "production" {
		tmpRecord.Status = "true"
		if err := h.tmpRepo.Update(tmpRecord); err != nil {
			log.Printf("Error auto-confirming user: %v", err)
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Registration successful. Your account has been automatically confirmed in development mode.",
			"email":   input.Email,
			"token":   token,
			"code":    "REGISTRATION_SUCCESS_DEV",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please check your email to confirm your account. The confirmation link will expire in 5 minutes.",
		"email":   input.Email,
		"code":    "REGISTRATION_SUCCESS",
	})
}

// ConfirmEmail handles the email confirmation process
func (h *AuthHandler) ConfirmEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(400, gin.H{"error": "Invalid confirmation link"})
		return
	}

	// Find tmp record with this token
	tmpUser, err := h.tmpRepo.FindByToken(token)
	if err != nil || tmpUser == nil {
		c.JSON(400, gin.H{"error": "Invalid or expired confirmation link"})
		return
	}

	// Check if token is expired (e.g., 5 minutes)
	if time.Since(tmpUser.CreatedAt) > 5*time.Minute {
		// Just reject the expired token
		log.Printf("Rejecting expired token for user ID: %d", tmpUser.UserID)
		c.JSON(400, gin.H{"error": "Confirmation link has expired. Please register again."})
		return
	}

	// Check if already confirmed
	if tmpUser.Status == "true" {
		c.JSON(400, gin.H{"error": "Email already confirmed"})
		return
	}

	// Get the user
	user, err := h.UserRepo.GetUserByID(tmpUser.UserID)
	if err != nil {
		c.JSON(500, gin.H{"error": "User not found"})
		return
	}

	log.Printf("User %d confirmed email successfully", user.ID)

	tmpUser.Status = "true"
	if err := h.tmpRepo.Update(tmpUser); err != nil {
		c.JSON(500, gin.H{"error": "Failed to update confirmation status"})
		return
	}

	c.JSON(200, gin.H{"message": "Email confirmed successfully. You can now log in."})
}

// LoginWithGmail validates login credentials and checks confirmation status
func (h *AuthHandler) LoginWithGmail(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "Please check your email and password.",
			"code":    "INVALID_INPUT",
		})
		return
	}

	// Find user by email
	user, err := h.UserRepo.FindByEmail(input.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication failed",
			"message": "Invalid email or password. Please check  again.",
			"code":    "AUTH_FAILED",
		})
		return
	}

	// Check if this is a Google account
	if user.GoogleID != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Google account",
			"message": "This email is registered with Google. Please use Google Sign-In instead.",
			"code":    "GOOGLE_ACCOUNT",
		})
		return
	}

	// Skip confirmation check for non-production environments
	if os.Getenv("APP_ENV") != "production" {
		log.Printf("Development mode: Skipping confirmation check for user %d", user.ID)
	} else {
		// In production, check confirmation status
		var tmpUser models.TmpUser
		confirmationRequired := true

		// Check if this is an older account (created before email verification was implemented)
		if user.CreatedAt.Before(time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC)) {
			log.Printf("Legacy user from before verification system, skipping check: %d", user.ID)
			confirmationRequired = false
		}

		// Try to find confirmation record
		err := h.tmpRepo.FindByUserID(user.ID, &tmpUser)

		// If we can't find a confirmation record but confirmation is required
		if err != nil && confirmationRequired {
			log.Printf("No confirmation record found for user %d, creating new one", user.ID)
			// Create a new verification record
			token, tokenErr := generateToken(32)
			if tokenErr == nil {
				newTmpRecord := &models.TmpUser{
					UserID:      user.ID,
					Status:      "false",
					TokenRemain: token,
					CreatedAt:   time.Now(),
				}

				// Create the verification record
				if createErr := h.tmpRepo.Create(newTmpRecord); createErr != nil {
					log.Printf("Failed to create verification record: %v", createErr)
				} else {
					// Try to send verification email
					if emailErr := sendConfirmationEmail(user.Email, token); emailErr != nil {
						log.Printf("Failed to send verification email: %v", emailErr)
					} else {
						log.Printf("Sent confirmation email to %s", user.Email)
					}
				}

				c.JSON(http.StatusUnauthorized, gin.H{
					"error":   "Email not confirmed",
					"message": "Please confirm your email before logging in. A confirmation email has been sent.",
					"code":    "EMAIL_NOT_CONFIRMED",
				})
				return
			}
		} else if err == nil && tmpUser.Status != "true" && confirmationRequired {
			// If we found a record but it's not confirmed
			log.Printf("User %d has unconfirmed email, resending confirmation", user.ID)

			// Resend confirmation email
			if emailErr := sendConfirmationEmail(user.Email, tmpUser.TokenRemain); emailErr != nil {
				log.Printf("Failed to resend confirmation email: %v", emailErr)
			} else {
				log.Printf("Resent confirmation email to %s", user.Email)
			}

			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Email not confirmed",
				"message": "Please confirm your email before logging in. A new confirmation link has been sent to your email.",
				"code":    "EMAIL_NOT_CONFIRMED",
			})
			return
		}
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication failed",
			"message": "Invalid email or password. Please check again.",
			"code":    "AUTH_FAILED",
		})
		return
	}

	// Generate JWT token
	token, err := h.generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Token generation failed",
			"message": "We couldn't create your authentication token. Please try again later.",
			"code":    "TOKEN_GENERATION_FAILED",
		})
		return
	}

	// Check if user has a cart
	if !h.userHasCart(user.ID) {
		// Create a cart for the user
		err = h.createCartForUser(user.ID)
		if err != nil {
			// Just log the error but continue, cart creation is not critical
			log.Printf("Failed to create cart for user %d on login: %v", user.ID, err)
		}
	}

	// Set cookie with token
	c.SetCookie(
		"auth_token",
		token,
		3600*24, // 1 day
		"/",
		"",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
		},
		"code": "LOGIN_SUCCESS",
	})
}

// GoogleLogin initiates the Google OAuth2 login flow
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	url := h.OAuthConfig.AuthCodeURL("state", oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback handles the callback from Google OAuth2
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		log.Printf("Error: No code provided in Google callback")
		c.JSON(http.StatusBadRequest, gin.H{"error": "No code provided"})
		return
	}

	token, err := h.OAuthConfig.Exchange(c, code)
	if err != nil {
		log.Printf("Error exchanging Google code for token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token: " + err.Error()})
		return
	}

	userInfo, err := h.getUserInfoFromGoogle(token.AccessToken)
	if err != nil {
		log.Printf("Error getting user info from Google: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info: " + err.Error()})
		return
	}

	// Make sure we have valid user info
	if userInfo.ID == "" || userInfo.Email == "" {
		log.Printf("Invalid user info from Google: ID or Email is empty")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user information from Google"})
		return
	}

	log.Printf("Successfully received Google user info for: %s (%s)", userInfo.Email, userInfo.ID)

	// First check if the user exists by email - they might have registered with email first
	existingUserByEmail, _ := h.UserRepo.FindByEmail(userInfo.Email)

	var user entity.User

	if existingUserByEmail != nil && existingUserByEmail.GoogleID == nil {
		// User exists with email but no Google ID - update their account to link Google ID
		log.Printf("Updating existing email user %d to link with Google ID: %s", existingUserByEmail.ID, userInfo.ID)
		existingUserByEmail.GoogleID = &userInfo.ID
		existingUserByEmail.Picture = userInfo.Picture

		// Since UpdateUser is missing, we'll handle this differently
		// Save the updated user with direct DB access
		db, dbErr := database.Connect()
		if dbErr != nil {
			log.Printf("Database connection error: %v", dbErr)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
			return
		}

		if err := db.Save(existingUserByEmail).Error; err != nil {
			log.Printf("Failed to update user with Google ID: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link Google account: " + err.Error()})
			return
		}
		user = *existingUserByEmail
	} else {
		// Try to find user by Google ID
		user, err = h.UserRepo.FindUserByGoogleID(userInfo.ID)
		if err != nil {
			// Google user doesn't exist, create new user
			log.Printf("Creating new user from Google: %s", userInfo.Email)

			googleID := userInfo.ID
			newUser := entity.User{
				GoogleID: &googleID,
				Email:    userInfo.Email,
				Name:     userInfo.Name,
				Picture:  userInfo.Picture,
				Status:   "active", // Google-authenticated users are automatically verified
			}

			user, err = h.UserRepo.CreateUser(newUser)
			if err != nil {
				log.Printf("Failed to create user from Google: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
				return
			}

			// Create cart for new user
			err = h.createCartForUser(user.ID)
			if err != nil {
				log.Printf("Failed to create cart for new Google user %d: %v", user.ID, err)
				// Continue anyway, cart creation is not critical for auth
			}
		} else {
			log.Printf("Found existing Google user: %s (ID: %d)", user.Email, user.ID)
		}
	}

	// Generate JWT token for the user
	jwtToken, err := h.generateJWT(&user)
	if err != nil {
		log.Printf("Failed to generate JWT token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token: " + err.Error()})
		return
	}

	// Set authentication cookie
	c.SetCookie(
		"auth_token",
		jwtToken,
		3600*24, // 1 day
		"/",
		"",
		false,
		true,
	)

	// Get frontend URL from environment or use default
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000" // Fallback
	}

	// Build redirect URL with token
	redirectURL := frontendURL + "/auth/google?token=" + jwtToken

	// Special case for localhost
	if strings.Contains(redirectURL, "localhost") && !strings.HasPrefix(redirectURL, "http://") {
		redirectURL = strings.Replace(redirectURL, "https://", "http://", 1)
	}

	log.Printf("Redirecting Google user to: %s", redirectURL)
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// getUserInfoFromGoogle fetches user info from Google API
func (h *AuthHandler) getUserInfoFromGoogle(accessToken string) (*GoogleUserInfo, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo GoogleUserInfo
	if err = json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// generateJWT creates a JWT token for the user
func (h *AuthHandler) generateJWT(user *entity.User) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)

	claims["user_id"] = user.ID
	claims["email"] = user.Email
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix() // Token expires in 24 hours

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// GetCurrentUser returns the currently authenticated user's data
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	// Get user ID from context (set by AuthMiddleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Not authenticated",
			"code":  "NOT_AUTHENTICATED",
		})
		return
	}

	// Get user from database
	user, err := h.UserRepo.FindByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get user data",
			"code":  "USER_DATA_ERROR",
		})
		return
	}

	// Return user data (excluding sensitive fields)
	c.JSON(http.StatusOK, gin.H{
		"id":      user.ID,
		"email":   user.Email,
		"name":    user.Name,
		"picture": user.Picture,
	})
}

// AuthMiddleware authenticates requests using JWT token
func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("auth_token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No authentication token"})
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(os.Getenv("JWT_SECRET_KEY")), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authentication token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		userID := uint(claims["user_id"].(float64))
		user, err := h.UserRepo.GetUserByID(userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		c.Set("user", user)
		c.Set("userID", user.ID)
		c.Next()
	}
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear the auth cookie
	c.SetCookie(
		"auth_token",
		"",
		-1, // expire immediately
		"/",
		"",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
		"code":    "LOGOUT_SUCCESS",
	})
}

func generateToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := cryptorand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func sendConfirmationEmail(email, token string) error {
	from := os.Getenv("EMAIL")
	password := os.Getenv("EMAIL_PASSWORD")
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	frontendURL := os.Getenv("FRONTEND_URL")

	if from == "" || password == "" || host == "" || port == "" || frontendURL == "" {
		return fmt.Errorf("missing email configuration environment variables")
	}

	confirmationLink := frontendURL + "/confirm-email?token=" + token

	subject := "🔐 Confirm Your Account"

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Account Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .header { background-color: #f8f9fa; padding: 10px; text-align: center; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; 
                 text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { font-size: 12px; color: #777; margin-top: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Confirm Your Account</h2>
        </div>
        <p>Hello,</p>
        <p>Thank you for registering an account. To complete the registration process, please click the link below:</p>
        <p style="text-align: center;">
            <a href="%s" class="button">Confirm Account</a>
        </p>
        <p>Or you can copy and paste this URL into your browser:</p>
        <p>%s</p>
        <p>This link will expire in 5 minutes.</p>
        <p>If you did not make this request, please ignore this email.</p>
        <div class="footer">
            <p>© 2025 Hidden Score. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, confirmationLink, confirmationLink)

	boundary := "==MessageBoundary=="

	headers := fmt.Sprintf("From: Hidden Score - V diamond <%s>\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: multipart/alternative; boundary=\"%s\"\r\n\r\n",
		from, email, subject, boundary)

	plainText := fmt.Sprintf("Hello,\r\n\r\nPlease confirm your account by clicking the following link:\r\n\r\n%s\r\n\r\nThis link will expire in 5 minutes.\r\n", confirmationLink)

	message := headers +
		fmt.Sprintf("--%s\r\n", boundary) +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
		plainText +
		fmt.Sprintf("\r\n--%s\r\n", boundary) +
		"Content-Type: text/html; charset=UTF-8\r\n\r\n" +
		htmlBody +
		fmt.Sprintf("\r\n--%s--", boundary)

	tlsConfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         host,
	}

	conn, err := tls.Dial("tcp", host+":"+port, tlsConfig)
	if err != nil {
		return fmt.Errorf("SMTP connection error: %w", err)
	}

	smtpClient, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("SMTP client error: %w", err)
	}
	defer smtpClient.Close()

	auth := smtp.PlainAuth("", from, password, host)
	if err = smtpClient.Auth(auth); err != nil {
		return fmt.Errorf("SMTP authentication error: %w", err)
	}

	if err = smtpClient.Mail(from); err != nil {
		return fmt.Errorf("SMTP sender error: %w", err)
	}

	if err = smtpClient.Rcpt(email); err != nil {
		return fmt.Errorf("SMTP recipient error: %w", err)
	}

	writer, err := smtpClient.Data()
	if err != nil {
		return fmt.Errorf("SMTP data error: %w", err)
	}

	_, err = writer.Write([]byte(message))
	if err != nil {
		return fmt.Errorf("SMTP write error: %w", err)
	}

	err = writer.Close()
	if err != nil {
		return fmt.Errorf("SMTP close error: %w", err)
	}

	return nil
}

func (h *AuthHandler) userHasCart(userID uint) bool {
	var count int64
	db, err := database.Connect()
	if err != nil {
		return false
	}
	db.Table("carts").Where("user_id = ?", userID).Count(&count)
	return count > 0
}

func (h *AuthHandler) createCartForUser(userID uint) error {
	db, err := database.Connect()
	if err != nil {
		return err
	}
	var userCount int64
	db.Table("users").Where("id = ?", userID).Count(&userCount)
	if userCount == 0 {
		return fmt.Errorf("user with ID %d does not exist", userID)
	}

	var cartCount int64
	db.Table("carts").Where("user_id = ?", userID).Count(&cartCount)
	if cartCount > 0 {
		return nil
	}

	result := db.Exec("INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())", userID)
	return result.Error
}

// ForgotPassword handles password reset requests
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "Please provide a valid email address.",
			"code":    "INVALID_INPUT",
		})
		return
	}

	// Check if user exists
	user, err := h.UserRepo.FindByEmail(input.Email)
	if err != nil || user == nil {
		// Don't reveal whether the email exists for security
		c.JSON(http.StatusOK, gin.H{
			"message": "If your email is registered with us, we'll send you instructions to reset your password.",
		})
		return
	}

	// Generate reset token
	resetToken, err := generateToken(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Token generation failed",
			"message": "We couldn't generate your reset token. Please try again later.",
			"code":    "TOKEN_GENERATION_FAILED",
		})
		return
	}

	// Store token in tmp table
	tmpReset := &models.TmpUser{
		UserID:      user.ID,
		Status:      "reset_password",
		TokenRemain: resetToken,
		CreatedAt:   time.Now(),
	}

	if err := h.tmpRepo.Create(tmpReset); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Reset record creation failed",
			"message": "We couldn't create your reset record. Please try again later.",
			"code":    "RESET_RECORD_FAILED",
		})
		return
	}

	// Send reset email
	if err := h.sendPasswordResetEmail(user.Email, resetToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Email sending failed",
			"message": "We couldn't send the reset email. Please try again later.",
			"code":    "EMAIL_SENDING_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "If your email is registered with us, we'll send you instructions to reset your password.",
	})
}

// ValidateResetToken validates a password reset token
func (h *AuthHandler) ValidateResetToken(c *gin.Context) {
	var input struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "Reset token is required.",
			"code":    "INVALID_INPUT",
		})
		return
	}

	// Find tmp record with this token
	tmpReset, err := h.tmpRepo.FindByToken(input.Token)
	if err != nil || tmpReset == nil || tmpReset.Status != "reset_password" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid token",
			"message": "The reset token is invalid or has expired.",
			"code":    "INVALID_TOKEN",
		})
		return
	}

	// Check if token is expired (30 minutes)
	if time.Since(tmpReset.CreatedAt) > 30*time.Minute {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Token expired",
			"message": "The reset token has expired. Please request a new one.",
			"code":    "TOKEN_EXPIRED",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token is valid.",
	})
}

// ResetPassword resets a user's password using a valid token
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var input struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "Please provide both a valid token and a new password (min 8 characters).",
			"code":    "INVALID_INPUT",
		})
		return
	}

	// Find tmp record with this token
	tmpReset, err := h.tmpRepo.FindByToken(input.Token)
	if err != nil || tmpReset == nil || tmpReset.Status != "reset_password" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid token",
			"message": "The reset token is invalid or has expired.",
			"code":    "INVALID_TOKEN",
		})
		return
	}

	// Check if token is expired (30 minutes)
	if time.Since(tmpReset.CreatedAt) > 30*time.Minute {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Token expired",
			"message": "The reset token has expired. Please request a new one.",
			"code":    "TOKEN_EXPIRED",
		})
		return
	}

	// Get the user
	user, err := h.UserRepo.GetUserByID(tmpReset.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "User not found",
			"message": "We couldn't find your account. Please try again later.",
			"code":    "USER_NOT_FOUND",
		})
		return
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Password processing failed",
			"message": "We couldn't process your new password. Please try again later.",
			"code":    "PASSWORD_PROCESSING_ERROR",
		})
		return
	}

	// Create a models.User for Update
	modelUser := &models.User{
		ID:       user.ID,
		Email:    user.Email,
		Password: string(hashedPassword),
		Name:     user.Name,
		Status:   user.Status,
	}
	if user.GoogleID != nil {
		modelUser.GoogleID = *user.GoogleID
	}
	if user.Picture != "" {
		modelUser.Picture = user.Picture
	}

	// Update the user's password
	if err := h.UserRepo.Update(modelUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Password update failed",
			"message": "We couldn't update your password. Please try again later.",
			"code":    "PASSWORD_UPDATE_FAILED",
		})
		return
	}

	// Mark the token as used
	tmpReset.Status = "used"
	if err := h.tmpRepo.Update(tmpReset); err != nil {
		// Just log this error but continue
		log.Printf("Failed to mark reset token as used: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Your password has been reset successfully. You can now log in with your new password.",
	})
}

// ChangePassword handles password changes for authenticated users
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	// Get current user from middleware
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication required",
			"message": "You must be logged in to change your password.",
			"code":    "AUTH_REQUIRED",
		})
		return
	}

	var input struct {
		CurrentPassword string `json:"currentPassword" binding:"required"`
		NewPassword     string `json:"newPassword" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"message": "Please provide your current password and a new password (min 8 characters).",
			"code":    "INVALID_INPUT",
		})
		return
	}

	// Get the user
	user, err := h.UserRepo.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "User not found",
			"message": "We couldn't find your account. Please try again later.",
			"code":    "USER_NOT_FOUND",
		})
		return
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Invalid password",
			"message": "Your current password is incorrect.",
			"code":    "INVALID_CURRENT_PASSWORD",
		})
		return
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Password processing failed",
			"message": "We couldn't process your new password. Please try again later.",
			"code":    "PASSWORD_PROCESSING_ERROR",
		})
		return
	}

	// Create a models.User for Update
	modelUser := &models.User{
		ID:       user.ID,
		Email:    user.Email,
		Password: string(hashedPassword),
		Name:     user.Name,
		Status:   user.Status,
	}
	if user.GoogleID != nil {
		modelUser.GoogleID = *user.GoogleID
	}
	if user.Picture != "" {
		modelUser.Picture = user.Picture
	}

	// Update the user's password
	if err := h.UserRepo.Update(modelUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Password update failed",
			"message": "We couldn't update your password. Please try again later.",
			"code":    "PASSWORD_UPDATE_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Your password has been changed successfully.",
	})
}

// sendPasswordResetEmail sends a password reset email to the user
func (h *AuthHandler) sendPasswordResetEmail(email, token string) error {
	from := os.Getenv("EMAIL")
	password := os.Getenv("EMAIL_PASSWORD")
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	frontendURL := os.Getenv("FRONTEND_URL")

	if from == "" || password == "" || host == "" || port == "" || frontendURL == "" {
		return fmt.Errorf("missing email configuration environment variables")
	}

	resetLink := frontendURL + "/reset-password?token=" + token

	subject := "🔐 Reset Your Password"

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .header { background-color: #f8f9fa; padding: 10px; text-align: center; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; 
                 text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { font-size: 12px; color: #777; margin-top: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Reset Your Password</h2>
        </div>
        <p>Hello,</p>
        <p>You recently requested to reset your password. Click the link below to set a new password:</p>
        <p style="text-align: center;">
            <a href="%s" class="button">Reset Password</a>
        </p>
        <p>Or you can copy and paste this URL into your browser:</p>
        <p>%s</p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <div class="footer">
            <p>© 2025 Hidden Score. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, resetLink, resetLink)

	// Set up authentication information
	auth := smtp.PlainAuth("", from, password, host)

	// TLS config
	tlsconfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         host,
	}

	// Set up the email headers and body
	to := []string{email}
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	headers := "To: " + email + "\r\n" +
		"From: " + from + "\r\n" +
		"Subject: " + subject + "\r\n" +
		mime

	// Connect to the server, authenticate, and send the email
	conn, err := tls.Dial("tcp", host+":"+port, tlsconfig)
	if err != nil {
		return err
	}
	defer conn.Close()

	c, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer c.Quit()

	if err = c.Auth(auth); err != nil {
		return err
	}

	if err = c.Mail(from); err != nil {
		return err
	}

	for _, addr := range to {
		if err = c.Rcpt(addr); err != nil {
			return err
		}
	}

	w, err := c.Data()
	if err != nil {
		return err
	}

	_, err = w.Write([]byte(headers + "\r\n" + htmlBody))
	if err != nil {
		return err
	}

	err = w.Close()
	if err != nil {
		return err
	}

	return nil
}
