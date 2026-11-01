package metrics

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type Metrics struct {
	registry                               *prometheus.Registry
	created, joined, randomised, completed prometheus.Counter
	scores                                 *prometheus.CounterVec
	requests                               *prometheus.HistogramVec
}

func New() *Metrics {
	registry := prometheus.NewRegistry()
	counter := func(name string) prometheus.Counter {
		value := prometheus.NewCounter(prometheus.CounterOpts{Name: name, Help: "Committed Pub Golf actions."})
		registry.MustRegister(value)
		return value
	}
	metrics := &Metrics{
		registry:   registry,
		created:    counter("pubgolf_game_started_total"),
		joined:     counter("pubgolf_player_joined_total"),
		randomised: counter("pubgolf_game_randomise_total"),
		completed:  counter("pubgolf_game_completed_total"),
	}
	metrics.scores = prometheus.NewCounterVec(
		prometheus.CounterOpts{Name: "pubgolf_score_submitted_total", Help: "Committed scores by hole."},
		[]string{"hole"},
	)
	registry.MustRegister(metrics.scores)
	for hole := 1; hole <= 9; hole++ {
		metrics.scores.WithLabelValues(strconv.Itoa(hole))
	}
	metrics.requests = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_server_requests_seconds",
			Help:    "HTTP request duration.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "uri", "status"},
	)
	registry.MustRegister(metrics.requests)
	registry.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)
	return metrics
}

func (metrics *Metrics) PublishDomainEvents(_ context.Context, events []domain.DomainEvent) error {
	for _, event := range events {
		switch event := event.(type) {
		case domain.GameCreated:
			metrics.created.Inc()
		case domain.PlayerJoined:
			metrics.joined.Inc()
		case domain.ScoreSubmitted:
			metrics.scores.WithLabelValues(strconv.Itoa(event.Hole.Value())).Inc()
		case domain.RandomiseUsed:
			metrics.randomised.Inc()
		case domain.GameCompleted:
			metrics.completed.Inc()
		}
	}
	return nil
}

func (metrics *Metrics) Handler() http.Handler {
	return promhttp.HandlerFor(metrics.registry, promhttp.HandlerOpts{})
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (writer *responseWriter) WriteHeader(status int) {
	if writer.status == 0 {
		writer.status = status
		writer.ResponseWriter.WriteHeader(status)
	}
}

func (writer *responseWriter) Write(data []byte) (int, error) {
	if writer.status == 0 {
		writer.WriteHeader(200)
	}
	return writer.ResponseWriter.Write(data)
}
func (writer *responseWriter) Unwrap() http.ResponseWriter { return writer.ResponseWriter }
func (metrics *Metrics) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		start := time.Now()
		record := &responseWriter{ResponseWriter: writer}
		next.ServeHTTP(record, request)
		status := record.status
		if status == 0 {
			status = 200
		}
		pattern := request.Pattern
		if pattern == "" {
			pattern = "unmatched"
		}
		metrics.requests.WithLabelValues(request.Method, pattern, strconv.Itoa(status)).
			Observe(time.Since(start).Seconds())
	})
}
