package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strconv"

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

// generateGameToken generates a unique token for each game round
// This token will be used to prevent duplicate credit requests (or exploit race conditions)
func generateGameToken() (string, error) {
	bytes := make([]byte, 32) // 256 bits
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// CreateBet handles placing a new bet (SIMPLIFIED - just records, doesn't process)
// VULNERABLE: No balance check, no processing, frontend controls everything
// A04: Generates a game_token that will be used for race condition vulnerability
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

	// Generate unique game token for this round (for A04 vulnerability)
	gameToken, err := generateGameToken()
	if err != nil {
		http.Error(w, "Failed to generate game token", http.StatusInternalServerError)
		return
	}

	// VULNERABLE: Just record the bet, no validation, no processing
	// No balance check, no deduction, no spinning, no crediting
	// Frontend handles all game logic
	res, err := database.DB.Exec(
		`INSERT INTO bets (user_id, bet_type, bet_value, bet_amount, game_token, result, payout) VALUES (?, ?, ?, ?, ?, 'pending', 0.0)`,
		userID, req.BetType, req.BetValue, req.BetAmount, gameToken,
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

	// Return bet_id and game_token (token needed for crediting winnings)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"bet_id":     int(betID),
		"game_token": gameToken,
	})
}

// GetBets returns the authenticated user's bet history
// VULNERABLE: SQL Injection via filter parameter
// Example: /api/bets?filter=2024-01-01
// The filter parameter is concatenated directly into the SQL query without sanitization
// Attackers can inject SQL to read data from other tables or other users' records
func GetBets(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user ID from context
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get filter parameter from query string
	filter := r.URL.Query().Get("filter")

	var bets []models.Bet
	var err error

	if filter != "" {
		// VULNERABLE: Building SQL query with string concatenation
		// This allows SQL injection attacks
		// Example exploit: /api/bets?filter=2024-01-01' UNION SELECT id,user_id,username AS bet_type,email AS bet_value,0.0,NULL,NULL,'',0.0,created_at FROM users--
		query := "SELECT * FROM bets WHERE user_id = " + strconv.Itoa(userID) + " AND DATE(created_at) = '" + filter + "' ORDER BY created_at DESC"
		err = database.DB.Select(&bets, query)
	} else {
		// No filter provided, use secure parameterized query
		err = database.DB.Select(&bets, `SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC`, userID)
	}

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

// UpdateBetResult updates a bet with the final result and payout
// VULNERABLE: Frontend controls the result - no server-side validation
func UpdateBetResult(w http.ResponseWriter, r *http.Request) {
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

	// Parse request
	var req struct {
		WinningNumber string  `json:"winning_number"`
		WinningColor  string  `json:"winning_color"`
		Result        string  `json:"result"`
		Payout        float64 `json:"payout"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// VULNERABLE: No validation that the bet belongs to this user
	// No validation of the result or payout amount
	// Frontend completely controls win/loss determination
	_, err = database.DB.Exec(
		`UPDATE bets SET winning_number = ?, winning_color = ?, result = ?, payout = ? WHERE id = ? AND user_id = ?`,
		req.WinningNumber, req.WinningColor, req.Result, req.Payout, betID, userID,
	)
	if err != nil {
		http.Error(w, "Failed to update bet", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Bet updated successfully",
	})
}
