package httpapi_test

import (
	"context"
	"io"
	"net/http"
	"testing"

	"github.com/getkin/kin-openapi/openapi3"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpapi"
)

func servedSpecification(t *testing.T) (*openapi3.T, []byte) {
	t.Helper()
	response, err := http.Get(server(t).URL + "/v3/api-docs")
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	contents, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusOK {
		t.Fatalf("documentation status: %d", response.StatusCode)
	}
	document, err := openapi3.NewLoader().LoadFromData(contents)
	if err != nil {
		t.Fatal(err)
	}
	if err = document.Validate(context.Background()); err != nil {
		t.Fatal(err)
	}
	return document, contents
}

func TestServedOpenAPIDescribesScoreEndpoint(t *testing.T) {
	document, _ := servedSpecification(t)
	operation := document.Paths.Find("/api/v1/games/{code}/scores").Post
	if operation.OperationID != "submitScore" {
		t.Fatalf("operation identifier: %s", operation.OperationID)
	}
	if operation.Responses.Status(http.StatusNoContent) == nil {
		t.Fatal("score submission must document its empty success response")
	}
}

func TestServedOpenAPIDescribesPlaceSearchAndStream(t *testing.T) {
	document, _ := servedSpecification(t)
	search := document.Paths.Find("/api/v1/places/search").Get
	for _, name := range []string{"q", "lat", "lng"} {
		if search.Parameters.GetByInAndName("query", name) == nil {
			t.Errorf("search query parameter %q missing", name)
		}
	}
	if search.Responses.Status(http.StatusServiceUnavailable) == nil {
		t.Error("search must document upstream unavailability")
	}
	stream := document.Paths.Find("/api/v1/games/{code}/stream").Get
	response := stream.Responses.Status(http.StatusOK)
	if response == nil || response.Value.Content.Get("text/event-stream") == nil {
		t.Error("stream must document its event stream response")
	}
	if stream.Responses.Status(http.StatusNotFound) == nil {
		t.Error("stream must document a missing round")
	}
}

func TestServedOpenAPIMatchesEndpointDefinitions(t *testing.T) {
	_, contents := servedSpecification(t)
	generated, err := httpapi.GenerateOpenAPI()
	if err != nil {
		t.Fatal(err)
	}
	if string(contents) != string(generated) {
		t.Fatal("openapi.json is stale; run make backend-openapi")
	}
}

func TestServedOpenAPIDeclaresPublicOperations(t *testing.T) {
	document, _ := servedSpecification(t)
	for path, item := range document.Paths.Map() {
		for method, operation := range item.Operations() {
			if operation.Security == nil || len(*operation.Security) != 0 {
				t.Errorf(
					"%s %s must declare public access; player identity is a header, not account authentication",
					method,
					path,
				)
			}
		}
	}
}
