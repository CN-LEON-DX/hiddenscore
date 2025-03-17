package repository

import "backend/internal/domain/entity"

type UserRepository interface {
	// User Creation and Retrieval
	CreateUser(user entity.User) (entity.User, error)
	FindByEmail(email string) (*entity.User, error)
	FindByID(id uint) (*entity.User, error)
	FindUserByGoogleID(googleID string) (entity.User, error)
	GetUserByID(id uint) (entity.User, error)
	GetAllUsers() ([]entity.User, error)

	// User Updates
	UpdateUser(user entity.User) error
	UpdatePassword(userID uint, newPassword string) error
	UpdateUserRole(userID uint, role string) error

	// Statistics
	CountUsers() (int64, error)
}
