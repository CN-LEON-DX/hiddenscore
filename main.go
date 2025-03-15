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
	mux.Handle("/static/", fileServer)
	mux.Handle("/assets/", fileServer)

	// For any other request, serve the index.html
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Skip API routes
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		// Serve index.html for any other route
		indexPath := filepath.Join(frontendDir, "index.html")
		http.ServeFile(w, r, indexPath)
	})

	// Start the server
	log.Printf("Server listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
