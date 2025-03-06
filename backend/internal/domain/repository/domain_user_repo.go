package repository

import "backend/internal/domain/entity"

type UserRepository interface {
	GetAllUsers() ([]entity.User, error)
	FindUserByGoogleID(googleID string) (entity.User, error)
	CreateUser(user entity.User) (entity.User, error)
	GetUserByID(id uint) (entity.User, error)
}
