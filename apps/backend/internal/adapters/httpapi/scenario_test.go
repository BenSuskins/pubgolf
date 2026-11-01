package httpapi_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"strings"
	"testing"
)

type contractStep struct {
	Method, Path, Actor string
	Body                any
	Status              int
	Response            any
	Capture             map[string]string
}

type scenarioClient struct {
	server    *httptest.Server
	variables map[string]string
}

func kotlinContract(t *testing.T) []contractStep {
	t.Helper()
	fixture, err := os.ReadFile("testdata/kotlin-contract.json")
	if err != nil {
		t.Fatal(err)
	}
	var steps []contractStep
	if err = json.Unmarshal(fixture, &steps); err != nil {
		t.Fatal(err)
	}
	return steps
}

func (client scenarioClient) expand(value string) string {
	for key, item := range client.variables {
		value = strings.ReplaceAll(value, "${"+key+"}", item)
	}
	return value
}

func (client scenarioClient) request(t *testing.T, step contractStep) *http.Request {
	t.Helper()
	body, err := json.Marshal(step.Body)
	if err != nil {
		t.Fatal(err)
	}
	request, err := http.NewRequest(
		step.Method,
		client.server.URL+client.expand(step.Path),
		strings.NewReader(string(body)),
	)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Content-Type", "application/json")
	actor := step.Actor
	if value, exists := client.variables[actor]; exists {
		actor = value
	}
	if actor != "" {
		request.Header.Set("PubGolf-Player-Id", actor)
	}
	return request
}

func (client scenarioClient) check(t *testing.T, step contractStep) {
	t.Helper()
	request := client.request(t, step)
	response, contents := perform(t, client.server, request)
	if response.StatusCode != step.Status {
		t.Fatalf("status %d want %d: %s", response.StatusCode, step.Status, contents)
	}
	validateContract(t, request, response, contents)
	var actual any
	if len(contents) > 0 {
		if err := json.Unmarshal(contents, &actual); err != nil {
			t.Fatal(err)
		}
	}
	captureIdentity(actual, step.Capture, client.variables)
	actual = normalise(actual, client.variables)
	if !reflect.DeepEqual(actual, step.Response) {
		t.Fatalf("want %#v\ngot %#v", step.Response, actual)
	}
}

func captureIdentity(value any, fields, variables map[string]string) {
	for key, field := range fields {
		variables[key] = value.(map[string]any)[field].(string)
	}
}

func perform(t *testing.T, server *httptest.Server, request *http.Request) (*http.Response, []byte) {
	t.Helper()
	response, err := server.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	contents, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	return response, contents
}

func callAPI(t *testing.T, server *httptest.Server, method, path, payload, actor string) (int, map[string]any) {
	t.Helper()
	request, err := http.NewRequest(method, server.URL+path, strings.NewReader(payload))
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Content-Type", "application/json")
	if actor != "" {
		request.Header.Set("PubGolf-Player-Id", actor)
	}
	response, contents := perform(t, server, request)
	validateContract(t, request, response, contents)
	var result map[string]any
	if len(contents) > 0 {
		if err = json.Unmarshal(contents, &result); err != nil {
			t.Fatal(err)
		}
	}
	return response.StatusCode, result
}

func createIdentity(t *testing.T, server *httptest.Server) map[string]string {
	t.Helper()
	_, result := callAPI(t, server, "POST", "/api/v1/games", `{"host":"Alice"}`, "")
	return map[string]string{"playerId": result["playerId"].(string), "gameCode": result["gameCode"].(string)}
}
