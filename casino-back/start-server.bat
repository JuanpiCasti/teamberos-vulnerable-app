@echo off
echo ================================================
echo   Casino Backend Server - Starting...
echo ================================================
echo.

REM Check if Go is installed
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Go is not installed or not in PATH
    echo Please install Go from: https://go.dev/dl/
    pause
    exit /b 1
)

REM Check if GCC is installed
where gcc >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] GCC is not installed or not in PATH
    echo SQLite requires GCC (MinGW) to compile.
    echo.
    echo Please install MinGW-w64:
    echo   1. Download from: https://github.com/niXman/mingw-builds-binaries/releases
    echo   2. Extract to C:\mingw64
    echo   3. Add C:\mingw64\bin to your PATH
    echo   4. Restart this terminal
    echo.
    pause
    exit /b 1
)

echo [OK] Go version:
go version
echo.
echo [OK] GCC version:
gcc --version | findstr gcc
echo.

REM Enable CGO
set CGO_ENABLED=1

REM Create database directory if it doesn't exist
if not exist "database" mkdir database

echo [INFO] Starting server with CGO enabled...
echo [INFO] Server will be available at: http://localhost:8080
echo [INFO] Press Ctrl+C to stop the server
echo.
echo ================================================
echo   Server Logs:
echo ================================================
echo.

REM Run the server
go run cmd/api/main.go

pause
