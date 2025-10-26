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
// TODO: This endpoint will be made vulnerable to race condition attacks
// The current implementation has proper checks, but will be modified to:
// 1. Remove database transaction locking
// 2. Separate the validation check from the balance update (TOCTOU vulnerability)
// 3. Allow client-side to determine winning amounts (insecure trust boundary)
func AddBalance(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request
	var req models.BalanceAddRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate amount
	if req.Amount <= 0 {
		http.Error(w, "Amount must be positive", http.StatusBadRequest)
		return
	}

	// Validate bet_id exists and belongs to user
	var bet models.Bet
	err := database.DB.Get(&bet, `SELECT * FROM bets WHERE id = ? AND user_id = ?`, req.BetID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Bet not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Check if bet was a winning bet
	if bet.Result != "win" {
		http.Error(w, "Cannot add balance for losing bet", http.StatusBadRequest)
		return
	}

	// Check if payout was already claimed
	if bet.Payout > 0 {
		http.Error(w, "Payout already claimed for this bet", http.StatusConflict)
		return
	}

	// Use a transaction to ensure atomicity (this will be removed for vulnerability)
	tx, err := database.DB.Beginx()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Update balance
	_, err = tx.Exec(
		`UPDATE balances SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
		req.Amount, userID,
	)
	if err != nil {
		http.Error(w, "Failed to update balance", http.StatusInternalServerError)
		return
	}

	// Mark bet as paid out
	_, err = tx.Exec(`UPDATE bets SET payout = ? WHERE id = ?`, req.Amount, req.BetID)
	if err != nil {
		http.Error(w, "Failed to update bet", http.StatusInternalServerError)
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
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

	// Validate amount
	if req.Amount <= 0 {
		http.Error(w, "Amount must be positive", http.StatusBadRequest)
		return
	}

	// Start transaction
	tx, err := database.DB.Beginx()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Check current balance
	var currentBalance float64
	err = tx.Get(&currentBalance, `SELECT amount FROM balances WHERE user_id = ?`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch balance", http.StatusInternalServerError)
		return
	}

	// Check if user has sufficient balance
	if currentBalance < req.Amount {
		http.Error(w, "Insufficient balance", http.StatusBadRequest)
		return
	}

	// Deduct balance
	_, err = tx.Exec(
		`UPDATE balances SET amount = amount - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
		req.Amount, userID,
	)
	if err != nil {
		http.Error(w, "Failed to update balance", http.StatusInternalServerError)
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
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
