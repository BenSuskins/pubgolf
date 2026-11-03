package main

import (
	"bytes"
	"flag"
	"fmt"
	"os"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpapi"
)

func main() {
	output := flag.String("output", "internal/adapters/httpapi/openapi.json", "OpenAPI document path")
	check := flag.Bool("check", false, "Check that the document is current without writing it")
	flag.Parse()
	if err := run(*output, *check); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(output string, check bool) error {
	contents, err := httpapi.GenerateOpenAPI()
	if err != nil {
		return err
	}
	if !check {
		return os.WriteFile(output, contents, 0o644)
	}
	existing, err := os.ReadFile(output)
	if err != nil {
		return err
	}
	if !bytes.Equal(contents, existing) {
		return fmt.Errorf("%s is stale; run make backend-openapi", output)
	}
	return nil
}
