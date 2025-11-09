package main

import (
	"context"
	"log"

	"github.com/parvizcorp/kitchen-configurator/services/rules-go/app"
)

func main() {
	if err := app.New().Run(context.Background()); err != nil {
		log.Fatal(err)
	}
}
