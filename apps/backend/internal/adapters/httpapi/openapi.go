package httpapi

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/getkin/kin-openapi/openapi3gen"
)

//go:generate go run ../../../cmd/openapi -output openapi.json

func GenerateOpenAPI() ([]byte, error) {
	document := &openapi3.T{
		OpenAPI: "3.0.3",
		Info: &openapi3.Info{
			Title: "Pub Golf", Version: "1.0.0", Description: "API for the Pub Golf application.",
			Contact: &openapi3.Contact{Name: "Ben Suskins", Email: "development@suskins.co.uk"},
			License: &openapi3.License{Name: "GPL-2.0", URL: "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html"},
		},
		Servers:    openapi3.Servers{&openapi3.Server{URL: "/", Description: "Current server"}},
		Paths:      openapi3.NewPaths(),
		Components: &openapi3.Components{Schemas: openapi3.Schemas{}},
	}
	for _, endpoint := range (*server)(nil).endpoints() {
		if err := addOpenAPIOperation(document, endpoint); err != nil {
			return nil, err
		}
	}
	contents, err := json.MarshalIndent(document, "", "  ")
	if err != nil {
		return nil, err
	}
	// Resolve references from the serialized document before validating the generated contract.
	resolved, err := openapi3.NewLoader().LoadFromData(contents)
	if err != nil {
		return nil, err
	}
	if err = resolved.Validate(context.Background()); err != nil {
		return nil, err
	}
	return append(contents, '\n'), nil
}

func addOpenAPIOperation(document *openapi3.T, endpoint endpoint) error {
	method, path, _ := strings.Cut(endpoint.pattern, " ")
	operation := &openapi3.Operation{
		OperationID: endpoint.operationID, Summary: endpoint.summary,
		Tags: []string{endpointTag(path)}, Responses: openapi3.NewResponses(),
		Security: &openapi3.SecurityRequirements{},
	}
	addOpenAPIParameters(operation, endpoint)
	if endpoint.request != nil {
		schema, err := modelSchema(endpoint.request, document.Components.Schemas)
		if err != nil {
			return err
		}
		operation.RequestBody = &openapi3.RequestBodyRef{Value: &openapi3.RequestBody{
			Required: true, Content: openapi3.NewContentWithJSONSchemaRef(schema),
		}}
	}
	if err := addOpenAPIResponses(operation, endpoint, document.Components.Schemas); err != nil {
		return err
	}
	document.AddOperation(path, method, operation)
	return nil
}

func endpointTag(path string) string {
	switch {
	case strings.HasPrefix(path, "/api/v1/config/"):
		return "configuration"
	case strings.HasPrefix(path, "/api/v1/places/"):
		return "places"
	default:
		return "games"
	}
}

func modelSchema(model any, schemas openapi3.Schemas) (*openapi3.SchemaRef, error) {
	modelType := reflect.TypeOf(model)
	name := modelType.Name()
	if existing := schemas[name]; name != "" && existing != nil {
		return &openapi3.SchemaRef{Ref: "#/components/schemas/" + name}, nil
	}
	schema, err := openapi3gen.NewSchemaRefForValue(model, nil, openapi3gen.SchemaCustomizer(customizeModelSchema))
	if err != nil {
		return nil, fmt.Errorf("generate schema for %s: %w", modelType, err)
	}
	if name == "" {
		return schema, nil
	}
	schemas[name] = schema
	return &openapi3.SchemaRef{Ref: "#/components/schemas/" + name}, nil
}

func customizeModelSchema(_ string, modelType reflect.Type, tag reflect.StructTag, schema *openapi3.Schema) error {
	if err := applySchemaTags(tag, schema); err != nil {
		return err
	}
	if tag.Get("nullable") == "false" {
		schema.Nullable = false
	}
	for modelType.Kind() == reflect.Pointer {
		modelType = modelType.Elem()
	}
	if modelType == reflect.TypeFor[drinks]() {
		*schema = *openapi3.NewObjectSchema().WithAnyAdditionalProperties()
		schema.AdditionalProperties = openapi3.AdditionalProperties{
			Schema: &openapi3.SchemaRef{Value: openapi3.NewStringSchema()},
		}
		return nil
	}
	if modelType.Kind() != reflect.Struct {
		return nil
	}
	for index := 0; index < modelType.NumField(); index++ {
		field := modelType.Field(index)
		name, _, _ := strings.Cut(field.Tag.Get("json"), ",")
		if field.Tag.Get("required") == "true" {
			schema.Required = append(schema.Required, name)
		}
	}
	return nil
}

func applySchemaTags(tag reflect.StructTag, schema *openapi3.Schema) error {
	for _, name := range []string{"minimum", "maximum"} {
		if raw, present := tag.Lookup(name); present {
			value, err := strconv.ParseFloat(raw, 64)
			if err != nil {
				return fmt.Errorf("invalid %s tag: %w", name, err)
			}
			if name == "minimum" {
				schema.Min = &value
			} else {
				schema.Max = &value
			}
		}
	}
	if values, present := tag.Lookup("enum"); present {
		for _, value := range strings.Split(values, ",") {
			schema.Enum = append(schema.Enum, value)
		}
	}
	return applySizeTags(tag, schema)
}

func applySizeTags(tag reflect.StructTag, schema *openapi3.Schema) error {
	for _, name := range []string{"minLength", "maxLength", "minItems", "maxItems"} {
		raw, present := tag.Lookup(name)
		if !present {
			continue
		}
		value, err := strconv.ParseUint(raw, 10, 64)
		if err != nil {
			return fmt.Errorf("invalid %s tag: %w", name, err)
		}
		switch name {
		case "minLength":
			schema.MinLength = value
		case "maxLength":
			schema.MaxLength = &value
		case "minItems":
			schema.MinItems = value
		case "maxItems":
			schema.MaxItems = &value
		}
	}
	return nil
}
