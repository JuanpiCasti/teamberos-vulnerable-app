package handlers

import (
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/juanpicasti/casino-back/internal/database"
	"github.com/juanpicasti/casino-back/internal/models"
)

// ForgotPassword handles password reset token generation
// VULNERABLE: A02 Cryptographic Failures - Uses MD5 for token generation
func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate email
	if req.Email == "" || !strings.Contains(req.Email, "@") {
		http.Error(w, "Valid email is required", http.StatusBadRequest)
		return
	}

	// Find user by email
	var user models.User
	err := database.DB.Get(&user, `SELECT * FROM users WHERE email = ?`, req.Email)
	if err != nil {
		// SECURITY: Return generic message to prevent email enumeration
		// Even if user doesn't exist, we return success
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "If an account exists with that email, you'll receive reset instructions",
		})
		return
	}

	// VULNERABLE: Generate predictable MD5 token - A02 Cryptographic Failures
	// This is intentional for educational purposes
	// Attack: token = MD5(victim_email) - completely predictable if you know the email
	// In production, use crypto/rand to generate cryptographically secure random tokens
	token := fmt.Sprintf("%x", md5.Sum([]byte(req.Email)))

	// Store token in database (allows multiple tokens per user - no expiration)
	_, err = database.DB.Exec(
		`INSERT INTO password_reset_tokens (user_id, token, email) VALUES (?, ?, ?)`,
		user.ID, token, req.Email,
	)
	if err != nil {
		// If token already exists, that's fine - return success anyway
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "If an account exists with that email, you'll receive reset instructions",
		})
		return
	}

	// Return generic success message
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "If an account exists with that email, you'll receive reset instructions",
	})
}

// VerifyResetToken verifies a password reset token and returns the associated email
func VerifyResetToken(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		http.Error(w, "Token is required", http.StatusBadRequest)
		return
	}

	// Look up token in database
	var resetToken models.PasswordResetToken
	err := database.DB.Get(&resetToken, `SELECT * FROM password_reset_tokens WHERE token = ?`, token)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid or expired reset token", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Return the email associated with this token
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"email": resetToken.Email,
	})
}

// ResetPassword handles password reset with token validation
func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Token == "" || req.NewPassword == "" {
		http.Error(w, "Token and new password are required", http.StatusBadRequest)
		return
	}

	if len(req.NewPassword) < 6 {
		http.Error(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	// Verify token exists
	var resetToken models.PasswordResetToken
	err := database.DB.Get(&resetToken, `SELECT * FROM password_reset_tokens WHERE token = ?`, req.Token)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid or expired reset token", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Hash new password
	passwordHash, err := models.HashPassword(req.NewPassword)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Start transaction
	tx, err := database.DB.Beginx()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Update user's password
	_, err = tx.Exec(
		`UPDATE users SET password_hash = ? WHERE id = ?`,
		passwordHash, resetToken.UserID,
	)
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	// Delete the used token
	_, err = tx.Exec(`DELETE FROM password_reset_tokens WHERE token = ?`, req.Token)
	if err != nil {
		http.Error(w, "Failed to invalidate token", http.StatusInternalServerError)
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Return success
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Password reset successful",
	})
}
