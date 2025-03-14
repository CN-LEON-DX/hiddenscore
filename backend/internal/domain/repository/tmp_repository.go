package repository

import (
	"backend/internal/domain/models"
)

type TmpRepository interface {
	// For models.TmpUser
	Create(tmp *models.TmpUser) error
	FindByToken(token string) (*models.TmpUser, error)
	Update(tmp *models.TmpUser) error
	FindByUserID(userID uint, tmp *models.TmpUser) error
}
