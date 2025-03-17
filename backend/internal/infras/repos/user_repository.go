package repos

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

// ----- User Creation and Retrieval -----

// CreateUser creates a new user entity
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

// Create creates a user from models.User
func (r *UserRepository) Create(user *models.User) error {
	return r.DB.Create(user).Error
}

// GetUserByID gets a user by ID
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

// FindByID finds a user by ID and returns a pointer
func (r *UserRepository) FindByID(id uint) (*entity.User, error) {
	var user entity.User
	if err := r.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// FindByEmail finds a user by email
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

// FindUserByGoogleID finds a user by Google ID
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

// GetAllUsers gets all users
func (r *UserRepository) GetAllUsers() ([]entity.User, error) {
	var users []entity.User
	err := r.DB.Find(&users).Error
	return users, err
}

// ----- User Updates -----

// UpdateUser updates a user entity
func (r *UserRepository) UpdateUser(user entity.User) error {
	return r.DB.Save(&user).Error
}

// Update updates a user model
func (r *UserRepository) Update(user *models.User) error {
	return r.DB.Save(user).Error
}

// UpdatePassword updates only the password field
func (r *UserRepository) UpdatePassword(userID uint, newPassword string) error {
	return r.DB.Model(&entity.User{}).Where("id = ?", userID).Update("password", newPassword).Error
}

// UpdateUserRole updates only the role field
func (r *UserRepository) UpdateUserRole(userID uint, role string) error {
	return r.DB.Model(&entity.User{}).Where("id = ?", userID).Update("role", role).Error
}

// ----- Statistics -----

// CountUsers counts the total number of users
func (r *UserRepository) CountUsers() (int64, error) {
	var count int64
	result := r.DB.Model(&entity.User{}).Count(&count)
	return count, result.Error
}
