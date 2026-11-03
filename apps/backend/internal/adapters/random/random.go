package random

import (
	"crypto/rand"
	"fmt"
	"math/big"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"github.com/google/uuid"
)

func random(limit int) int {
	value, err := rand.Int(rand.Reader, big.NewInt(int64(limit)))
	if err != nil {
		panic(err)
	}
	return int(value.Int64())
}
func NewRoundID() string { return uuid.NewString() }

func NewRoundCode() string {
	terms := []string{"PAR", "BIRDIE", "BOGEY", "EAGLE", "ALBATROSS", "ACE", "FORE", "HOOK", "SLICE"}
	return fmt.Sprintf("%s%03d", terms[random(len(terms))], random(1000))
}

func ChooseWildcardOutcome() string {
	options := domain.WildcardOptions()
	total := 0
	for _, option := range options {
		total += option.Weight
	}
	choice := random(total)
	for _, option := range options {
		choice -= option.Weight
		if choice < 0 {
			return option.Label
		}
	}
	panic("invalid outcome weights")
}

func NewPlayerID() string { return uuid.NewString() }
