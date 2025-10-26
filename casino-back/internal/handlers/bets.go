package handlers

import (
	"database/sql"
	"encoding/json"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/juanpicasti/casino-back/internal/database"
	"github.com/juanpicasti/casino-back/internal/middleware"
	"github.com/juanpicasti/casino-back/internal/models"
)

// American Roulette wheel configuration
var rouletteWheel = []struct {
	Number string
	Color  string
}{
	{"0", "green"}, {"28", "black"}, {"9", "red"}, {"26", "black"},
	{"30", "red"}, {"11", "black"}, {"7", "red"}, {"20", "black"},
	{"32", "red"}, {"17", "black"}, {"5", "red"}, {"22", "black"},
	{"34", "red"}, {"15", "black"}, {"3", "red"}, {"24", "black"},
	{"36", "red"}, {"13", "black"}, {"1", "red"}, {"00", "green"},
	{"27", "red"}, {"10", "black"}, {"25", "red"}, {"29", "black"},
	{"12", "red"}, {"8", "black"}, {"19", "red"}, {"31", "black"},
	{"18", "red"}, {"6", "black"}, {"21", "red"}, {"33", "black"},
	{"16", "red"}, {"4", "black"}, {"23", "red"}, {"35", "black"},
	{"14", "red"}, {"2", "black"},
}

// CreateBet handles placing a new bet and immediately processes it
func CreateBet(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request
	var req models.BetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate bet
	if req.BetType != "number" && req.BetType != "color" {
		http.Error(w, "Invalid bet type. Must be 'number' or 'color'", http.StatusBadRequest)
		return
	}

	if req.BetAmount <= 0 {
		http.Error(w, "Bet amount must be positive", http.StatusBadRequest)
		return
	}

	// Check if user has sufficient balance
	var currentBalance float64
	err := database.DB.Get(&currentBalance, `SELECT amount FROM balances WHERE user_id = ?`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch balance", http.StatusInternalServerError)
		return
	}

	if currentBalance < req.BetAmount {
		http.Error(w, "Insufficient balance", http.StatusBadRequest)
		return
	}

	// Spin the roulette (random outcome)
	rand.Seed(time.Now().UnixNano())
	resultIndex := rand.Intn(len(rouletteWheel))
	winningNumber := rouletteWheel[resultIndex].Number
	winningColor := rouletteWheel[resultIndex].Color

	// Determine if bet won
	result := "loss"
	payout := 0.0

	if req.BetType == "number" && req.BetValue == winningNumber {
		result = "win"
		payout = req.BetAmount * 36 // 35:1 payout + original bet
	} else if req.BetType == "color" && req.BetValue == winningColor {
		result = "win"
		payout = req.BetAmount * 2 // 1:1 payout + original bet
	}

	// Start transaction
	tx, err := database.DB.Beginx()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Deduct bet amount from balance
	_, err = tx.Exec(
		`UPDATE balances SET amount = amount - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
		req.BetAmount, userID,
	)
	if err != nil {
		http.Error(w, "Failed to deduct balance", http.StatusInternalServerError)
		return
	}

	// Record the bet
	res, err := tx.Exec(
		`INSERT INTO bets (user_id, bet_type, bet_value, bet_amount, winning_number, winning_color, result, payout)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		userID, req.BetType, req.BetValue, req.BetAmount, winningNumber, winningColor, result, payout,
	)
	if err != nil {
		http.Error(w, "Failed to record bet", http.StatusInternalServerError)
		return
	}

	betID, err := res.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to get bet ID", http.StatusInternalServerError)
		return
	}

	// If won, add payout to balance
	if result == "win" {
		_, err = tx.Exec(
			`UPDATE balances SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
			payout, userID,
		)
		if err != nil {
			http.Error(w, "Failed to add payout", http.StatusInternalServerError)
			return
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Fetch new balance
	var newBalance float64
	err = database.DB.Get(&newBalance, `SELECT amount FROM balances WHERE user_id = ?`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch balance", http.StatusInternalServerError)
		return
	}

	// Return result
	betResult := models.BetResult{
		BetID:         int(betID),
		Result:        result,
		WinningNumber: winningNumber,
		WinningColor:  winningColor,
		Payout:        payout,
		NewBalance:    newBalance,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(betResult)
}

// GetBets returns the authenticated user's bet history
// TODO: This endpoint will be made vulnerable to SQL Injection
// by accepting a filter parameter without proper sanitization:
// Example: /api/bets?filter=2024-01-01
// The query will be built using string concatenation instead of parameterized queries
func GetBets(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Fetch bets (currently secure with parameterized query)
	var bets []models.Bet
	err := database.DB.Select(&bets, `SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC`, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Return bets
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bets)
}

// GetBetByID returns details of a specific bet
func GetBetByID(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get bet ID from URL parameter
	betIDStr := chi.URLParam(r, "id")
	betID, err := strconv.Atoi(betIDStr)
	if err != nil {
		http.Error(w, "Invalid bet ID", http.StatusBadRequest)
		return
	}

	// Fetch bet
	var bet models.Bet
	err = database.DB.Get(&bet, `SELECT * FROM bets WHERE id = ? AND user_id = ?`, betID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Bet not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Return bet
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bet)
}
