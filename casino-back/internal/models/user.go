package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int       `db:"id" json:"id"`
	Username     string    `db:"username" json:"username"`
	Email        string    `db:"email" json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	Role         string    `db:"role" json:"role"` // "player" or "admin"
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

// UserRegistration represents the data needed to register a new user
type UserRegistration struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserLogin represents the data needed for login
type UserLogin struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserResponse is the safe user data to return (no password hash)
type UserResponse struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// HashPassword hashes a plain text password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPasswordHash compares a password with a hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ToResponse converts a User to a UserResponse (removes sensitive data)
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
	}
}

// UserProfileWithBalance represents a user profile including balance information
// Used for the IDOR-vulnerable endpoint
type UserProfileWithBalance struct {
	ID               int        `db:"id" json:"id"`
	Username         string     `db:"username" json:"username"`
	Email            string     `db:"email" json:"email"`
	Role             string     `db:"role" json:"role"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
	Balance          float64    `db:"balance" json:"balance"`
	BalanceUpdatedAt *time.Time `db:"balance_updated_at" json:"balance_updated_at"`
}

// ForgotPasswordRequest represents the request to initiate password reset
type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// ResetPasswordRequest represents the request to reset password with token
type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// PasswordResetToken represents a password reset token in the database
type PasswordResetToken struct {
	ID        int       `db:"id" json:"id"`
	UserID    int       `db:"user_id" json:"user_id"`
	Token     string    `db:"token" json:"token"`
	Email     string    `db:"email" json:"email"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
