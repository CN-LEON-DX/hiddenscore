package entity

import (
	"gorm.io/gorm"
)

type TmpUser struct {
	gorm.Model
	UserID      uint   `json:"user_id"`
	Status      string `json:"status"`
	TokenRemain string `json:"token_remain"`
}
