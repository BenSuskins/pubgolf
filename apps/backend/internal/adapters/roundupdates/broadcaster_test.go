package roundupdates_test

import (
	"context"
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/roundupdates"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func TestBroadcasterIsolatesGamesAndDisconnectsSlowConsumers(t *testing.T) {
	broadcaster := roundupdates.New(1)
	defer broadcaster.Close()
	first := broadcaster.SubscribeRoundState("PAR001")
	defer first.Cancel()
	other := broadcaster.SubscribeRoundState("PAR002")
	defer other.Cancel()
	game := domain.RoundSnapshot{ID: "game", Code: "PAR001"}
	if err := broadcaster.PublishRoundState(context.Background(), game); err != nil {
		t.Fatal(err)
	}
	select {
	case <-other.Updates:
		t.Fatal("received another game's state")
	default:
	}
	broadcaster.PublishRoundState(context.Background(), game)
	<-first.Updates
	if _, open := <-first.Updates; open {
		t.Fatal("slow subscriber remained connected")
	}
}
