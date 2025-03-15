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

	// Serve static files for the frontend
	fileServer := http.FileServer(http.Dir(frontendDir))
	mux.Handle("/assets/", fileServer)
	mux.Handle("/static/", fileServer)
	mux.Handle("/css/", fileServer)
	mux.Handle("/js/", fileServer)

	// Also serve files at the root level of dist
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// First try to serve as a static file from dist directory
		path := filepath.Join(frontendDir, r.URL.Path)

		// Check if file exists at the path
		_, err := os.Stat(path)
		if err == nil {
			http.FileServer(http.Dir(frontendDir)).ServeHTTP(w, r)
			return
		}

		// If not a static file and not an API route, serve index.html
		if !strings.HasPrefix(r.URL.Path, "/api") {
			indexPath := filepath.Join(frontendDir, "index.html")
			http.ServeFile(w, r, indexPath)
		} else {
			http.NotFound(w, r)
		}
	})

	// Start the server
	log.Printf("Server listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
