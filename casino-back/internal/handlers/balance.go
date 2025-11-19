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
// A04: VULNERABLE TO RACE CONDITION
// The function checks if a game_token has been credited, but WITHOUT proper locking
// This allows concurrent requests to pass the check simultaneously before any insert happens
// EXPLOIT: Send multiple concurrent POST requests with the same game_token using Burp Intruder
func AddBalance(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request - now requires game_token and bet_id
	var req models.BalanceAddRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate that required fields are present
	if req.GameToken == "" || req.BetID == 0 {
		http.Error(w, "game_token and bet_id are required", http.StatusBadRequest)
		return
	}

	// VULNERABLE: Check if game_token has been credited WITHOUT locking
	// This is the race condition window! Multiple concurrent requests can all pass this check
	// before any of them insert into game_token_credits
	var existingCredit models.GameTokenCredit
	err := database.DB.Get(&existingCredit, 
		`SELECT * FROM game_token_credits WHERE game_token = ?`, 
		req.GameToken,
	)
	
	// If we found an existing credit, reject (but race condition allows bypass)
	if err == nil {
		http.Error(w, "This game token has already been credited", http.StatusBadRequest)
		return
	}
	
	// Only proceed if NOT found (sql.ErrNoRows is expected for new tokens)
	if err != sql.ErrNoRows {
		http.Error(w, "Database error checking game token", http.StatusInternalServerError)
		return
	}

	// RACE CONDITION WINDOW: Between the check above and the inserts below
	// Multiple concurrent requests can all reach here if sent at the same time
	// They all passed the check because none had inserted yet

	// Add balance (no transaction, no lock!)
	_, err = database.DB.Exec(
		`UPDATE balances SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
		req.Amount, userID,
	)
	if err != nil {
		http.Error(w, "Failed to update balance", http.StatusInternalServerError)
		return
	}

	// Record that this game_token has been credited (but it's too late, race already happened)
	_, err = database.DB.Exec(
		`INSERT INTO game_token_credits (game_token, user_id, bet_id, amount) VALUES (?, ?, ?, ?)`,
		req.GameToken, userID, req.BetID, req.Amount,
	)
	if err != nil {
		// Even if this fails due to unique constraint, the balance was already added!
		// This is another vulnerability - no rollback
		http.Error(w, "Failed to record credit", http.StatusInternalServerError)
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
