package repository

import (
	"backend/internal/domain/entity"
	"database/sql"
)

type PostgresUserRepository struct {
	DB *sql.DB
}

func (r *PostgresUserRepository) GetAllUsers() ([]entity.User, error) {
	rows, err := r.DB.Query("SELECT id, username, email, password, created_at, updated_at FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []entity.User
	for rows.Next() {
		var user entity.User
		if err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}
