package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
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

// GetUserProfileByID returns any user's profile by ID
//
// VULNERABLE: A01:2021 - Broken Access Control (IDOR)
// This endpoint demonstrates an Insecure Direct Object Reference vulnerability.
//
// Educational Purpose:
// - Any authenticated user can view ANY other user's profile by changing the ID parameter
// - No authorization check validates if the requesting user has permission to view the target profile
// - Attacker can enumerate user IDs to discover all users and their balances
//
// Attack Vector:
// 1. Attacker authenticates and gets JWT token
// 2. Attacker calls GET /api/user/profile/1, /api/user/profile/2, etc.
// 3. Attacker can view usernames, emails, roles, and balances of all users
//
// Secure Alternative (NOT implemented):
// - Check if ctx.Value(UserIDKey) == targetUserID
// - Or implement role-based access control (only admins can view other profiles)
// - Or remove endpoint entirely and only expose /api/user/profile (own profile)
//
// Example Exploit:
//   curl -H "Authorization: Bearer <token>" http://localhost:8080/api/user/profile/5
//   Returns profile of user ID 5, regardless of who is authenticated
//
// This is intentional for educational purposes in a Web Application Security course.
func GetUserProfileByID(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context (for audit logging only)
	authenticatedUserID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get target user ID from URL parameter
	targetUserIDStr := chi.URLParam(r, "id")
	log.Printf("GetUserProfileByID: Received request for user ID: %s", targetUserIDStr)

	targetUserID, err := strconv.Atoi(targetUserIDStr)
	if err != nil {
		log.Printf("GetUserProfileByID: Invalid user ID format: %s, error: %v", targetUserIDStr, err)
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	log.Printf("GetUserProfileByID: Authenticated user: %d, Target user: %d", authenticatedUserID, targetUserID)

	// VULNERABLE: No authorization check here
	// In a secure implementation, we would check:
	// if authenticatedUserID != targetUserID && userRole != "admin" {
	//     http.Error(w, "Forbidden", http.StatusForbidden)
	//     return
	// }

	// Query user profile with balance using JOIN
	var profile models.UserProfileWithBalance
	query := `
		SELECT
			u.id,
			u.username,
			u.email,
			u.role,
			u.created_at,
			COALESCE(b.amount, 0) as balance,
			b.updated_at as balance_updated_at
		FROM users u
		LEFT JOIN balances b ON u.id = b.user_id
		WHERE u.id = ?
	`

	log.Printf("GetUserProfileByID: Executing query for user ID: %d", targetUserID)
	err = database.DB.Get(&profile, query, targetUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("GetUserProfileByID: User not found: %d", targetUserID)
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		log.Printf("GetUserProfileByID: Database error for user ID %d: %v", targetUserID, err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	log.Printf("GetUserProfileByID: Successfully fetched profile for user ID: %d (username: %s, balance: %.2f)",
		profile.ID, profile.Username, profile.Balance)

	// Log the IDOR attempt (for educational demonstration)
	if authenticatedUserID != targetUserID {
		log.Printf("⚠️  IDOR VULNERABILITY EXPLOITED: User %d accessed profile of user %d",
			authenticatedUserID, targetUserID)
	}

	// Return profile data (including sensitive information)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}
