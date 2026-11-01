package bootstrap

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"golang.org/x/sync/errgroup"
)

func serve(ctx context.Context, server *http.Server) error {
	group, lifetime := errgroup.WithContext(ctx)
	group.Go(func() error {
		slog.Info("Pub Golf backend listening", "address", server.Addr)
		err := server.ListenAndServe()
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	})
	group.Go(func() error {
		<-lifetime.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return server.Shutdown(shutdown)
	})
	return group.Wait()
}
