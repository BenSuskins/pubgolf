package live

import (
	"context"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"strings"
	"sync"
)

type Hub struct {
	mutex       sync.Mutex
	capacity    int
	closed      bool
	subscribers map[string]map[chan domain.Game]struct{}
}

func New(capacity int) *Hub {
	return &Hub{capacity: capacity, subscribers: map[string]map[chan domain.Game]struct{}{}}
}
func (hub *Hub) Subscribe(code string) application.Subscription {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()
	code = strings.ToLower(code)
	updates := make(chan domain.Game, hub.capacity)
	if hub.closed {
		close(updates)
		return application.Subscription{Updates: updates, Cancel: func() {}}
	}
	if hub.subscribers[code] == nil {
		hub.subscribers[code] = map[chan domain.Game]struct{}{}
	}
	hub.subscribers[code][updates] = struct{}{}
	return application.Subscription{Updates: updates, Cancel: func() { hub.mutex.Lock(); defer hub.mutex.Unlock(); hub.remove(code, updates) }}
}
func (hub *Hub) remove(code string, updates chan domain.Game) {
	if _, exists := hub.subscribers[code][updates]; exists {
		delete(hub.subscribers[code], updates)
		close(updates)
		if len(hub.subscribers[code]) == 0 {
			delete(hub.subscribers, code)
		}
	}
}
func (hub *Hub) Committed(_ context.Context, game domain.Game, _ []domain.Event) error {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()
	code := strings.ToLower(game.Code)
	for updates := range hub.subscribers[code] {
		select {
		case updates <- domain.Clone(game):
		default:
			hub.remove(code, updates)
		}
	}
	return nil
}
func (hub *Hub) Close() {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()
	hub.closed = true
	for code, subscribers := range hub.subscribers {
		for updates := range subscribers {
			hub.remove(code, updates)
		}
	}
}
