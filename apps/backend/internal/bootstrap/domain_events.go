package bootstrap

import (
	"context"
	"errors"
	"log/slog"

	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type domainEventPublishers []application.DomainEventPublisher

func (publishers domainEventPublishers) PublishDomainEvents(ctx context.Context, events []domain.DomainEvent) error {
	for _, event := range events {
		slog.Info("Game action committed", "event", event)
	}
	var failures []error
	for _, publisher := range publishers {
		if err := publisher.PublishDomainEvents(ctx, events); err != nil {
			failures = append(failures, err)
		}
	}
	return errors.Join(failures...)
}
