package application

import (
	"context"
	"log/slog"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (commands *GameCommands) SetCourse(
	ctx context.Context,
	code, actor string,
	holes []domain.CourseHoleSnapshot,
) (domain.Game, error) {
	course, err := domain.NewCourse(holes)
	if err != nil {
		return domain.Game{}, err
	}
	return commands.coordinator.update(ctx, code, func(game domain.Game) (domain.Game, []domain.DomainEvent, error) {
		return game.SetCourse(actor, course)
	})
}

func (commands *GameCommands) SetPubRoute(
	ctx context.Context,
	code, actor string,
	pubs []domain.PubSnapshot,
) (domain.Game, error) {
	route, err := domain.NewPubRoute(pubs, nil)
	if err != nil {
		return domain.Game{}, err
	}
	original, err := commands.coordinator.repository.FindByCode(ctx, code)
	if err != nil {
		return domain.Game{}, err
	}
	if _, _, err = original.SetPubRoute(actor, route); err != nil {
		return domain.Game{}, err
	}
	route = commands.calculatePubRoute(ctx, route)
	if err = ctx.Err(); err != nil {
		return domain.Game{}, err
	}
	return commands.coordinator.update(ctx, code, func(game domain.Game) (domain.Game, []domain.DomainEvent, error) {
		return game.SetPubRoute(actor, route)
	})
}

func (commands *GameCommands) calculatePubRoute(ctx context.Context, route domain.PubRoute) domain.PubRoute {
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
