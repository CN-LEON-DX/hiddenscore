package entity

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	GoogleID string `json:"google_id"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Picture  string `json:"picture"`
}
