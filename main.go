package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file if available
	godotenv.Load()

	// Get the port from Heroku's environment or use default 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize router
	mux := http.NewServeMux()

	// Serve static files from frontend/dist
	frontendDir := "./frontend/dist"

	// API endpoint to get port (for debugging)
	mux.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","port":"%s"}`, port)
	})

	// Logging middleware to debug requests
	logMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Incoming request: %s %s", r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
		})
	}

	// Serve static files for the frontend using a stripped prefix
	fileServer := http.FileServer(http.Dir(frontendDir))
	mux.Handle("/assets/", http.StripPrefix("/", fileServer))
	mux.Handle("/static/", http.StripPrefix("/", fileServer))
	mux.Handle("/css/", http.StripPrefix("/", fileServer))
	mux.Handle("/js/", http.StripPrefix("/", fileServer))

	// Handle root and any other path
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Direct file path check
		path := filepath.Join(frontendDir, r.URL.Path)
		_, err := os.Stat(path)

		if err == nil && !strings.HasSuffix(path, "/") {
			// If file exists, serve it directly
			http.ServeFile(w, r, path)
			return
		}

		// For any path that doesn't match a file, serve index.html
		// This enables client-side routing (SPA)
		if !strings.HasPrefix(r.URL.Path, "/api") {
			indexPath := filepath.Join(frontendDir, "index.html")
			log.Printf("Serving index.html for path: %s", r.URL.Path)
			http.ServeFile(w, r, indexPath)
		} else {
			http.NotFound(w, r)
		}
	})

	// Start the server with logging middleware
	log.Printf("Server listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, logMiddleware(mux)))
}
