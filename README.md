# HiddenScore

A modern basic web application with comprehensive user management base on Clean Pattern
, authentication system, and admin dashboard.

## Features

- **User Authentication**: Secure login and registration system with email confirmation
- **Admin Dashboard**: Specialized admin panel for managing users and content
- **JWT Authentication**: Token-based authentication for secure API access
- **Role-Based Access Control**: Different permissions for regular users and administrators
- **Google OAuth Integration**: Allow users to sign in with their Google accounts
- **Responsive Design**: Modern UI that works across desktop and mobile devices
- **Cart System**: Shopping cart functionality for e-commerce features
- **Some features AI will be add soon**: Loading ...

##  Prerequisites

- Node.js (v14 or higher)
- Go (v1.16 or higher)
- PostgreSQL
- Git

## 🔧 Installation

### Clone the Repository

```bash
git clone https://github.com/CN-LEON-DX/hiddenscore.git
cd hiddenscore
```

### Backend Setup

```bash
cd backend

# Install Go dependencies
go mod download

# Set up environment variables
cp .env.example .env
# Edit .env file with your database credentials and other settings

# Run migrations
go run cmd/migrate/main.go

# Start the backend server
go run main.go
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your API endpoint

# Start the development server
npm run dev

##  Project Structure

```
![{FA126786-1E08-4651-A6ED-82CB5E16FF51}](https://github.com/user-attachments/assets/d4a20ec3-d253-4a40-83d0-0a46f1f943c2)

```

## 🛠️ Technologies

### Backend
- Go
- Gin (Web framework)
- GORM (ORM)
- PostgreSQL
- JWT Authentication
- Google OAuth2

### Frontend
- React
- TypeScript
- React Router
- Tailwind CSS
- Axios

##  Environment Variables

### Backend
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET_KEY`: Secret key for JWT token generation
- `APP_ENV`: Application environment (development/production)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Frontend
- `VITE_BACKEND_API`: URL for the backend API

##  Running Tests

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm test
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- CN-LEON-DX - Project lead and main developer

## Acknowledgements

- [React](https://reactjs.org/)
- [Go](https://golang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Gin](https://github.com/gin-gonic/gin)
- [GORM](https://gorm.io/) 
