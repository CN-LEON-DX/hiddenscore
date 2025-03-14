package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	GoogleID  string         `json:"google_id,omitempty" gorm:"uniqueIndex"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null"`
	Password  string         `json:"password,omitempty"`
	Name      string         `json:"name" gorm:"not null"`
	Status    string         `json:"status" gorm:"not null;default:pending"`
	Picture   string         `json:"picture,omitempty"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
