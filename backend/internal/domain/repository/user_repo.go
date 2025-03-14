package repository

import (
	"backend/internal/domain/entity"
	"backend/internal/domain/models"
)

type UserRepository interface {
	GetAllUsers() ([]entity.User, error)
	FindUserByGoogleID(googleID string) (entity.User, error)
	CreateUser(user entity.User) (entity.User, error)
	GetUserByID(id uint) (entity.User, error)
	FindByEmail(email string) (*entity.User, error)

	// Add these methods for models.User
	Create(user *models.User) error
	FindByID(id uint) (*models.User, error)
	Update(user *models.User) error
}
