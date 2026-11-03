package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"github.com/google/uuid"
)

func write(writer http.ResponseWriter, status int, value any) {
	if value == nil {
		writer.WriteHeader(status)
		return
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(value); err != nil {
		slog.Debug("Response interrupted", "error", err)
	}
}

func failure(writer http.ResponseWriter, err error) {
	status := 500
	message := "Something went wrong — please try again"
	var value *domain.Failure
	if errors.As(err, &value) {
		message = value.Message
		switch value.Kind {
		case domain.Invalid:
			status = 400
		case domain.NotFound:
			status = 404
		case domain.Forbidden:
			status = 403
		case domain.Conflict, domain.StaleVersion, domain.DuplicateCode:
			status = 409
		case domain.Unavailable:
			status = 503
		}
	}
	if status == 500 {
		slog.Error("Request failed", "error", err)
	}
	write(writer, status, errorResponse{Message: message})
}

func body(writer http.ResponseWriter, request *http.Request, value any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 1<<20))
	if err := decoder.Decode(value); err != nil {
		write(writer, 400, errorResponse{Message: "Malformed request body"})
		return false
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		write(writer, 400, errorResponse{Message: "Malformed request body"})
		return false
	}
	return true
}

func actor(writer http.ResponseWriter, request *http.Request) (string, bool) {
	identifier := request.Header.Get("PubGolf-Player-Id")
	if identifier == "" {
		write(writer, 401, errorResponse{Message: "Missing required header: PubGolf-Player-Id"})
		return "", false
	}
	if !validUUID(identifier) {
		write(writer, 401, errorResponse{Message: "Invalid player ID format in header: " + identifier})
		return "", false
	}
	return strings.ToLower(identifier), true
}

func validUUID(value string) bool {
	return len(value) == 36 && uuid.Validate(value) == nil
}

func respondGame(writer http.ResponseWriter, game domain.Round, err error) {
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 200, stateResponse(game.Snapshot()))
}
