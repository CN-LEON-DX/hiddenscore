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
	// Tải biến môi trường từ .env nếu tồn tại (cho môi trường local)
	godotenv.Load()

	// Sử dụng PORT từ biến môi trường (Heroku cung cấp)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Port mặc định cho môi trường local
	}

	// MIME types
	mime.AddExtensionType(".js", "application/javascript")
	mime.AddExtensionType(".mjs", "application/javascript")
	mime.AddExtensionType(".jsx", "application/javascript")
	mime.AddExtensionType(".tsx", "application/javascript")
	mime.AddExtensionType(".ts", "application/javascript")
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

	// Ghi log thư mục hiện tại và danh sách tệp cho debug
	cwd, _ := os.Getwd()
	log.Printf("Current working directory: %s", cwd)

	// Trước tiên tìm thư mục frontend/dist, nếu không có thì sử dụng frontend
	var frontendDir string
	distPath := filepath.Join(cwd, "frontend", "dist")
	if _, err := os.Stat(distPath); err == nil {
		frontendDir = "./frontend/dist"
		log.Printf("Using frontend/dist directory")
	} else {
		frontendDir = "./frontend"
		log.Printf("Using frontend directory")
	}

	// In danh sách tệp trong thư mục frontend để debug
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

	// API endpoint
	mux.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","port":"%s"}`, port)
	})

	// Debug endpoint
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

	// Middleware để ghi log các request
	logMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Incoming request: %s %s", r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
		})
	}

	// Handler xử lý tất cả các request
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

		// Đường dẫn tệp trực tiếp
		path := filepath.Join(frontendDir, r.URL.Path)

		// Kiểm tra xem tệp có tồn tại không và phục vụ nó
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

		// Đối với bất kỳ đường dẫn nào khác, phục vụ index.html
		indexPath := filepath.Join(frontendDir, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			w.Header().Set("Content-Type", "text/html")
			http.ServeFile(w, r, indexPath)
		} else {
			// Nếu không tìm thấy index.html, trả về thông báo lỗi
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprintf(w, "404 - Not Found. Could not find index.html in %s", frontendDir)
		}
	})

	// Đăng ký handler cho tất cả các đường dẫn
	mux.Handle("/", handler)

	// Thông báo port mà server đang lắng nghe
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, logMiddleware(mux)))
}
