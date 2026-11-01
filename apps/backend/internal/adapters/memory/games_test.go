package memory_test

import (
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/memory"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/contract"
	"testing"
)

func TestGamesContract(t *testing.T) {
	contract.Games(t, func(t *testing.T) application.Games { return memory.New() })
}
