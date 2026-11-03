package httpapi_test

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpapi"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/nominatim"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/roundupdates"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/sqlite"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
)

func server(t *testing.T) *httptest.Server {
	t.Helper()
	counter := 0
	broadcaster := roundupdates.New(8)
	t.Cleanup(broadcaster.Close)
	repository, err := sqlite.Open(filepath.Join(t.TempDir(), "games.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { repository.Close() })
	newIdentifier := func() string { counter++; return fmt.Sprintf("00000000-0000-4000-8000-%012d", counter) }
	games := application.NewRoundApplication(repository, application.RoundDependencies{
		NewRoundID:            newIdentifier,
		NewPlayerID:           newIdentifier,
		NewRoundCode:          func() string { return "PAR001" },
		Now:                   func() time.Time { return time.Unix(42, 0).UTC() },
		ChooseWildcardOutcome: func() string { return "Tequila" },
		RoundStates:           broadcaster,
		Subscriptions:         broadcaster,
	})
	server := httptest.NewServer(
		httpapi.New(games, application.NewPlaceSearch(nil), httpapi.Options{Heartbeat: 20 * time.Millisecond}),
	)
	t.Cleanup(server.Close)
	return server
}

func TestKotlinRESTCharacterization(t *testing.T) {
	client := scenarioClient{server: server(t), variables: map[string]string{}}
	for index, step := range kotlinContract(t) {
		t.Run(fmt.Sprintf("%02d %s %s", index, step.Method, step.Path), func(t *testing.T) { client.check(t, step) })
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
	response, err := server.Client().
		Post(server.URL+"/api/v1/games", "application/json", strings.NewReader(`{"host":"Alice"}`))
	if err != nil {
		t.Fatal(err)
	}
	var identity map[string]string
	json.NewDecoder(response.Body).Decode(&identity)
	response.Body.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	stream := connectStream(t, ctx, server, identity["gameCode"])
	defer stream.Body.Close()
	reader := bufio.NewReader(stream.Body)
	initial := readSnapshot(t, reader)
	if initial["gameCode"] != "PAR001" {
		t.Fatal(initial)
	}
	request, _ := http.NewRequest(
		"POST",
		server.URL+"/api/v1/games/PAR001/scores",
		strings.NewReader(`{"hole":1,"score":3}`),
	)
	request.Header.Set("PubGolf-Player-Id", identity["playerId"])
	result, err := server.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	result.Body.Close()
	if result.StatusCode != 204 {
		t.Fatal(result.StatusCode)
	}
	changed := readSnapshot(t, reader)
	players := changed["players"].([]any)
	if players[0].(map[string]any)["totalScore"] != float64(3) {
		t.Fatal(changed)
	}
	stream.Body.Close()
	reconnected := connectStream(t, ctx, server, identity["gameCode"])
	defer reconnected.Body.Close()
	latest := readSnapshot(t, bufio.NewReader(reconnected.Body))
	if !reflect.DeepEqual(changed, latest) {
		t.Fatal("reconnect missed committed state")
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
	response, err := proxy.Client().
		Post(proxy.URL+"/api/v1/games", "application/json", strings.NewReader(`{"host":"Alice"}`))
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
	games := application.NewRoundApplication(repository, application.RoundDependencies{})
	places := application.NewPlaceSearch(nominatim.NewPlaceSearcher(provider.URL, provider.Client(), time.Millisecond))
	api := httptest.NewServer(httpapi.New(games, places, httpapi.Options{}))
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
