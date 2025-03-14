package repository

import (
	"backend/internal/domain/models"

	"gorm.io/gorm"
)

// TmpRepository implements repository.TmpRepository interface
type TmpRepository struct {
	DB *gorm.DB
}

// Create stores a new temporary user record
func (r *TmpRepository) Create(tmp *models.TmpUser) error {
	// Store the token in TimeRemain for DB storage
	tmp.TimeRemain = tmp.TokenRemain
	return r.DB.Create(tmp).Error
}

// FindByToken finds a temporary user record by token
func (r *TmpRepository) FindByToken(token string) (*models.TmpUser, error) {
	var tmp models.TmpUser

	// Find by token_remain column
	if err := r.DB.Where("token_remain = ?", token).First(&tmp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	// Set the TokenRemain field for application use
	tmp.TokenRemain = tmp.TimeRemain

	return &tmp, nil
}

// Update updates a temporary user record
func (r *TmpRepository) Update(tmp *models.TmpUser) error {
	// Make sure TimeRemain and TokenRemain are synchronized
	tmp.TimeRemain = tmp.TokenRemain
	return r.DB.Save(tmp).Error
}

// FindByUserID finds a temporary user record by user ID
func (r *TmpRepository) FindByUserID(userID uint, tmp *models.TmpUser) error {
	err := r.DB.Where("user_id = ?", userID).First(tmp).Error
	if err != nil {
		return err
	}

	// Set the TokenRemain field for application use
	tmp.TokenRemain = tmp.TimeRemain
	return nil
}
