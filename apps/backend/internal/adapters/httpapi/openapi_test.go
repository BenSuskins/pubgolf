package httpapi_test

import (
	"context"
	"encoding/json"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/getkin/kin-openapi/openapi3filter"
	"github.com/getkin/kin-openapi/routers/legacy"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
)

func TestOpenAPIResponsesMatchRealHTTP(t *testing.T) {
	document, err := openapi3.NewLoader().LoadFromFile("openapi.json")
	if err != nil {
		t.Fatal(err)
	}
	if err = document.Validate(context.Background()); err != nil {
		t.Fatal(err)
	}
	document.Servers = nil
	router, err := legacy.NewRouter(document)
	if err != nil {
		t.Fatal(err)
	}
	server := server(t)
	fixture, err := os.ReadFile("testdata/kotlin-contract.json")
	if err != nil {
		t.Fatal(err)
	}
	var steps []struct {
		Method, Path, Actor string
		Body                any
		Capture             map[string]string
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
	for _, step := range steps {
		encoded, _ := json.Marshal(step.Body)
		request, _ := http.NewRequest(step.Method, server.URL+expand(step.Path), strings.NewReader(string(encoded)))
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
		contents, err := io.ReadAll(response.Body)
		response.Body.Close()
		if err != nil {
			t.Fatal(err)
		}
		if step.Capture != nil {
			var object map[string]string
			json.Unmarshal(contents, &object)
			for key, field := range step.Capture {
				variables[key] = object[field]
			}
		}
		route, parameters, err := router.FindRoute(request)
		if err != nil {
			t.Fatalf("route %s %s: %v", request.Method, request.URL, err)
		}
		validation := &openapi3filter.ResponseValidationInput{RequestValidationInput: &openapi3filter.RequestValidationInput{Request: request, PathParams: parameters, Route: route}, Status: response.StatusCode, Header: response.Header, Options: &openapi3filter.Options{IncludeResponseStatus: true}}
		validation.SetBodyBytes(contents)
		if err = openapi3filter.ValidateResponse(context.Background(), validation); err != nil {
			t.Fatalf("%s %s: %v", step.Method, step.Path, err)
		}
	}
}

func validateContract(t *testing.T, request *http.Request, response *http.Response, contents []byte) {
	t.Helper()
	document, err := openapi3.NewLoader().LoadFromFile("openapi.json")
	if err != nil {
		t.Fatal(err)
	}
	document.Servers = nil
	router, err := legacy.NewRouter(document)
	if err != nil {
		t.Fatal(err)
	}
	route, parameters, err := router.FindRoute(request)
	if err != nil {
		t.Fatal(err)
	}
	validation := &openapi3filter.ResponseValidationInput{RequestValidationInput: &openapi3filter.RequestValidationInput{Request: request, PathParams: parameters, Route: route}, Status: response.StatusCode, Header: response.Header, Options: &openapi3filter.Options{IncludeResponseStatus: true}}
	validation.SetBodyBytes(contents)
	if err = openapi3filter.ValidateResponse(context.Background(), validation); err != nil {
		t.Fatalf("%s %s: %v", request.Method, request.URL.Path, err)
	}
}
