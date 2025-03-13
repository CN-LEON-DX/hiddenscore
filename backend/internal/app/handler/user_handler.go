package handler

import (
	"backend/internal/domain/repository"
	"encoding/json"
	"net/http"
)

type UserHandler struct {
	Repo repository.UserRepository
}

func (h *UserHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.Repo.GetAllUsers()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(users)
}
