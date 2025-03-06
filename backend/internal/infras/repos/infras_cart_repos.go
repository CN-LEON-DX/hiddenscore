package repository

import (
	"backend/internal/domain/entity"
	"database/sql"
	"time"
)

type PostgresCartRepository struct {
	DB *sql.DB
}

// FindActiveCartByUserID finds the active cart for a user
func (r *PostgresCartRepository) FindActiveCartByUserID(userID uint) (*entity.Cart, error) {
	var cart entity.Cart
	var createdAt, updatedAt time.Time

	err := r.DB.QueryRow("SELECT id, user_id, active, created_at, updated_at FROM carts WHERE user_id = $1 AND active = true", userID).
		Scan(&cart.ID, &cart.UserID, &cart.Active, &createdAt, &updatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No active cart found
		}
		return nil, err
	}

	cart.CreatedAt = createdAt
	cart.UpdatedAt = updatedAt

	// Get cart items
	items, err := r.GetCartItems(cart.ID)
	if err != nil {
		return nil, err
	}
	cart.CartItems = items

	return &cart, nil
}

// CreateCart creates a new cart for a user
func (r *PostgresCartRepository) CreateCart(userID uint) (*entity.Cart, error) {
	now := time.Now()

	stmt, err := r.DB.Prepare("INSERT INTO carts (user_id, active, created_at, updated_at) VALUES ($1, true, $2, $3) RETURNING id")
	if err != nil {
		return nil, err
	}

	var id uint
	err = stmt.QueryRow(userID, now, now).Scan(&id)
	if err != nil {
		return nil, err
	}

	cart := &entity.Cart{
		UserID:    userID,
		Active:    true,
		CartItems: []entity.CartItem{},
	}
	cart.ID = id
	cart.CreatedAt = now
	cart.UpdatedAt = now

	return cart, nil
}

// AddItem adds a product to a cart
func (r *PostgresCartRepository) AddItem(cartID uint, productID uint, quantity int) error {
	// First check if the item already exists in the cart
	var exists bool
	var cartItemID uint
	var currentQuantity int

	err := r.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM cart_items WHERE cart_id = $1 AND product_id = $2)", cartID, productID).Scan(&exists)
	if err != nil {
		return err
	}

	now := time.Now()

	if exists {
		// Get the current cart item
		err = r.DB.QueryRow("SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2", cartID, productID).
			Scan(&cartItemID, &currentQuantity)
		if err != nil {
			return err
		}

		// Update quantity
		_, err = r.DB.Exec("UPDATE cart_items SET quantity = $1, updated_at = $2 WHERE id = $3",
			currentQuantity+quantity, now, cartItemID)
		return err
	}

	// Insert new item
	_, err = r.DB.Exec("INSERT INTO cart_items (cart_id, product_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
		cartID, productID, quantity, now, now)
	return err
}

// UpdateItemQuantity updates the quantity of a cart item
func (r *PostgresCartRepository) UpdateItemQuantity(cartItemID uint, quantity int) error {
	now := time.Now()

	// Delete item if quantity is 0
	if quantity <= 0 {
		return r.RemoveItem(cartItemID)
	}

	_, err := r.DB.Exec("UPDATE cart_items SET quantity = $1, updated_at = $2 WHERE id = $3",
		quantity, now, cartItemID)
	return err
}

// RemoveItem removes an item from a cart
func (r *PostgresCartRepository) RemoveItem(cartItemID uint) error {
	_, err := r.DB.Exec("DELETE FROM cart_items WHERE id = $1", cartItemID)
	return err
}

// GetCartItems gets all items in a cart
func (r *PostgresCartRepository) GetCartItems(cartID uint) ([]entity.CartItem, error) {
	rows, err := r.DB.Query(`
		SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
			   p.id, p.name, p.description, p.price, p.image_url, p.stock, p.created_at, p.updated_at
		FROM cart_items ci
		JOIN products p ON ci.product_id = p.id
		WHERE ci.cart_id = $1
	`, cartID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []entity.CartItem
	for rows.Next() {
		var item entity.CartItem
		var product entity.Product
		var itemCreatedAt, itemUpdatedAt, productCreatedAt, productUpdatedAt time.Time

		err := rows.Scan(
			&item.ID, &item.CartID, &item.ProductID, &item.Quantity, &itemCreatedAt, &itemUpdatedAt,
			&product.ID, &product.Name, &product.Description, &product.Price, &product.ImageURL, &product.Stock, &productCreatedAt, &productUpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		item.CreatedAt = itemCreatedAt
		item.UpdatedAt = itemUpdatedAt
		product.CreatedAt = productCreatedAt
		product.UpdatedAt = productUpdatedAt
		item.Product = product
		items = append(items, item)
	}

	return items, nil
}

// CloseCart marks a cart as inactive (completed order)
func (r *PostgresCartRepository) CloseCart(cartID uint) error {
	now := time.Now()
	_, err := r.DB.Exec("UPDATE carts SET active = false, updated_at = $1 WHERE id = $2", now, cartID)
	return err
}
