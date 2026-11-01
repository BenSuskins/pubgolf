package httpapi

import (
	"net/http"
)

func (server *server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		origin := request.Header.Get("Origin")
		if origin != "" {
			writer.Header().Add("Vary", "Origin")
			allowed := false
			for _, configured := range server.options.Origins {
				if origin == configured {
					allowed = true
					break
				}
			}
			if !allowed {
				write(writer, 403, map[string]string{"message": "Origin is not allowed"})
				return
			}
			writer.Header().Set("Access-Control-Allow-Origin", origin)
			writer.Header().Set("Access-Control-Allow-Credentials", "true")
			writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
			writer.Header().Set("Access-Control-Allow-Headers", "Content-Type,PubGolf-Player-Id")
		}
		if request.Method == http.MethodOptions {
			writer.WriteHeader(204)
			return
		}
		next.ServeHTTP(writer, request)
	})
}
