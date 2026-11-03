package gameupdates

import (
	"context"
	"strings"
	"sync"

	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type Broadcaster struct {
	mutex       sync.Mutex
	capacity    int
	closed      bool
	subscribers map[string]map[chan domain.RoundSnapshot]struct{}
}

func New(capacity int) *Broadcaster {
	return &Broadcaster{capacity: capacity, subscribers: map[string]map[chan domain.RoundSnapshot]struct{}{}}
}

func (broadcaster *Broadcaster) SubscribeRoundState(code string) application.RoundStateSubscription {
	broadcaster.mutex.Lock()
	defer broadcaster.mutex.Unlock()
	code = strings.ToLower(code)
	updates := make(chan domain.RoundSnapshot, broadcaster.capacity)
	if broadcaster.closed {
		close(updates)
		return application.RoundStateSubscription{Updates: updates, Cancel: func() {}}
	}
	if broadcaster.subscribers[code] == nil {
		broadcaster.subscribers[code] = map[chan domain.RoundSnapshot]struct{}{}
	}
	broadcaster.subscribers[code][updates] = struct{}{}
	return application.RoundStateSubscription{
		Updates: updates,
		Cancel:  func() { broadcaster.mutex.Lock(); defer broadcaster.mutex.Unlock(); broadcaster.remove(code, updates) },
	}
}

func (broadcaster *Broadcaster) remove(code string, updates chan domain.RoundSnapshot) {
	if _, exists := broadcaster.subscribers[code][updates]; exists {
		delete(broadcaster.subscribers[code], updates)
		close(updates)
		if len(broadcaster.subscribers[code]) == 0 {
			delete(broadcaster.subscribers, code)
		}
	}
}

func (broadcaster *Broadcaster) PublishRoundState(_ context.Context, game domain.RoundSnapshot) error {
	broadcaster.mutex.Lock()
	defer broadcaster.mutex.Unlock()
	code := strings.ToLower(game.Code)
	for updates := range broadcaster.subscribers[code] {
		select {
		case updates <- game.Clone():
		default:
			broadcaster.remove(code, updates)
		}
	}
	return nil
}

func (broadcaster *Broadcaster) Close() {
	broadcaster.mutex.Lock()
	defer broadcaster.mutex.Unlock()
	broadcaster.closed = true
	for code, subscribers := range broadcaster.subscribers {
		for updates := range subscribers {
			broadcaster.remove(code, updates)
		}
	}
}
