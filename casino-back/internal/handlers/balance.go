package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"sync/atomic"
	"time"

	"github.com/juanpicasti/casino-back/internal/database"
	"github.com/juanpicasti/casino-back/internal/middleware"
	"github.com/juanpicasti/casino-back/internal/models"
)

// VULNERABLE: In-memory map to track used game tokens WITHOUT synchronization
// This map is NOT protected by a mutex, making it vulnerable to race conditions
// Multiple goroutines can read/write simultaneously, causing the check-then-set pattern to fail
var usedGameTokens = make(map[string]bool)

// Counter to track concurrent requests (for debugging/demonstration)
var activeRequests int64

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
	// Track concurrent requests for debugging
	active := atomic.AddInt64(&activeRequests, 1)
	defer atomic.AddInt64(&activeRequests, -1)

	// Log concurrency for educational demonstration
	numGoroutines := runtime.NumGoroutine()
	fmt.Printf("🔥 AddBalance: %d concurrent requests | %d total goroutines\n", active, numGoroutines)

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

	// VULNERABLE: Check-then-set pattern with in-memory map WITHOUT mutex protection
	// This is a CLASSIC race condition vulnerability!
	// Multiple goroutines can all read usedGameTokens[token] simultaneously,
	// all see false, then all proceed to set it to true and credit the balance

	// RACE CONDITION WINDOW STARTS HERE
	if usedGameTokens[req.GameToken] {
		// Token already used - reject
		http.Error(w, "This game token has already been credited", http.StatusBadRequest)
		return
	}

	// RACE CONDITION WINDOW: Between the check above and the set below
	// Multiple concurrent requests can ALL pass the check before ANY of them sets the flag
	// All will see usedGameTokens[token] == false, then all will proceed

	// ARTIFICIAL DELAY to widen the race condition window (educational demonstration)
	// This simulates slow processing, network latency, or complex business logic
	// In production, this delay would be natural from API calls, DB queries, etc.
	time.Sleep(50 * time.Millisecond)  // 50ms delay makes race condition VERY exploitable

	// Mark token as used (but it's too late - race already happened!)
	usedGameTokens[req.GameToken] = true
	// RACE CONDITION WINDOW ENDS HERE

	// Add balance (no transaction, no lock!)
	_, err := database.DB.Exec(
		`UPDATE balances SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
		req.Amount, userID,
	)
	if err != nil {
		http.Error(w, "Failed to update balance", http.StatusInternalServerError)
		return
	}

	// Optional: Record in database for audit trail (ignore errors)
	// This is NOT used for validation - only the in-memory map is checked
	database.DB.Exec(
		`INSERT INTO game_token_credits (game_token, user_id, bet_id, amount) VALUES (?, ?, ?, ?)`,
		req.GameToken, userID, req.BetID, req.Amount,
	)

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
