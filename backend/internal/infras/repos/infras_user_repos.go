package repository

import (
	"backend/internal/domain/entity"
	"database/sql"
	"errors"
	"time"
)

type PostgresUserRepository struct {
	DB *sql.DB
}

func (r *PostgresUserRepository) GetAllUsers() ([]entity.User, error) {
	rows, err := r.DB.Query("SELECT id, google_id, email, name, picture, created_at, updated_at FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []entity.User
	for rows.Next() {
		var user entity.User
		var id uint
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&id, &user.GoogleID, &user.Email, &user.Name, &user.Picture, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		user.ID = id
		user.CreatedAt = createdAt
		user.UpdatedAt = updatedAt
		users = append(users, user)
	}
	return users, nil
}

func (r *PostgresUserRepository) FindUserByGoogleID(googleID string) (entity.User, error) {
	var user entity.User
	var id uint
	var createdAt, updatedAt time.Time

	err := r.DB.QueryRow("SELECT id, google_id, email, name, picture, created_at, updated_at FROM users WHERE google_id = $1", googleID).
		Scan(&id, &user.GoogleID, &user.Email, &user.Name, &user.Picture, &createdAt, &updatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return entity.User{}, errors.New("user not found")
		}
		return entity.User{}, err
	}

	user.ID = id
	user.CreatedAt = createdAt
	user.UpdatedAt = updatedAt

	return user, nil
}

func (r *PostgresUserRepository) CreateUser(user entity.User) (entity.User, error) {
	now := time.Now()

	stmt, err := r.DB.Prepare("INSERT INTO users (google_id, email, name, picture, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id")
	if err != nil {
		return entity.User{}, err
	}

	var id uint
	err = stmt.QueryRow(user.GoogleID, user.Email, user.Name, user.Picture, now, now).Scan(&id)
	if err != nil {
		return entity.User{}, err
	}

	user.ID = id
	user.CreatedAt = now
	user.UpdatedAt = now

	return user, nil
}

func (r *PostgresUserRepository) GetUserByID(id uint) (entity.User, error) {
	var user entity.User
	var createdAt, updatedAt time.Time

	err := r.DB.QueryRow("SELECT id, google_id, email, name, picture, created_at, updated_at FROM users WHERE id = $1", id).
		Scan(&id, &user.GoogleID, &user.Email, &user.Name, &user.Picture, &createdAt, &updatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return entity.User{}, errors.New("user not found")
		}
		return entity.User{}, err
	}

	user.ID = id
	user.CreatedAt = createdAt
	user.UpdatedAt = updatedAt

	return user, nil
}
