package main

import (
	"backend/internal/app/handler"
	"backend/internal/infras/database"
	repository "backend/internal/infras/repos"
	"github.com/gin-gonic/gin"
	"log"
)

func main() {
	db, err := database.Connect()
	if err != nil {
		log.Fatal(err)
	}

	userRepo := &repository.PostgresUserRepository{DB: db}
	userHandler := &handler.UserHandler{Repo: userRepo}

	r := gin.Default()
	r.GET("/users", func(c *gin.Context) {
		userHandler.GetUsers(c.Writer, c.Request)
	})

	if err := r.Run(":8081"); err != nil {
		log.Fatal(err)
	}
}
