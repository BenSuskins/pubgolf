package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/BenSuskins/pubgolf/backend/internal/bootstrap"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := bootstrap.Run(ctx, bootstrap.ConfigurationFromEnvironment()); err != nil {
		slog.Error("Backend stopped", "error", err)
		os.Exit(1)
	}
}
