package memory_test

import (
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/memory"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/contract"
)

func TestGamesContract(t *testing.T) {
	contract.Games(t, func(t *testing.T) application.Games { return memory.New() })
}
