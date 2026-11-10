package httpapi_test

import (
	"encoding/json"
	"fmt"
	"testing"
)

func TestRandomiseHTTP(t *testing.T) {
	server := server(t)
	identity := createIdentity(t, server)
	status, result := callAPI(t, server, "POST", "/api/v1/games/PAR001/randomise", "", identity["playerId"])
	if status != 200 || result["result"] != "Tequila" || result["hole"] != float64(1) {
		t.Fatal(status, result)
	}
	status, _ = callAPI(t, server, "POST", "/api/v1/games/PAR001/randomise", "", identity["playerId"])
	if status != 409 {
		t.Fatal(status)
	}
}

func TestPubRouteHTTP(t *testing.T) {
	server := server(t)
	identity := createIdentity(t, server)
	pubs := []map[string]any{}
	for hole := 1; hole <= 9; hole++ {
		pubs = append(pubs, map[string]any{"name": fmt.Sprintf("Pub %d", hole), "latitude": 51.5, "longitude": -0.1})
	}
	encoded, err := json.Marshal(map[string]any{"pubs": pubs})
	if err != nil {
		t.Fatal(err)
	}
	status, result := callAPI(t, server, "PUT", "/api/v1/games/PAR001/pubs", string(encoded), identity["playerId"])
	if status != 201 {
		t.Fatal(status, result)
	}
	status, result = callAPI(t, server, "GET", "/api/v1/games/PAR001/route", "", "")
	if status != 200 || len(result["pubs"].([]any)) != 9 {
		t.Fatal(status, result)
	}
}

func TestMalformedScoreHTTP(t *testing.T) {
	server := server(t)
	identity := createIdentity(t, server)
	payloads := []string{
		`{`,
		`null`,
		`{}`,
		`{"hole":1}`,
		`{"hole":0,"score":1}`,
		`{"hole":1,"score":99}`,
		`{"hole":1,"score":1,"penaltyType":"UNKNOWN"}`,
	}
	for _, payload := range payloads {
		status, _ := callAPI(t, server, "POST", "/api/v1/games/PAR001/scores", payload, identity["playerId"])
		if status != 400 {
			t.Fatalf("accepted %s: %d", payload, status)
		}
	}
}

func TestPenaltyOptionsMatchRecordedRound(t *testing.T) {
	server := server(t)
	identity := createIdentity(t, server)
	status, result := callAPI(t, server, "GET", "/api/v1/config/penalty-options", "", "")
	if status != 200 {
		t.Fatal(status, result)
	}
	options := result["penalties"].([]any)
	if len(options) != 2 {
		t.Fatal(options)
	}
	for index, expected := range []struct {
		kind   string
		name   string
		points float64
	}{{"SKIP", "Skip a drink", 5}, {"CHUNDER", "Tactical chunder", 10}} {
		option := options[index].(map[string]any)
		if option["type"] != expected.kind || option["name"] != expected.name || option["points"] != expected.points {
			t.Fatal(option)
		}
		payload := fmt.Sprintf(`{"hole":%d,"score":1,"penaltyType":%q}`, index+1, expected.kind)
		status, _ = callAPI(t, server, "POST", "/api/v1/games/PAR001/scores", payload, identity["playerId"])
		if status != 204 {
			t.Fatal(status)
		}
	}
	status, result = callAPI(t, server, "GET", "/api/v1/games/PAR001", "", "")
	if status != 200 {
		t.Fatal(status, result)
	}
	player := result["players"].([]any)[0].(map[string]any)
	verifyRecordedPenalties(t, player, options)
}

func verifyRecordedPenalties(t *testing.T, player map[string]any, options []any) {
	t.Helper()
	for index, option := range options {
		penalty := player["penalties"].([]any)[index].(map[string]any)
		definition := option.(map[string]any)
		if penalty["type"] != definition["type"] || penalty["points"] != definition["points"] ||
			player["scores"].([]any)[index] != definition["points"] {
			t.Fatal(player, options)
		}
	}
}

func TestOutsiderAndUnavailableSearchHTTP(t *testing.T) {
	server := server(t)
	createIdentity(t, server)
	status, _ := callAPI(
		t,
		server,
		"POST",
		"/api/v1/games/PAR001/scores",
		`{"hole":1,"score":1}`,
		"00000000-0000-4000-8000-000000009999",
	)
	if status != 403 {
		t.Fatal(status)
	}
	status, _ = callAPI(t, server, "GET", "/api/v1/places/search?q=pub", "", "")
	if status != 503 {
		t.Fatal(status)
	}
}
