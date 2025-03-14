package models

import (
	"time"

	"gorm.io/gorm"
)

type TmpUser struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"not null;column:user_id"`
	Status      string         `json:"status" gorm:"not null;default:'false'"`
	TokenRemain string         `json:"token_remain" gorm:"-"`
	TimeRemain  string         `json:"-" gorm:"column:token_remain"`
	CreatedAt   time.Time      `json:"created_at" gorm:"autoCreateTime"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	User        User           `json:"-" gorm:"foreignKey:UserID"`
}

// TableName
func (TmpUser) TableName() string {
	return "tmp_users"
}
