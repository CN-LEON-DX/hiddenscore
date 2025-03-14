package repository

import (
	"backend/internal/domain/entity"
	"errors"
	"gorm.io/gorm"
	"time"
)

type PostgresUserRepository struct {
	DB *gorm.DB
}

func (r *PostgresUserRepository) FindByEmail(email string) (*entity.User, error) {
	var user entity.User
	if err := r.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
func (r *PostgresUserRepository) GetAllUsers() ([]entity.User, error) {
	var users []entity.User
	err := r.DB.Find(&users).Error
	return users, err
}

func (r *PostgresUserRepository) FindUserByGoogleID(googleID string) (entity.User, error) {
	var user entity.User
	err := r.DB.Where("google_id = ?", googleID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return entity.User{}, errors.New("user not found")
		}
		return entity.User{}, err
	}
	return user, nil
}

func (r *PostgresUserRepository) CreateUser(user entity.User) (entity.User, error) {
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now
	err := r.DB.Create(&user).Error
	return user, err
}

func (r *PostgresUserRepository) GetUserByID(id uint) (entity.User, error) {
	var user entity.User
	err := r.DB.First(&user, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return entity.User{}, errors.New("user not found")
		}
		return entity.User{}, err
	}
	return user, nil
}
