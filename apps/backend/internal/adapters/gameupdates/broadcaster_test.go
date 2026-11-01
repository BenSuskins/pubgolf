package gameupdates_test

import (
	"context"
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/gameupdates"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func TestBroadcasterIsolatesGamesAndDisconnectsSlowConsumers(t *testing.T) {
	broadcaster := gameupdates.New(1)
	defer broadcaster.Close()
	first := broadcaster.SubscribeGameState("PAR001")
	defer first.Cancel()
	other := broadcaster.SubscribeGameState("PAR002")
	defer other.Cancel()
	game := domain.GameSnapshot{ID: "game", Code: "PAR001"}
	if err := broadcaster.PublishGameState(context.Background(), game); err != nil {
		t.Fatal(err)
	}
	select {
	case <-other.Updates:
		t.Fatal("received another game's state")
	default:
	}
	broadcaster.PublishGameState(context.Background(), game)
	<-first.Updates
	if _, open := <-first.Updates; open {
		t.Fatal("slow subscriber remained connected")
	}
}
