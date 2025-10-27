package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/juanpicasti/casino-back/internal/database"
	"github.com/juanpicasti/casino-back/internal/middleware"
	"github.com/juanpicasti/casino-back/internal/models"
)

// GetBalance returns the authenticated user's balance
func GetBalance(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Fetch balance from database
	var balance models.Balance
	err := database.DB.Get(&balance, `SELECT * FROM balances WHERE user_id = ?`, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Balance not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Return balance
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(balance)
}

// AddBalance adds funds to the user's balance (for winning bets)
// VULNERABLE: No validation, no transaction locking, fully exploitable race condition
// Frontend can call this multiple times with same bet_id
// Frontend determines winning amounts (insecure trust boundary)
func AddBalance(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request - accept amount without validation
	var req struct {
		Amount float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// VULNERABLE: No checks, just add balance directly
	// No transaction, no bet validation, no duplicate check
	_, err := database.DB.Exec(
		`UPDATE balances SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
		req.Amount, userID,
	)
	if err != nil {
		http.Error(w, "Failed to update balance", http.StatusInternalServerError)
		return
	}

	// Fetch updated balance
	var balance models.Balance
	err = database.DB.Get(&balance, `SELECT * FROM balances WHERE user_id = ?`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch balance", http.StatusInternalServerError)
		return
	}

	// Return updated balance
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Balance updated successfully",
		"balance": balance,
	})
}

// DeductBalance deducts funds from the user's balance (for placing bets)
// VULNERABLE: No balance check, allows negative balances
func DeductBalance(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request
	var req models.BalanceUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// VULNERABLE: No balance validation, just deduct
	// Can result in negative balance
	_, err := database.DB.Exec(
		`UPDATE balances SET amount = amount - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
		req.Amount, userID,
	)
	if err != nil {
		http.Error(w, "Failed to update balance", http.StatusInternalServerError)
		return
	}

	// Fetch updated balance
	var balance models.Balance
	err = database.DB.Get(&balance, `SELECT * FROM balances WHERE user_id = ?`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch balance", http.StatusInternalServerError)
		return
	}

	// Return updated balance
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Balance deducted successfully",
		"balance": balance,
	})
}
