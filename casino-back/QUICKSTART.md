# Guía Rápida - Casino Backend

## 🚀 Iniciar el Servidor (Paso a Paso)

### Paso 1: Instalar GCC (solo la primera vez)

**Si estás en Windows y no tienes GCC:**

1. Descarga MinGW-w64: https://github.com/niXman/mingw-builds-binaries/releases
2. Descarga: `x86_64-13.2.0-release-posix-seh-ucrt-rt_v11-rev1.7z`
3. Extrae en `C:\mingw64`
4. Agrega `C:\mingw64\bin` a tu PATH:
   - Windows + R → `sysdm.cpl` → Avanzado → Variables de entorno
   - En "Variables del sistema", edita `Path`
   - Agrega nueva línea: `C:\mingw64\bin`
   - Acepta y reinicia tu terminal

5. Verifica en una nueva terminal:
```bash
gcc --version
```

### Paso 2: Ejecutar el Servidor

Abre una terminal en la carpeta `casino-back` y ejecuta:

**Windows PowerShell:**
```powershell
$env:CGO_ENABLED=1
go run cmd/api/main.go
```

**Windows CMD:**
```cmd
set CGO_ENABLED=1
go run cmd/api/main.go
```

**Linux/Mac:**
```bash
CGO_ENABLED=1 go run cmd/api/main.go
```

### Paso 3: Verificar que Funciona

Abre tu navegador o usa curl:
```bash
curl http://localhost:8080/health
```

Deberías ver: `{"status":"ok"}`

## 🧪 Probar con Postman

1. Abre Postman
2. Importa: `docs/postman_collection.json`
3. Ejecuta en orden:
   - **Register User** → Crea una cuenta
   - **Login** → Obtiene token JWT (se guarda automáticamente)
   - **Get Balance** → Verifica que tienes $1000
   - **Place Bet - Number** → Apuesta a un número
   - **Place Bet - Color** → Apuesta a un color
   - **Get Bet History** → Ver historial

## 📊 Base de Datos

Se crea automáticamente en: `database/casino.db`

Para ver los datos (opcional):
```bash
# Instalar SQLite CLI
# Windows: choco install sqlite
# Linux: apt-get install sqlite3
# Mac: brew install sqlite3

# Ver datos
sqlite3 database/casino.db "SELECT * FROM users;"
sqlite3 database/casino.db "SELECT * FROM balances;"
sqlite3 database/casino.db "SELECT * FROM bets;"
```

## 🔧 Solución de Problemas

### Error: "CGO_ENABLED=0"
- **Causa**: No tienes GCC instalado o CGO no está habilitado
- **Solución**: Instala MinGW-w64 (Paso 1 arriba) y asegúrate de ejecutar con `CGO_ENABLED=1`

### Error: "gcc: command not found"
- **Causa**: GCC no está en tu PATH
- **Solución**: Reinicia tu terminal después de agregar MinGW al PATH

### Error: "port 8080 already in use"
- **Causa**: Ya hay un servidor corriendo en el puerto 8080
- **Solución**:
  - Encuentra el proceso: `netstat -ano | findstr :8080` (Windows)
  - Mata el proceso: `taskkill /PID <PID> /F` (Windows)
  - O cambia el puerto: `set PORT=8081 && go run cmd/api/main.go`

### El servidor no responde
- Verifica que se inició correctamente (deberías ver los logs)
- Verifica el puerto: por defecto es 8080
- Prueba con: `curl http://localhost:8080/health`

## 📝 Comandos Útiles

```bash
# Ver módulos Go instalados
go list -m all

# Limpiar cache de Go
go clean -modcache

# Formatear código
go fmt ./...

# Verificar errores
go vet ./...

# Recompilar desde cero
rm -rf bin/
CGO_ENABLED=1 go build -o bin/api.exe cmd/api/main.go

# Ver variables de entorno (Windows PowerShell)
Get-ChildItem Env:

# Ver variables de entorno (Linux/Mac)
printenv
```

## 🎮 Flujo de Prueba Completo

1. **Registrar usuario:**
```bash
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","email":"player1@example.com","password":"password123"}'
```

2. **Login (guarda el token):**
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"player1@example.com","password":"password123"}'
```

3. **Ver balance (reemplaza TOKEN):**
```bash
curl -X GET http://localhost:8080/api/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

4. **Apostar:**
```bash
curl -X POST http://localhost:8080/api/bets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"bet_type":"number","bet_value":"17","bet_amount":50}'
```

## ⚠️ Recordatorio

Este es un proyecto educativo con vulnerabilidades intencionales. NO lo expongas a internet.
