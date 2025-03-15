package main

import (
	"os"
	"os/exec"
)

func main() {
	cmd := exec.Command("go", "run", "./backend/cmd/api/main.go")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
}
