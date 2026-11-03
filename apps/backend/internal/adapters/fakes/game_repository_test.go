package fakes_test

import (
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/fakes"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/contract"
)

func TestGameRepositoryContract(t *testing.T) {
	contract.RoundRepository(t, func(*testing.T) application.RoundRepository { return fakes.NewRoundRepository() })
}
