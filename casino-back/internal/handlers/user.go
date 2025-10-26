package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/juanpicasti/casino-back/internal/database"
	"github.com/juanpicasti/casino-back/internal/middleware"
	"github.com/juanpicasti/casino-back/internal/models"
)

// GetProfile returns the authenticated user's profile
// TODO: This endpoint will be made vulnerable to IDOR attack in the future
// by accepting a query parameter ?id=<user_id> without proper authorization checks
func GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Fetch user from database
	var user models.User
	err := database.DB.Get(&user, `SELECT * FROM users WHERE id = ?`, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Return user profile (without password)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user.ToResponse())
}

// UpdateProfile updates the authenticated user's profile
func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Username == "" && req.Email == "" {
		http.Error(w, "Nothing to update", http.StatusBadRequest)
		return
	}

	// Build update query dynamically
	query := "UPDATE users SET "
	args := []interface{}{}
	updates := []string{}

	if req.Username != "" {
		updates = append(updates, "username = ?")
		args = append(args, req.Username)
	}
	if req.Email != "" {
		updates = append(updates, "email = ?")
		args = append(args, req.Email)
	}

	// Join updates
	for i, update := range updates {
		if i > 0 {
			query += ", "
		}
		query += update
	}
	query += " WHERE id = ?"
	args = append(args, userID)

	// Execute update
	_, err := database.DB.Exec(query, args...)
	if err != nil {
		http.Error(w, "Failed to update profile. Username or email may already exist", http.StatusConflict)
		return
	}

	// Fetch updated user
	var user models.User
	err = database.DB.Get(&user, `SELECT * FROM users WHERE id = ?`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch updated profile", http.StatusInternalServerError)
		return
	}

	// Return updated profile
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Profile updated successfully",
		"user":    user.ToResponse(),
	})
}
