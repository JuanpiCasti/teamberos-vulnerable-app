# Casino Backend - API REST con Go

> ⚠️ **ADVERTENCIA**: Esta aplicación contiene vulnerabilidades de seguridad **INTENCIONALES** con fines educativos. **NO debe ser utilizada en producción ni expuesta a internet.**

## Descripción

Backend API REST para el proyecto Casino Virtual, desarrollado como trabajo práctico para la materia **Seguridad en Aplicaciones Web**.

Este backend está diseñado con una estructura segura inicialmente, pero está preparado para implementar vulnerabilidades específicas del OWASP Top 10 con fines educativos.

## Tecnologías

- **Go 1.23+**
- **Chi** - Router HTTP ligero y rápido
- **sqlx** - Extensión de database/sql con mejoras
- **SQLite** - Base de datos embebida
- **JWT** - Autenticación con JSON Web Tokens
- **bcrypt** - Hash seguro de contraseñas

## Estructura del Proyecto

```
casino-back/
├── cmd/
│   └── api/
│       └── main.go              # Punto de entrada
├── internal/
│   ├── handlers/                # Controladores HTTP
│   │   ├── auth.go             # Registro y login
│   │   ├── user.go             # Perfil de usuario
│   │   ├── balance.go          # Gestión de saldo
│   │   └── bets.go             # Historial de apuestas
│   ├── models/                  # Modelos de datos
│   │   ├── user.go
│   │   ├── balance.go
│   │   └── bet.go
│   ├── database/                # Configuración de DB
│   │   └── db.go
│   └── middleware/              # Middlewares
│       └── auth.go             # Autenticación JWT
├── database/
│   └── casino.db               # Base de datos SQLite
├── docs/                       # Documentación
│   ├── swagger.yaml            # Especificación OpenAPI
│   └── postman_collection.json # Colección de Postman
├── go.mod
├── go.sum
├── .gitignore
└── README.md
```

## Instalación

### Requisitos Previos

- Go 1.23 o superior
- Git

### Pasos de Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/juanpicasti/casino-back.git
cd casino-back
```

2. Instalar dependencias:
```bash
go mod download
```

3. (Opcional) Configurar variables de entorno:
```bash
# Crear archivo .env (opcional)
export JWT_SECRET="your-secret-key"
export PORT="8080"
export DB_PATH="./database/casino.db"
```

## Uso

### ⚠️ Importante: CGO y SQLite

SQLite requiere CGO (C bindings) para funcionar. Si obtienes el error `"Binary was compiled with 'CGO_ENABLED=0'"`, necesitas:

**Windows:**
1. Instalar **GCC** (MinGW-w64):
   - Descargar desde: https://www.mingw-w64.org/downloads/
   - O usar chocolatey: `choco install mingw`
   - Agregar MinGW a tu PATH

2. Verificar instalación:
   ```bash
   gcc --version
   ```

**Linux/Mac:**
```bash
# Linux (Debian/Ubuntu)
sudo apt-get install build-essential

# Mac
xcode-select --install
```

### Iniciar el Servidor

**Opción 1: Ejecutar directamente con CGO habilitado**

```bash
# Windows (PowerShell)
$env:CGO_ENABLED=1; go run cmd/api/main.go

# Windows (CMD)
set CGO_ENABLED=1 && go run cmd/api/main.go

# Linux/Mac
CGO_ENABLED=1 go run cmd/api/main.go
```

**Opción 2: Compilar primero y luego ejecutar**

```bash
# Windows (PowerShell)
$env:CGO_ENABLED=1; go build -o bin/api.exe cmd/api/main.go
.\bin\api.exe

# Windows (CMD)
set CGO_ENABLED=1 && go build -o bin/api.exe cmd/api/main.go
bin\api.exe

# Linux/Mac
CGO_ENABLED=1 go build -o bin/api cmd/api/main.go
./bin/api
```

**Opción 3: Si CGO no funciona, usar otra base de datos**

Si no puedes instalar GCC, puedes modificar el código para usar otra base de datos que no requiera CGO (PostgreSQL, MySQL con driver pure-Go).

### Verificar que el Servidor Funciona

Una vez iniciado, deberías ver:
```
Database initialized successfully
Server starting on port 8080...
CORS enabled for: http://localhost:5173, http://localhost:5174, http://localhost:5175
⚠️  WARNING: This is an educational project with intentional vulnerabilities
    DO NOT use in production or expose to the internet!
```

El servidor estará disponible en `http://localhost:8080`

Prueba con:
```bash
curl http://localhost:8080/health
```

Respuesta esperada:
```json
{"status":"ok"}
```

### Endpoints Disponibles

#### Públicos (sin autenticación)

- `POST /api/register` - Registrar nuevo usuario
- `POST /api/login` - Iniciar sesión
- `GET /health` - Health check

#### Protegidos (requieren JWT token)

**Perfil de Usuario:**
- `GET /api/user/profile` - Ver perfil propio
- `PUT /api/user/profile` - Actualizar perfil

**Gestión de Saldo:**
- `GET /api/balance` - Consultar balance
- `POST /api/balance/add` - Acreditar saldo (para premios)
- `POST /api/balance/deduct` - Debitar saldo

**Apuestas:**
- `POST /api/bets` - Realizar apuesta
- `GET /api/bets` - Ver historial de apuestas
- `GET /api/bets/:id` - Ver detalle de apuesta

### Ejemplos de Uso

#### 1. Registrar Usuario

```bash
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "email": "player1@example.com",
    "password": "password123"
  }'
```

#### 2. Iniciar Sesión

```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player1@example.com",
    "password": "password123"
  }'
```

Respuesta:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "player1",
    "email": "player1@example.com",
    "role": "player"
  }
}
```

#### 3. Realizar Apuesta (requiere token)

```bash
curl -X POST http://localhost:8080/api/bets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bet_type": "number",
    "bet_value": "17",
    "bet_amount": 50
  }'
```

## Base de Datos

### Esquema

**users**
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- email (TEXT UNIQUE)
- password_hash (TEXT)
- role (TEXT) - "player" o "admin"
- created_at (DATETIME)

**balances**
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FOREIGN KEY)
- amount (REAL) - Balance actual
- updated_at (DATETIME)

**bets**
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FOREIGN KEY)
- bet_type (TEXT) - "number" o "color"
- bet_value (TEXT) - Número o color apostado
- bet_amount (REAL) - Monto apostado
- winning_number (TEXT) - Número ganador
- winning_color (TEXT) - Color ganador
- result (TEXT) - "win" o "loss"
- payout (REAL) - Premio obtenido
- created_at (DATETIME)

## Vulnerabilidades Planificadas

Este proyecto está diseñado para implementar las siguientes vulnerabilidades con fines educativos:

### 1. A01: Broken Access Control (IDOR)
**Endpoint afectado:** `GET /api/user/profile?id=<user_id>`
- Se agregará parámetro `id` sin validación de autorización

### 2. A02: Cryptographic Failures
**Endpoint afectado:** `GET /api/reset?token=<token>`
- Tokens generados con MD5 predecible

### 3. A03: SQL Injection
**Endpoint afectado:** `GET /api/bets?filter=<date>`
- Query construida con concatenación de strings

### 4. A04: Race Condition
**Endpoint afectado:** `POST /api/balance/add`
- Sin lock de base de datos
- Validación separada de la actualización (TOCTOU)

**IMPORTANTE:** Estas vulnerabilidades NO están implementadas actualmente. El código actual es seguro y se modificará posteriormente para fines educativos.

## Desarrollo

### Ejecutar Tests

```bash
go test ./...
```

### Linter

```bash
go vet ./...
golangci-lint run
```

### Compilar para Producción

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o bin/api-linux cmd/api/main.go

# Windows
GOOS=windows GOARCH=amd64 go build -o bin/api-windows.exe cmd/api/main.go

# macOS
GOOS=darwin GOARCH=amd64 go build -o bin/api-macos cmd/api/main.go
```

## Documentación API

- **Swagger UI:** Ver `docs/swagger.yaml`
- **Postman Collection:** Importar `docs/postman_collection.json`

## Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `8080` |
| `DB_PATH` | Ruta de la base de datos | `./database/casino.db` |
| `JWT_SECRET` | Secreto para firmar JWT | `your-secret-key-change-in-production` |

## Advertencias de Seguridad

⚠️ **IMPORTANTE:**
- Este código contiene vulnerabilidades INTENCIONALES
- NO debe ser usado en entornos de producción
- NO debe ser expuesto a internet
- Solo debe ejecutarse en entornos de desarrollo locales y controlados
- El uso indebido de estas técnicas en sistemas reales es ilegal

## Licencia

Este proyecto es solo para fines educativos y de investigación en seguridad.

## Autores

Trabajo práctico realizado para la materia Seguridad en Aplicaciones Web.
