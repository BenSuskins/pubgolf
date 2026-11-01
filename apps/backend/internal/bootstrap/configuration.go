package bootstrap

import (
	"os"
	"strings"
)

type Configuration struct {
	DatabasePath   string
	Port           string
	Origins        []string
	RoutingBaseURL string
	RoutingProfile string
	SearchBaseURL  string
}

func ConfigurationFromEnvironment() Configuration {
	return Configuration{
		DatabasePath:   environment("DATABASE_PATH", "pubgolf-go.db"),
		Port:           environment("PORT", "8080"),
		Origins:        strings.Split(environment("ALLOWED_ORIGINS", defaultOrigins), ","),
		RoutingBaseURL: environment("OSRM_BASE_URL", "https://router.project-osrm.org"),
		RoutingProfile: environment("OSRM_PROFILE", "foot"),
		SearchBaseURL:  environment("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org"),
	}
}

const defaultOrigins = "http://localhost:3000,https://pubgolf.suskins.co.uk,https://www.pubgolf.me,https://pubgolf.me"

func environment(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
