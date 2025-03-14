package repository

import (
	"backend/internal/domain/entity"
	"backend/internal/domain/models"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type UserRepository struct {
	DB *gorm.DB
}

// Methods for models.User
func (r *UserRepository) Create(user *models.User) error {
	return r.DB.Create(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*entity.User, error) {
	var user entity.User
	if err := r.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *models.User) error {
	return r.DB.Save(user).Error
}

// Methods for entity.User (to implement UserRepository interface)
func (r *UserRepository) CreateUser(user entity.User) (entity.User, error) {
	now := time.Now()

	if user.ID > 0 {
		user.UpdatedAt = now
		err := r.DB.Save(&user).Error
		if err != nil {
			return user, fmt.Errorf("failed to update user: %w", err)
		}
		return user, err
	}

	user.CreatedAt = now
	user.UpdatedAt = now
	err := r.DB.Create(&user).Error
	if err != nil {
		return user, fmt.Errorf("database error creating user: %w", err)
	}

	return user, err
}

func (r *UserRepository) FindUserByGoogleID(googleID string) (entity.User, error) {
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

func (r *UserRepository) GetUserByID(id uint) (entity.User, error) {
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

func (r *UserRepository) GetAllUsers() ([]entity.User, error) {
	var users []entity.User
	err := r.DB.Find(&users).Error
	return users, err
}
