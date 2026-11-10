package httpapi

import (
	"net/http"
	"strings"

	"github.com/getkin/kin-openapi/openapi3"
)

func addOpenAPIParameters(operation *openapi3.Operation, endpoint endpoint) {
	if strings.Contains(endpoint.pattern, "{code}") {
		operation.AddParameter(openapi3.NewPathParameter("code").WithSchema(openapi3.NewStringSchema()))
	}
	if endpoint.playerIdentity {
		operation.AddParameter(openapi3.NewHeaderParameter("PubGolf-Player-Id").
			WithRequired(true).WithSchema(openapi3.NewUUIDSchema()).
			WithDescription("Player identity returned by create or join. This is not account authentication."))
	}
	operation.Parameters = append(operation.Parameters, endpoint.documentation.parameters...)
}

func addOpenAPIResponses(operation *openapi3.Operation, endpoint endpoint, schemas openapi3.Schemas) error {
	response := openapi3.NewResponse().WithDescription(http.StatusText(endpoint.status))
	if endpoint.response != nil {
		schema, err := modelSchema(endpoint.response, schemas)
		if err != nil {
			return err
		}
		response.WithJSONSchemaRef(schema)
	}
	if endpoint.documentation.stream {
		response.WithContent(openapi3.Content{"text/event-stream": &openapi3.MediaType{
			Schema: &openapi3.SchemaRef{Value: openapi3.NewStringSchema()},
		}})
		snapshot, err := modelSchema(gameResponse{}, schemas)
		if err != nil {
			return err
		}
		response.Extensions = map[string]any{"x-sse-event": "game-state", "x-sse-data-schema": snapshot}
		response.WithDescription(
			"SSE game-state events contain JSON game snapshots. Comment heartbeats keep the connection alive.",
		)
	}
	operation.AddResponse(endpoint.status, response)
	failure, err := modelSchema(errorResponse{}, schemas)
	if err != nil {
		return err
	}
	for _, status := range endpoint.failureStatuses() {
		operation.AddResponse(
			status,
			openapi3.NewResponse().WithDescription(http.StatusText(status)).WithJSONSchemaRef(failure),
		)
	}
	return nil
}

func (endpoint endpoint) failureStatuses() []int {
	if endpoint.documentation.failures != nil {
		return endpoint.documentation.failures
	}
	return []int{400, 401, 403, 404, 409, 500}
}

func placeSearchParameters() openapi3.Parameters {
	return openapi3.Parameters{
		&openapi3.ParameterRef{Value: openapi3.NewQueryParameter("q").
			WithRequired(true).WithSchema(openapi3.NewStringSchema())},
		&openapi3.ParameterRef{Value: openapi3.NewQueryParameter("lat").WithSchema(openapi3.NewFloat64Schema())},
		&openapi3.ParameterRef{Value: openapi3.NewQueryParameter("lng").WithSchema(openapi3.NewFloat64Schema())},
	}
}
