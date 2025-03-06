package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
)

var (
	// Key used to authenticate the session
	key = []byte("super-secret-key")
	// Store is the session store
	store = sessions.NewCookieStore(key)
)

// SessionMiddleware initializes a session for each request
func SessionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		session, _ := store.Get(c.Request, "session-name")

		// Save the session before the request is completed
		defer session.Save(c.Request, c.Writer)

		// Set the session in the context
		c.Set("session", session)

		c.Next()
	}
}
