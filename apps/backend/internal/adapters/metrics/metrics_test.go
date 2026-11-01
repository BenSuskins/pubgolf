package metrics_test

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/metrics"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func TestScrapePreservesCommittedGameMetricNamesAndHoleLabels(t *testing.T) {
	adapter := metrics.New()
	hole, _ := domain.NewHoleNumber(2)
	adapter.PublishDomainEvents(context.Background(), []domain.DomainEvent{
		domain.GameCreated{},
		domain.PlayerJoined{},
		domain.ScoreSubmitted{Hole: hole},
		domain.RandomiseUsed{},
		domain.GameCompleted{},
	})
	response := httptest.NewRecorder()
	adapter.Handler().ServeHTTP(response, httptest.NewRequest("GET", "/actuator/prometheus", nil))
	text := response.Body.String()
	for _, line := range []string{"pubgolf_game_started_total 1", "pubgolf_player_joined_total 1", `pubgolf_score_submitted_total{hole="2"} 1`, "pubgolf_game_randomise_total 1", "pubgolf_game_completed_total 1"} {
		if !strings.Contains(text, line) {
			t.Error("missing metric", line)
		}
	}
}
