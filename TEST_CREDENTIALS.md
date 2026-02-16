# 🔐 Test Credentials for Talkivo

## Test User Accounts

All test accounts use the same password for easy testing: **`Test1234`**

### Available Test Accounts

| Name | Email | Level | Phone | Password |
|------|-------|-------|-------|----------|
| John Beginner | `beginner@test.com` | BEGINNER | 9000000001 | `Test1234` |
| Sarah Intermediate | `intermediate@test.com` | INTERMEDIATE | 9000000002 | `Test1234` |
| Mike Advanced | `advanced@test.com` | ADVANCED | 9000000003 | `Test1234` |

### Your Main Account

| Name | Email | Level | Phone | Password |
|------|-------|-------|-------|----------|
| yashwanth adepu | `yashwanthadepu007@gmail.com` | BEGINNER | 8919194014 | (Your password) |

---

## How to Login

1. Go to: http://localhost:3001/login
2. Enter email and password from the table above
3. Start practicing!

---

## Available Skill Levels

- **BEGINNER** - Simple conversations, basic vocabulary
- **INTERMEDIATE** - More complex topics, varied vocabulary
- **ADVANCED** - Professional topics, advanced grammar

---

## Quick Login URLs

- **Development:** http://localhost:3001/login
- **Production:** (Your Hostinger URL)/login

---

## Testing Scenarios

### Test Different Levels
1. Login as `beginner@test.com` (Test1234)
2. Try all 4 learning modes
3. Logout and login as `intermediate@test.com` (Test1234)
4. Notice the difference in AI responses

### Test Features
- ✅ Voice input and recognition
- ✅ Grammar corrections
- ✅ Pronunciation scoring
- ✅ Vocabulary tracking
- ✅ Progress dashboard
- ✅ Session history

### Test Authentication
- ✅ Signup flow
- ✅ Login flow
- ✅ Logout
- ✅ Protected routes
- ✅ Remember me checkbox

---

## Database Management

**View all users:**
```bash
npx tsx scripts/check-db.js User
```

**View sessions:**
```bash
npx tsx scripts/check-db.js Session
```

**Create more test users:**
```bash
npx tsx scripts/create-test-users.js
```

---

## Security Notes

⚠️ **Important:**
- These are TEST credentials only
- Do NOT use these in production
- Change or remove test accounts before deploying
- Each account has a unique phone number and email

---

## Need More Test Users?

Edit `scripts/create-test-users.js` and add more users to the `TEST_USERS` array, then run:

```bash
npx tsx scripts/create-test-users.js
```

---

**Last Updated:** February 17, 2026
**Total Test Accounts:** 3 + 1 real account = 4 users
