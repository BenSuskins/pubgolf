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

type RoundStatePublisher struct {
	Snapshots []domain.RoundSnapshot
	Failure   error
}

func (publisher *RoundStatePublisher) PublishRoundState(_ context.Context, snapshot domain.RoundSnapshot) error {
	publisher.Snapshots = append(publisher.Snapshots, snapshot.Clone())
	return publisher.Failure
}
