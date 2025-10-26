#!/bin/bash

echo "================================================"
echo "  Casino Backend Server - Starting..."
echo "================================================"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "[ERROR] Go is not installed or not in PATH"
    echo "Please install Go from: https://go.dev/dl/"
    exit 1
fi

# Check if GCC is installed
if ! command -v gcc &> /dev/null; then
    echo "[WARNING] GCC is not installed"
    echo "SQLite requires GCC to compile."
    echo ""
    echo "Install GCC:"
    echo "  Linux (Debian/Ubuntu): sudo apt-get install build-essential"
    echo "  Mac: xcode-select --install"
    echo ""
    exit 1
fi

echo "[OK] Go version:"
go version
echo ""
echo "[OK] GCC version:"
gcc --version | head -n 1
echo ""

# Enable CGO
export CGO_ENABLED=1

# Create database directory if it doesn't exist
mkdir -p database

echo "[INFO] Starting server with CGO enabled..."
echo "[INFO] Server will be available at: http://localhost:8080"
echo "[INFO] Press Ctrl+C to stop the server"
echo ""
echo "================================================"
echo "  Server Logs:"
echo "================================================"
echo ""

# Run the server
go run cmd/api/main.go
