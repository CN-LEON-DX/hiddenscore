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

	// Create custom file server with MIME type handling
	fileServerWithMime := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(frontendDir, r.URL.Path)

		// Determine Content-Type based on file extension
		ext := filepath.Ext(path)
		mimeType := mime.TypeByExtension(ext)
		if mimeType != "" {
			w.Header().Set("Content-Type", mimeType)
		}

		http.FileServer(http.Dir(frontendDir)).ServeHTTP(w, r)
	})

	// Create simple middleware for logging requests
	logMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Incoming request: %s %s", r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
		})
	}

	// Serve static files with MIME handling
	mux.Handle("/assets/", fileServerWithMime)
	mux.Handle("/static/", fileServerWithMime)
	mux.Handle("/src/", fileServerWithMime)
	mux.Handle("/public/", fileServerWithMime)
	mux.Handle("/node_modules/", fileServerWithMime)
	mux.Handle("/dist/", fileServerWithMime)

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

			// Determine Content-Type based on file extension
			ext := filepath.Ext(path)
			mimeType := mime.TypeByExtension(ext)
			if mimeType != "" {
				w.Header().Set("Content-Type", mimeType)
			}

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
				// Try dist/index.html as fallback
				distIndexPath := filepath.Join(frontendDir, "dist", "index.html")
				_, distErr := os.Stat(distIndexPath)
				if distErr == nil {
					log.Printf("Serving dist/index.html as fallback")
					w.Header().Set("Content-Type", "text/html")
					http.ServeFile(w, r, distIndexPath)
					return
				}

				log.Printf("ERROR: index.html not found at %s: %v", indexPath, err)
				http.Error(w, "index.html not found", http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "text/html")
			http.ServeFile(w, r, indexPath)
		} else {
			http.NotFound(w, r)
		}
	})

	log.Printf("Server listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, logMiddleware(mux)))
}
