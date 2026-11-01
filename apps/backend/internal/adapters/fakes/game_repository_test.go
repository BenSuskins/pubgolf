package fakes_test

import (
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/fakes"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/contract"
)

func TestGameRepositoryContract(t *testing.T) {
	contract.GameRepository(t, func(*testing.T) application.GameRepository { return fakes.NewGameRepository() })
}
