# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ SECURITY WARNING

**This is an educational project for a Web Application Security course.**

This application contains **INTENTIONAL VULNERABILITIES** for educational purposes:
- **DO NOT** deploy to production
- **DO NOT** expose to the internet
- **ONLY** use in controlled local development environments
- These vulnerabilities are designed to demonstrate OWASP Top 10 attack chains

See the "Intentional Vulnerabilities" section below for details on the planned security issues.

## Project Overview

This is a casino game application built with React Router 7, featuring an American Roulette game. It's a full-stack SSR application with TypeScript and Tailwind CSS v4.

**Purpose**: Educational project demonstrating a vulnerability exploitation chain based on OWASP Top 10.

## Development Commands

```bash
# Start development server with HMR (runs on http://localhost:5173 or next available port)
npm run dev

# Type checking and route type generation
npm run typecheck

# Production build (outputs to build/client and build/server)
npm run build

# Start production server (after building)
npm start
```

## Architecture

### SSR-First Application
- **SSR enabled by default** in `react-router.config.ts`
- Server-side rendering with Node.js runtime via `@react-router/node`
- Production server uses `@react-router/serve`
- Bot detection via `isbot` package

### Routing System
- **File-based routing** configured in `app/routes.ts` (not file-system based)
- Routes use React Router v7's typed route configuration
- Auto-generated types in `.react-router/types/` directory
- Current routes:
  - `/` → `routes/home.tsx` (Casino landing page)
  - `/roulette` → `routes/roulette.tsx` (Roulette game)

### Global State Management
- **BalanceContext** (`app/contexts/BalanceContext.tsx`): Manages player's global balance across the app
  - Wraps entire app in `app/root.tsx`
  - Starting balance: $1000
  - Methods: `addBalance()`, `subtractBalance()`, `setBalance()`

### Game Architecture: Roulette

**Core Data** (`app/constants/roulette.ts`):
- `ROULETTE_WHEEL`: Array of 38 numbers in American roulette order (includes 0 and 00)
- `Bet` interface supports two types:
  - `type: "number"` - Individual number bets (36x payout)
  - `type: "color"` - Color bets for red/black/green (2x payout)

**Game Flow** (`app/routes/roulette.tsx`):
1. Player places bets using `addBet(type, value, amount)`
2. `spin()` deducts total bet from balance
3. Random number selected from `ROULETTE_WHEEL` with index tracked
4. `winningIndex` passed to `RouletteWheel` for visual synchronization
5. Payouts calculated for all matching bets (number + color)

**Wheel Synchronization** (`app/components/RouletteWheel.tsx`):
- Uses **dynamic rotation calculation** based on `winningIndex`
- Each segment = 360° / 38 numbers = ~9.474°
- Rotation formula: `1800° + (-winningNumberAngle)` to align winning number with top pointer
- CSS `conic-gradient` starts at `-90deg` (top) for proper alignment
- Numbers positioned at **center of color segments** for visual accuracy
- Animation: 3s cubic-bezier transition applied via inline styles

**Betting Board** (`app/components/BettingBoard.tsx`):
- Chip selector: $5, $10, $25, $50, $100, $500
- Color betting: Single bet on all numbers of a color (not individual number bets)
- Number betting: Direct bets on specific numbers
- Visual bet indicators: Yellow badges show active bet amounts

### Styling
- **Tailwind CSS v4** with Vite plugin (`@tailwindcss/vite`)
- Custom theme in `app/app.css` using `@theme` directive
- Inter font family from Google Fonts (preconnected in `app/root.tsx`)
- Dark mode support with CSS media queries

### TypeScript Configuration
- Path alias: `~/` maps to `./app/`
- Strict mode enabled
- Route types auto-generated: Run `npm run typecheck` to regenerate

## Important Implementation Details

### React Imports for SSR
When creating context providers or using React types, **always import types separately** to avoid SSR errors:
```typescript
// ✅ Correct
import { createContext, useContext } from "react";
import type React from "react";
function Provider({ children }: { children: React.ReactNode }) {}

// ❌ Wrong - causes SSR error
import { createContext, useContext, ReactNode } from "react";
function Provider({ children }: { children: ReactNode }) {}
```

### Adding New Routes
1. Add route to `app/routes.ts` using `route()` or `index()` functions
2. Create route file in `app/routes/` directory
3. Export `meta` function for page metadata
4. Run `npm run typecheck` to generate route types
5. Import route types: `import type { Route } from "./+types/routename"`

### Roulette Wheel Mechanics
- The wheel **must receive both `winningNumber` and `winningIndex`** for proper synchronization
- Rotation state is managed internally with `useState` and `useEffect`
- The pointer is positioned at top (`top: 0`) - rotation aligns winning number to this position
- Gradient and number positioning use the same angle calculation for perfect alignment

## Deployment

**Docker:**
```bash
docker build -t ruleta-front .
docker run -p 3000:3000 ruleta-front
```

Multi-stage Dockerfile includes development deps, production deps, build, and runtime stages.

**Manual:**
Deploy the `build/` directory with Node.js 20+. Requires `package.json` and lock file.

---

## Intentional Vulnerabilities (OWASP Top 10)

This section documents the **planned vulnerabilities** to be implemented for educational purposes. These form an **attack chain** where each vulnerability enables the next step.

### User Roles

The application will have two user types:
- **Players**: Register for free, bet on roulette games, manage their balance
- **Administrators**: Manage user balances, bet history, and user accounts

### Vulnerability Chain

#### 1. A01: Broken Access Control (IDOR)

**Endpoint**: `/user/profile?id=<user_id>`

**Vulnerability**:
- No permission checks on profile viewing
- Authenticated users can modify the `id` parameter to view other users' profiles
- Exposes username and email of any user

**Attack**:
```
GET /user/profile?id=123  → Own profile
GET /user/profile?id=124  → Another user's profile (leaks email)
```

**Impact**: Attacker collects email addresses needed for the next attack.

---

#### 2. A02: Cryptographic Failures

**Endpoint**: `/reset?token=<token>`

**Vulnerability**:
- Password reset tokens generated as `MD5(email)`
- Tokens are predictable and can be pre-computed
- No expiration or single-use enforcement

**Attack**:
```javascript
// Using email from IDOR attack
const email = "victim@example.com";
const token = MD5(email);  // Predictable token
// Access: /reset?token=<computed_token>
```

**Impact**: Account takeover of users with real balances using emails from step 1.

---

#### 3. A03: Injection (SQL Injection)

**Endpoint**: `/bets?filter=<date>`

**Vulnerability**:
- SQL query built with string concatenation
- No input sanitization or parameterized queries
- Users can normally only see their own bet history

**Attack**:
```sql
/bets?filter=2024-01-01' UNION SELECT * FROM users--
/bets?filter=2024-01-01' UNION SELECT user_id,balance,deposits FROM accounts--
```

**Impact**:
- Read sensitive data from other tables
- Identify high-value target accounts
- Determine which compromised accounts are worth exploiting

---

#### 4. A04: Insecure Design (Race Condition)

**Endpoint**: `POST /balance/add`

**Vulnerability**:
- No database locking mechanism
- Validation check and balance update are separate operations (TOCTOU)
- Client-side decides if user won (insecure trust boundary)
- Single-use check per `bet_id` but no atomic operation

**Attack**:
```python
import requests
import threading

def exploit_race_condition():
    requests.post('/balance/add', json={
        'bet_id': 123,
        'amount': 1000
    })

# Send concurrent requests
threads = [threading.Thread(target=exploit_race_condition) for _ in range(10)]
for t in threads: t.start()
```

**Impact**:
- Same winning bet credited multiple times
- Artificial balance inflation
- Economic integrity of casino compromised

---

### Attack Flow Diagram

```
Step 1: IDOR
  ↓ (Collect user emails)
Step 2: Weak Crypto
  ↓ (Compromise high-value account)
Step 3: SQL Injection
  ↓ (Identify profitable targets)
Step 4: Race Condition
  ↓ (Inflate balance artificially)
Result: Complete casino compromise
```

### Implementation Guidelines

When implementing these vulnerabilities:

1. **Document clearly**: Comment code to indicate intentional vulnerabilities
2. **Make them realistic**: Vulnerabilities should resemble real-world mistakes
3. **Keep them exploitable**: Ensure each vulnerability can be reliably exploited
4. **Chain them properly**: Each step should provide information/access for the next

### Secure Alternatives (NOT to implement)

For reference, the secure implementations would be:

1. **IDOR**: Check `req.user.id === profileId` before returning data
2. **Crypto**: Use cryptographically secure random tokens with expiration
3. **SQL Injection**: Use parameterized queries or ORM
4. **Race Condition**: Use database transactions with row-level locking
