package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/tmaxmax/go-sse"

	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (server *server) stream(writer http.ResponseWriter, request *http.Request) {
	game, subscription, err := server.subscriptions.SubscribeRound(request.Context(), request.PathValue("code"))
	if err != nil {
		failure(writer, err)
		return
	}
	defer subscription.Cancel()
	session, err := sse.Upgrade(writer, request)
	if err != nil {
		failure(writer, err)
		return
	}
	writer.Header().Set("Cache-Control", "no-cache")
	writer.Header().Set("X-Accel-Buffering", "no")
	stream := snapshotStream{
		session:    session,
		controller: http.NewResponseController(writer),
		heartbeat:  server.options.Heartbeat,
	}
	stream.run(request.Context(), subscription, game)
}

type snapshotStream struct {
	session    *sse.Session
	controller *http.ResponseController
	heartbeat  time.Duration
}

func (stream snapshotStream) run(
	ctx context.Context,
	subscription application.RoundStateSubscription,
	game domain.RoundSnapshot,
) {
	if err := stream.sendSnapshot(game); err != nil {
		return
	}
	heartbeat := time.NewTicker(stream.heartbeat)
	defer heartbeat.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case updated, open := <-subscription.Updates:
			if !open {
				return
			}
			if updated.Version <= game.Version {
				continue
			}
			if err := stream.sendSnapshot(updated); err != nil {
				return
			}
			game = updated
		case <-heartbeat.C:
			if err := stream.sendHeartbeat(); err != nil {
				return
			}
		}
	}
}

func (stream snapshotStream) sendSnapshot(game domain.RoundSnapshot) error {
	payload, err := json.Marshal(stateResponse(game))
	if err != nil {
		return err
	}
	message := &sse.Message{Type: sse.Type("game-state")}
	message.AppendData(string(payload))
	return stream.send(message)
}

func (stream snapshotStream) sendHeartbeat() error {
	message := &sse.Message{}
	message.AppendComment("heartbeat")
	return stream.send(message)
}

func (stream snapshotStream) send(message *sse.Message) error {
	err := stream.controller.SetWriteDeadline(time.Now().Add(10 * time.Second))
	if err != nil && !errors.Is(err, http.ErrNotSupported) {
		return err
	}
	if err = stream.session.Send(message); err != nil {
		return err
	}
	return stream.session.Flush()
}
