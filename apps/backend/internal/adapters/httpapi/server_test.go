package httpapi_test

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpapi"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/live"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/sqlite"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/upstream"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"
)

func server(t *testing.T) *httptest.Server {
	t.Helper()
	counter := 0
	hub := live.New(8)
	t.Cleanup(hub.Close)
	repository, err := sqlite.Open(filepath.Join(t.TempDir(), "games.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { repository.Close() })
	service := application.New(repository, application.Dependencies{Identifier: func() string { counter++; return fmt.Sprintf("00000000-0000-4000-8000-%012d", counter) }, Code: func() string { return "PAR001" }, Now: func() time.Time { return time.Unix(42, 0).UTC() }, Outcome: func() string { return "Tequila" }, Effects: hub, Streams: hub})
	server := httptest.NewServer(httpapi.New(service, httpapi.Options{Heartbeat: 20 * time.Millisecond}))
	t.Cleanup(server.Close)
	return server
}
func TestKotlinRESTCharacterization(t *testing.T) {
	server := server(t)
	var steps []struct {
		Method, Path, Actor string
		Body                any
		Status              int
		Response            any
		Capture             map[string]string
	}
	fixture, err := os.ReadFile("testdata/kotlin-contract.json")
	if err != nil {
		t.Fatal(err)
	}
	if err = json.Unmarshal(fixture, &steps); err != nil {
		t.Fatal(err)
	}
	variables := map[string]string{}
	expand := func(value string) string {
		for key, item := range variables {
			value = strings.ReplaceAll(value, "${"+key+"}", item)
		}
		return value
	}
	for index, step := range steps {
		t.Run(fmt.Sprintf("%02d %s %s", index, step.Method, step.Path), func(t *testing.T) {
			body, _ := json.Marshal(step.Body)
			request, err := http.NewRequest(step.Method, server.URL+expand(step.Path), strings.NewReader(string(body)))
			if err != nil {
				t.Fatal(err)
			}
			request.Header.Set("Content-Type", "application/json")
			if step.Actor != "" {
				actor := step.Actor
				if value, exists := variables[actor]; exists {
					actor = value
				}
				request.Header.Set("PubGolf-Player-Id", actor)
			}
			response, err := server.Client().Do(request)
			if err != nil {
				t.Fatal(err)
			}
			defer response.Body.Close()
			contents, _ := io.ReadAll(response.Body)
			if response.StatusCode != step.Status {
				t.Fatalf("status %d want %d: %s", response.StatusCode, step.Status, contents)
			}
			var actual any
			if len(contents) > 0 {
				if err = json.Unmarshal(contents, &actual); err != nil {
					t.Fatal(err)
				}
			}
			if step.Capture != nil {
				object := actual.(map[string]any)
				for key, field := range step.Capture {
					variables[key] = object[field].(string)
				}
			}
			actual = normalise(actual, variables)
			if !reflect.DeepEqual(actual, step.Response) {
				expected, _ := json.Marshal(step.Response)
				got, _ := json.Marshal(actual)
				t.Fatalf("want %s\ngot  %s", expected, got)
			}
		})
	}
}
func normalise(value any, variables map[string]string) any {
	switch value := value.(type) {
	case string:
		for key, item := range variables {
			value = strings.ReplaceAll(value, item, "${"+key+"}")
		}
		return value
	case map[string]any:
		for key, item := range value {
			if key == "activatedAt" {
				value[key] = "${timestamp}"
			} else {
				value[key] = normalise(item, variables)
			}
		}
		return value
	case []any:
		for index, item := range value {
			value[index] = normalise(item, variables)
		}
		return value
	default:
		return value
	}
}

func TestStreamSendsInitialAndCommittedSnapshotsAndRecoversOnReconnect(t *testing.T) {
	server := server(t)
	response, err := server.Client().Post(server.URL+"/api/v1/games", "application/json", strings.NewReader(`{"host":"Alice"}`))
	if err != nil {
		t.Fatal(err)
	}
	var identity map[string]string
	json.NewDecoder(response.Body).Decode(&identity)
	response.Body.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	connect := func() *http.Response {
		request, _ := http.NewRequestWithContext(ctx, "GET", server.URL+"/api/v1/games/"+identity["gameCode"]+"/stream", nil)
		response, err := server.Client().Do(request)
		if err != nil {
			t.Fatal(err)
		}
		if response.Header.Get("Content-Type") != "text/event-stream" {
			t.Fatal(response.Header)
		}
		return response
	}
	stream := connect()
	defer stream.Body.Close()
	reader := bufio.NewReader(stream.Body)
	snapshot := func(reader *bufio.Reader) map[string]any {
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				t.Fatal(err)
			}
			if strings.HasPrefix(line, "data: ") {
				var value map[string]any
				if err = json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &value); err != nil {
					t.Fatal(err)
				}
				return value
			}
		}
	}
	initial := snapshot(reader)
	if initial["gameCode"] != "PAR001" {
		t.Fatal(initial)
	}
	request, _ := http.NewRequest("POST", server.URL+"/api/v1/games/PAR001/scores", strings.NewReader(`{"hole":1,"score":3}`))
	request.Header.Set("PubGolf-Player-Id", identity["playerId"])
	result, err := server.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	result.Body.Close()
	if result.StatusCode != 204 {
		t.Fatal(result.StatusCode)
	}
	changed := snapshot(reader)
	players := changed["players"].([]any)
	if players[0].(map[string]any)["totalScore"] != float64(3) {
		t.Fatal(changed)
	}
	stream.Body.Close()
	reconnected := connect()
	defer reconnected.Body.Close()
	latest := snapshot(bufio.NewReader(reconnected.Body))
	if !reflect.DeepEqual(changed, latest) {
		t.Fatal("reconnect missed committed state")
	}
}

func TestRemainingHTTPUseCasesAndValidation(t *testing.T) {
	server := server(t)
	call := func(method, path, payload, actor string) (int, map[string]any) {
		request, _ := http.NewRequest(method, server.URL+path, strings.NewReader(payload))
		request.Header.Set("Content-Type", "application/json")
		if actor != "" {
			request.Header.Set("PubGolf-Player-Id", actor)
		}
		response, err := server.Client().Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		contents, err := io.ReadAll(response.Body)
		if err != nil {
			t.Fatal(err)
		}
		validateContract(t, request, response, contents)
		var result map[string]any
		if len(contents) > 0 {
			if err := json.Unmarshal(contents, &result); err != nil {
				t.Fatal(err)
			}
		}
		return response.StatusCode, result
	}
	_, identity := call("POST", "/api/v1/games", `{"host":"Alice"}`, "")
	actor := identity["playerId"].(string)
	status, result := call("POST", "/api/v1/games/PAR001/randomise", "", actor)
	if status != 200 || result["result"] != "Tequila" || result["hole"] != float64(1) {
		t.Fatal(status, result)
	}
	status, _ = call("POST", "/api/v1/games/PAR001/randomise", "", actor)
	if status != 409 {
		t.Fatal(status)
	}
	pubs := []map[string]any{}
	for hole := 1; hole <= 9; hole++ {
		pubs = append(pubs, map[string]any{"name": fmt.Sprintf("Pub %d", hole), "latitude": 51.5, "longitude": -0.1})
	}
	encoded, _ := json.Marshal(map[string]any{"pubs": pubs})
	status, result = call("PUT", "/api/v1/games/PAR001/pubs", string(encoded), actor)
	if status != 201 {
		t.Fatal(status, result)
	}
	status, result = call("GET", "/api/v1/games/PAR001/route", "", "")
	if status != 200 || len(result["pubs"].([]any)) != 9 {
		t.Fatal(status, result)
	}
	for _, payload := range []string{`{`, `null`, `{}`, `{"hole":1}`, `{"hole":0,"score":1}`, `{"hole":1,"score":99}`, `{"hole":1,"score":1,"penaltyType":"UNKNOWN"}`} {
		status, _ = call("POST", "/api/v1/games/PAR001/scores", payload, actor)
		if status != 400 {
			t.Fatalf("accepted %s: %d", payload, status)
		}
	}
	status, _ = call("POST", "/api/v1/games/PAR001/scores", `{"hole":1,"score":1}`, "00000000-0000-4000-8000-000000009999")
	if status != 403 {
		t.Fatal(status)
	}
	status, _ = call("GET", "/api/v1/places/search?q=pub", "", "")
	if status != 503 {
		t.Fatal(status)
	}
}

func TestSSEFlushesThroughHTTP2ReverseProxy(t *testing.T) {
	backend := server(t)
	target, _ := url.Parse(backend.URL)
	reverse := httputil.NewSingleHostReverseProxy(target)
	reverse.FlushInterval = -1
	proxy := httptest.NewUnstartedServer(reverse)
	proxy.EnableHTTP2 = true
	proxy.StartTLS()
	defer proxy.Close()
	response, err := proxy.Client().Post(proxy.URL+"/api/v1/games", "application/json", strings.NewReader(`{"host":"Alice"}`))
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	request, _ := http.NewRequestWithContext(ctx, "GET", proxy.URL+"/api/v1/games/PAR001/stream", nil)
	response, err = proxy.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.ProtoMajor != 2 {
		t.Fatal("proxy did not use HTTP/2")
	}
	reader := bufio.NewReader(response.Body)
	line, err := reader.ReadString('\n')
	if err != nil || line != "event: game-state\n" {
		t.Fatal(line, err)
	}
	for {
		line, err = reader.ReadString('\n')
		if err != nil {
			t.Fatal(err)
		}
		if line == ": heartbeat\n" {
			break
		}
	}
}

func TestPlaceSearchHTTPWithRealProviderAdapter(t *testing.T) {
	provider := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Query().Get("q") != "Pub & Wine" {
			t.Error(request.URL)
		}
		fmt.Fprint(writer, `[{"display_name":"Test Pub","lat":"51.5","lon":"-0.1"}]`)
	}))
	defer provider.Close()
	repository, err := sqlite.Open(filepath.Join(t.TempDir(), "games.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	service := application.New(repository, application.Dependencies{Places: upstream.NewPlaces(provider.URL, provider.Client(), time.Millisecond)})
	api := httptest.NewServer(httpapi.New(service, httpapi.Options{}))
	defer api.Close()
	request, _ := http.NewRequest("GET", api.URL+"/api/v1/places/search?q=Pub%20%26%20Wine", nil)
	response, err := api.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	contents, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	validateContract(t, request, response, contents)
	if response.StatusCode != 200 || !strings.Contains(string(contents), `"name":"Test Pub"`) {
		t.Fatal(response.StatusCode, string(contents))
	}
}
