package fakes

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type DomainEventPublisher struct {
	Events  []domain.DomainEvent
	Failure error
}

func (publisher *DomainEventPublisher) PublishDomainEvents(_ context.Context, events []domain.DomainEvent) error {
	publisher.Events = append(publisher.Events, events...)
	return publisher.Failure
}

type GameStatePublisher struct {
	Snapshots []domain.GameSnapshot
	Failure   error
}

func (publisher *GameStatePublisher) PublishGameState(_ context.Context, snapshot domain.GameSnapshot) error {
	publisher.Snapshots = append(publisher.Snapshots, snapshot.Clone())
	return publisher.Failure
}
