package handler

import (
	"backend/internal/domain/entity"
	"backend/internal/domain/repository"
	"github.com/gin-gonic/gin"
	"net/http"
)

type ProductHandler struct {
	Repo repository.ProductRepository
}

func (p *ProductHandler) GetProducts(c *gin.Context) {
	var products []entity.Product
	if err := p.Repo.GetAllProducts(&products); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}
