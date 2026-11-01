package httpapi_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/getkin/kin-openapi/openapi3filter"
	"github.com/getkin/kin-openapi/routers/legacy"
)

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
	validation := &openapi3filter.ResponseValidationInput{
		RequestValidationInput: &openapi3filter.RequestValidationInput{
			Request:    request,
			PathParams: parameters,
			Route:      route,
		},
		Status:  response.StatusCode,
		Header:  response.Header,
		Options: &openapi3filter.Options{IncludeResponseStatus: true},
	}
	validation.SetBodyBytes(contents)
	if err = openapi3filter.ValidateResponse(context.Background(), validation); err != nil {
		t.Fatalf("%s %s: %v", request.Method, request.URL.Path, err)
	}
}
