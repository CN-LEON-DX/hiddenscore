package repository

import "backend/internal/domain/entity"

type UserRepository interface {
	GetAllUsers() ([]entity.User, error)
}
