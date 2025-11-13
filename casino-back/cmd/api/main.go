package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/juanpicasti/casino-back/internal/database"
	"github.com/juanpicasti/casino-back/internal/handlers"
	custommw "github.com/juanpicasti/casino-back/internal/middleware"
)

func main() {
	// Initialize database
	dbPath := getEnv("DB_PATH", "./database/casino.db")
	if err := database.InitDB(dbPath); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.CloseDB()

	// Create Chi router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes (no authentication required)
	r.Route("/api", func(r chi.Router) {
		r.Post("/register", handlers.Register)
		r.Post("/login", handlers.Login)

		// Password reset endpoints (VULNERABLE: A02 - MD5 tokens)
		r.Post("/auth/forgot-password", handlers.ForgotPassword)
		r.Get("/auth/reset-password/{token}", handlers.VerifyResetToken)
		r.Post("/auth/reset-password", handlers.ResetPassword)

		// Protected routes (authentication required)
		r.Group(func(r chi.Router) {
			r.Use(custommw.AuthMiddleware)

			// User profile
			r.Get("/user/profile", handlers.GetProfile)
			r.Get("/user/profile/{id}", handlers.GetUserProfileByID) // VULNERABLE: IDOR endpoint
			r.Put("/user/profile", handlers.UpdateProfile)

			// Balance management
			r.Get("/balance", handlers.GetBalance)
			r.Post("/balance/add", handlers.AddBalance)
			r.Post("/balance/deduct", handlers.DeductBalance)

			// Bets
			r.Post("/bets", handlers.CreateBet)
			r.Get("/bets", handlers.GetBets)
			r.Get("/bets/{id}", handlers.GetBetByID)
			r.Put("/bets/{id}", handlers.UpdateBetResult)
		})
	})

	// Health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s...", port)
	log.Printf("CORS enabled for: http://localhost:5173, http://localhost:5174, http://localhost:5175")
	log.Printf("⚠️  WARNING: This is an educational project with intentional vulnerabilities")
	log.Printf("    DO NOT use in production or expose to the internet!")

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
