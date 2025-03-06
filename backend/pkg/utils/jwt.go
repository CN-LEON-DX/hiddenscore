// backend/utils/jwt.go
package utils

import (
	"backend/internal/domain/entity"
	"github.com/dgrijalva/jwt-go"
	"os"
	"time"
)

func GenerateToken(user entity.User) (string, error) {
	//tokenLifespan := 24 * 60 * 60 // 1 day
	claims := jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
