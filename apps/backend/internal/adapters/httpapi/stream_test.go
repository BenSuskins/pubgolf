package httpapi_test

import (
	"bufio"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func connectStream(t *testing.T, ctx context.Context, server *httptest.Server, code string) *http.Response {
	t.Helper()
	request, err := http.NewRequestWithContext(ctx, "GET", server.URL+"/api/v1/games/"+code+"/stream", nil)
	if err != nil {
		t.Fatal(err)
	}
	response, err := server.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	if response.Header.Get("Content-Type") != "text/event-stream" {
		response.Body.Close()
		t.Fatal(response.Header)
	}
	return response
}

func readSnapshot(t *testing.T, reader *bufio.Reader) map[string]any {
	t.Helper()
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			t.Fatal(err)
		}
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		var value map[string]any
		if err = json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &value); err != nil {
			t.Fatal(err)
		}
		return value
	}
}
