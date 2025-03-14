package handler

import (
	"backend/internal/domain/entity"
	"backend/internal/domain/models"
	"backend/internal/domain/repository"
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
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Check if email is valid Gmail address
	if !strings.HasSuffix(input.Email, "@gmail.com") {
		c.JSON(400, gin.H{"error": "Please use a Gmail address"})
		return
	}

	// Check if user already exists
	existingUser, err := h.UserRepo.FindByEmail(input.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(500, gin.H{"error": "Error checking user existence"})
		return
	}

	if existingUser != nil {
		c.JSON(400, gin.H{"error": "Email already registered"})
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to process password"})
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
		c.JSON(500, gin.H{"error": "Failed to register user"})
		return
	}

	// Generate confirmation token
	token, err := generateToken(32)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate confirmation token"})
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
		c.JSON(500, gin.H{"error": "Failed to create temporary record"})
		return
	}

	// Check environment - in development, auto-confirm and bypass email
	if os.Getenv("APP_ENV") != "production" {
		// Auto-confirm user in development
		tmpRecord.Status = "true"
		if err := h.tmpRepo.Update(tmpRecord); err != nil {
			// Log only critical errors
			log.Printf("Error auto-confirming user: %v", err)
		}

		c.JSON(201, gin.H{
			"message": "Registration successful. Your account has been automatically confirmed in development mode.",
			"email":   input.Email,
			"token":   token,
		})
		return
	}

	// In production, send confirmation email
	if err := sendConfirmationEmail(input.Email, token); err != nil {
		c.JSON(500, gin.H{"error": "Failed to send confirmation email"})
		return
	}

	c.JSON(201, gin.H{
		"message": "Registration successful. Please check your email to confirm your account. The confirmation link will expire in 5 minutes.",
		"email":   input.Email,
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

	// Update tmp record status
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
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	user, err := h.UserRepo.FindByEmail(input.Email)
	if err != nil || user == nil {
		c.JSON(401, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check if account is confirmed by looking up tmp record
	var tmpUser models.TmpUser
	if err := h.tmpRepo.FindByUserID(user.ID, &tmpUser); err != nil {
		c.JSON(401, gin.H{"error": "Account verification issue. Please contact support."})
		return
	}

	// If tmp record exists but not confirmed, reject login
	if tmpUser.Status != "true" {
		c.JSON(401, gin.H{"error": "Please confirm your email before logging in. Check your inbox for the confirmation link."})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid email or password"})
		return
	}

	// Generate JWT token
	token, err := h.generateJWT(user)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
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

	c.JSON(200, gin.H{
		"message": "Login successful",
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
		},
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
	token, err := h.OAuthConfig.Exchange(c, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token: " + err.Error()})
		return
	}

	userInfo, err := h.getUserInfoFromGoogle(token.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info: " + err.Error()})
		return
	}
	var user entity.User
	// Check if user exists, create if not
	user, err = h.UserRepo.FindUserByGoogleID(userInfo.ID)
	if err != nil {
		// Create new user
		googleID := userInfo.ID
		newUser := entity.User{
			GoogleID: &googleID,
			Email:    userInfo.Email,
			Name:     userInfo.Name,
			Picture:  userInfo.Picture,
		}

		user, err = h.UserRepo.CreateUser(newUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
			return
		}
	}

	jwtToken, err := h.generateJWT(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token: " + err.Error()})
		return
	}

	c.SetCookie(
		"auth_token",
		jwtToken,
		3600*24, // 1 day
		"/",
		"",
		false,
		true,
	)

	frontendURL := os.Getenv("FRONTEND_URL")
	c.Redirect(http.StatusTemporaryRedirect, frontendURL)
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

func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	c.JSON(http.StatusOK, user)
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
		c.Next()
	}
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear the auth_token cookie
	c.SetCookie(
		"auth_token",
		"",    // empty value
		-1,    // negative max age = delete cookie
		"/",   // path
		"",    // domain
		false, // secure
		true,  // http only
	)

	c.JSON(http.StatusOK, gin.H{"message": "Successfully logged out"})
}

// Helper function to generate random token
func generateToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := cryptorand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Helper function to send confirmation email
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

	// Email subject with emoji to increase deliverability
	subject := "🔐 Confirm Your Account"

	// HTML email body
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
