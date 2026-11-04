package application

import (
	"context"
	"log/slog"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (commands *RoundCommands) SetCourse(
	ctx context.Context,
	code, actor string,
	holes []domain.CourseHoleSnapshot,
) (domain.Round, error) {
	course, err := domain.NewCourse(holes)
	if err != nil {
		return domain.Round{}, err
	}
	return commands.coordinator.update(ctx, code, func(game domain.Round) (domain.Round, []domain.DomainEvent, error) {
		return game.SetCourse(actor, course)
	})
}

func (commands *RoundCommands) SetPubRoute(
	ctx context.Context,
	code, actor string,
	pubs []domain.PubSnapshot,
) (domain.Round, error) {
	route, err := domain.NewPubRoute(pubs, nil)
	if err != nil {
		return domain.Round{}, err
	}
	original, err := commands.coordinator.repository.FindByCode(ctx, code)
	if err != nil {
		return domain.Round{}, err
	}
	if _, _, err = original.SetPubRoute(actor, route); err != nil {
		return domain.Round{}, err
	}
	route = commands.calculatePubRoute(ctx, route)
	if err = ctx.Err(); err != nil {
		return domain.Round{}, err
	}
	return commands.coordinator.update(ctx, code, func(game domain.Round) (domain.Round, []domain.DomainEvent, error) {
		return game.SetPubRoute(actor, route)
	})
}

func (commands *RoundCommands) calculatePubRoute(ctx context.Context, route domain.PubRoute) domain.PubRoute {
	if commands.dependencies.PubRoutes == nil {
		return route
	}
	calculated, err := commands.dependencies.PubRoutes.CalculatePubRoute(ctx, route)
	if err != nil {
		slog.Warn("Route calculation failed; saving pubs without geometry", "error", err)
		return route
	}
	return calculated
}
