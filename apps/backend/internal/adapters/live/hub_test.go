package live_test

import (
	"context"
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/live"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func TestHubIsolatesGamesAndDisconnectsSlowConsumers(t *testing.T) {
	hub := live.New(1)
	defer hub.Close()
	first := hub.Subscribe("PAR001")
	defer first.Cancel()
	other := hub.Subscribe("PAR002")
	defer other.Cancel()
	game := domain.NewGame("game", "PAR001", "host", "Alice")
	if err := hub.Committed(context.Background(), game, nil); err != nil {
		t.Fatal(err)
	}
	select {
	case <-other.Updates:
		t.Fatal("received another game's state")
	default:
	}
	hub.Committed(context.Background(), game, nil)
	<-first.Updates
	if _, open := <-first.Updates; open {
		t.Fatal("slow subscriber remained connected")
	}
}
