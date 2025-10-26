package models

import "time"

type Balance struct {
	ID        int       `db:"id" json:"id"`
	UserID    int       `db:"user_id" json:"user_id"`
	Amount    float64   `db:"amount" json:"amount"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// BalanceUpdate represents a request to update balance
type BalanceUpdate struct {
	Amount float64 `json:"amount"`
}

// BalanceAddRequest represents a request to add balance (will be used for race condition vulnerability)
type BalanceAddRequest struct {
	BetID  int     `json:"bet_id"`  // Reference to the winning bet
	Amount float64 `json:"amount"`
}
