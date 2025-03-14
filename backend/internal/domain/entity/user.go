package entity

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	GoogleID *string `json:"google_id" gorm:"uniqueIndex:idx_google_id,where:google_id IS NOT NULL"` // Unique only when not null
	Email    string  `json:"email" gorm:"unique"`
	Password string  `json:"password"`
	Name     string  `json:"name"`
	Picture  string  `json:"picture"`
	Status   string  `json:"status" gorm:"default:pending"`
}
