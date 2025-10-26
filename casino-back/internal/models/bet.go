package models

import "time"

type Bet struct {
	ID             int       `db:"id" json:"id"`
	UserID         int       `db:"user_id" json:"user_id"`
	BetType        string    `db:"bet_type" json:"bet_type"`       // "number" or "color"
	BetValue       string    `db:"bet_value" json:"bet_value"`     // The number or color bet on
	BetAmount      float64   `db:"bet_amount" json:"bet_amount"`   // Amount wagered
	WinningNumber  *string   `db:"winning_number" json:"winning_number,omitempty"` // Actual result
	WinningColor   *string   `db:"winning_color" json:"winning_color,omitempty"`
	Result         string    `db:"result" json:"result"`           // "win" or "loss"
	Payout         float64   `db:"payout" json:"payout"`           // Amount won (0 if loss)
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
}

// BetRequest represents a request to place a new bet
type BetRequest struct {
	BetType   string  `json:"bet_type"`   // "number" or "color"
	BetValue  string  `json:"bet_value"`  // The number or color to bet on
	BetAmount float64 `json:"bet_amount"` // Amount to wager
}

// BetResult represents the result of processing a bet
type BetResult struct {
	BetID         int     `json:"bet_id"`
	Result        string  `json:"result"`         // "win" or "loss"
	WinningNumber string  `json:"winning_number"`
	WinningColor  string  `json:"winning_color"`
	Payout        float64 `json:"payout"`
	NewBalance    float64 `json:"new_balance"`
}
