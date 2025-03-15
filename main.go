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
	godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Print current working directory and list files for debugging
	cwd, _ := os.Getwd()
	log.Printf("Current working directory: %s", cwd)

	frontendDir := "./frontend"

	// Debug: List files in the frontend directory
	log.Printf("Listing files in %s:", frontendDir)
	filepath.Walk(frontendDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Printf("Error accessing path %q: %v", path, err)
			return nil
		}
		rel, _ := filepath.Rel(frontendDir, path)
		if rel == "." {
			return nil
		}
		if info.IsDir() {
			log.Printf("DIR: %s/", rel)
		} else {
			log.Printf("FILE: %s (%d bytes)", rel, info.Size())
		}
		return nil
	})

	mux := http.NewServeMux()

	mux.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","port":"%s"}`, port)
	})

	// Add a debugging endpoint to show file structure
	mux.HandleFunc("/debug", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		fmt.Fprintf(w, "Current working directory: %s\n", cwd)
		fmt.Fprintf(w, "Listing files in %s:\n", frontendDir)
		filepath.Walk(frontendDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				fmt.Fprintf(w, "Error accessing path %q: %v\n", path, err)
				return nil
			}
			rel, _ := filepath.Rel(frontendDir, path)
			if rel == "." {
				return nil
			}
			if info.IsDir() {
				fmt.Fprintf(w, "DIR: %s/\n", rel)
			} else {
				fmt.Fprintf(w, "FILE: %s (%d bytes)\n", rel, info.Size())
			}
			return nil
		})
		return
	})

	// Create simple middleware for logging requests
	logMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Incoming request: %s %s", r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
		})
	}

	// Serve static files properly
	fileServer := http.FileServer(http.Dir(frontendDir))
	mux.Handle("/assets/", fileServer)
	mux.Handle("/static/", fileServer)
	mux.Handle("/src/", fileServer) // Thêm đường dẫn src để phục vụ các file React
	mux.Handle("/public/", fileServer)
	mux.Handle("/node_modules/", fileServer)

	// Root handler for all other paths
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Try to serve directly from file system first
		path := filepath.Join(frontendDir, r.URL.Path)

		// Log the actual file path we're looking for
		log.Printf("Looking for file: %s", path)

		// Check if file exists
		_, err := os.Stat(path)
		if err == nil && !strings.HasSuffix(path, "/") {
			log.Printf("Serving file directly: %s", path)
			http.ServeFile(w, r, path)
			return
		}

		// For all other requests serve index.html (SPA approach)
		if !strings.HasPrefix(r.URL.Path, "/api") {
			indexPath := filepath.Join(frontendDir, "index.html")
			log.Printf("Serving index.html (path: %s)", indexPath)

			// Check if index.html exists
			_, err := os.Stat(indexPath)
			if err != nil {
				log.Printf("ERROR: index.html not found at %s: %v", indexPath, err)
				http.Error(w, "index.html not found", http.StatusNotFound)
				return
			}

			http.ServeFile(w, r, indexPath)
		} else {
			http.NotFound(w, r)
		}
	})

	log.Printf("Server listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, logMiddleware(mux)))
}
