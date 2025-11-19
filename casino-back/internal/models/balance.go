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
	BetID     int     `json:"bet_id"`     // Reference to the winning bet
	GameToken string  `json:"game_token"` // Unique token for this game (for race condition vulnerability)
	Amount    float64 `json:"amount"`
}

// GameTokenCredit tracks which game tokens have been credited (for A04 vulnerability)
type GameTokenCredit struct {
	ID        int       `db:"id" json:"id"`
	GameToken string    `db:"game_token" json:"game_token"`
	UserID    int       `db:"user_id" json:"user_id"`
	BetID     int       `db:"bet_id" json:"bet_id"`
	Amount    float64   `db:"amount" json:"amount"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
