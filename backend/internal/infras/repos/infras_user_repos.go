package repos

import (
	"backend/internal/domain/entity"
	"errors"
	"time"

	"gorm.io/gorm"
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

	// Check if this is an update (ID > 0)
	if user.ID > 0 {
		// This is an update
		user.UpdatedAt = now
		err := r.DB.Save(&user).Error
		return user, err
	}

	// This is a new user
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

// Add these methods for models.User support
func (r *PostgresUserRepository) Create(user *entity.User) error {
	return r.DB.Create(user).Error
}

func (r *PostgresUserRepository) FindByID(id uint) (*entity.User, error) {
	var user entity.User
	if err := r.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *PostgresUserRepository) Update(user *entity.User) error {
	return r.DB.Save(user).Error
}
