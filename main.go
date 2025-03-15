package main

import (
	"fmt"
	"log"
	"mime"
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

	// Đăng ký MIME types cho các loại file khác nhau
	mime.AddExtensionType(".js", "application/javascript")
	mime.AddExtensionType(".mjs", "application/javascript")
	mime.AddExtensionType(".jsx", "application/javascript")
	mime.AddExtensionType(".ts", "application/javascript")
	mime.AddExtensionType(".tsx", "application/javascript")
	mime.AddExtensionType(".css", "text/css")
	mime.AddExtensionType(".json", "application/json")
	mime.AddExtensionType(".html", "text/html")
	mime.AddExtensionType(".svg", "image/svg+xml")
	mime.AddExtensionType(".png", "image/png")
	mime.AddExtensionType(".jpg", "image/jpeg")
	mime.AddExtensionType(".jpeg", "image/jpeg")
	mime.AddExtensionType(".gif", "image/gif")
	mime.AddExtensionType(".ico", "image/x-icon")
	mime.AddExtensionType(".woff", "font/woff")
	mime.AddExtensionType(".woff2", "font/woff2")
	mime.AddExtensionType(".ttf", "font/ttf")
	mime.AddExtensionType(".otf", "font/otf")
	mime.AddExtensionType(".eot", "application/vnd.ms-fontobject")

	// Print current working directory and list files for debugging
	cwd, _ := os.Getwd()
	log.Printf("Current working directory: %s", cwd)

	// Sử dụng thư mục dist
	frontendDir := "./frontend/dist"

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

	// Simple handler for all requests
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// API endpoints
		if strings.HasPrefix(r.URL.Path, "/api") {
			if r.URL.Path == "/api" {
				w.Header().Set("Content-Type", "application/json")
				fmt.Fprintf(w, `{"status":"ok","port":"%s"}`, port)
			} else {
				http.NotFound(w, r)
			}
			return
		}

		// Direct file path
		path := filepath.Join(frontendDir, r.URL.Path)

		// Check if file exists and serve it
		_, err := os.Stat(path)
		if err == nil && !strings.HasSuffix(path, "/") {
			ext := filepath.Ext(path)
			mimeType := mime.TypeByExtension(ext)
			if mimeType != "" {
				w.Header().Set("Content-Type", mimeType)
			}
			http.ServeFile(w, r, path)
			return
		}

		// For any other path, serve index.html
		indexPath := filepath.Join(frontendDir, "index.html")
		w.Header().Set("Content-Type", "text/html")
		http.ServeFile(w, r, indexPath)
	})

	// Register our handler for all paths
	mux.Handle("/", handler)

	log.Printf("Server listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, logMiddleware(mux)))
}
