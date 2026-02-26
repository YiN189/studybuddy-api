# MongoDB connection for studybuddy-api

The API uses **MongoDB** for users, courses, enrollments, progress, Q&A, and reports.  
The connection setup matches **hello-api-demo**: TLS and timeouts for MongoDB Atlas (cloud).

## Using MongoDB Atlas (cloud)

### 1. Get your connection string

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign in (or create a free account).
2. Create or select a **project** → create or select a **cluster** (e.g. M0 free tier).
3. **Database Access** → Add a database user (username + password). Remember the password.
4. **Network Access** → Add IP address:
   - For development: click **“Add IP Address”** → **“Allow Access from Anywhere”** (`0.0.0.0/0`).  
   - For production, add only your server IPs.
5. **Database** → click **“Connect”** on your cluster → **“Connect your application”** → copy the connection string.  
   It looks like:
   ```text
   mongodb+srv://USERNAME:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your **actual database user password**.  
   If the password contains special characters (e.g. `#`, `@`, `%`), [URL-encode](https://www.w3schools.com/tags/ref_urlencode.asp) them (e.g. `#` → `%23`).

### 2. Configure the API

In the **studybuddy-api** folder:

```bash
cp .env.example .env.local
```

Edit **`.env.local`** and set your Atlas URI:

```env
# MongoDB Atlas (cloud) — replace with your connection string
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Database name (optional, default: studybuddy)
MONGODB_DB=studybuddy

# Frontend URL for CORS (optional)
FRONTEND_URL=http://localhost:5173
```

Save the file (no quotes around the URI).

### 3. Check connection

```bash
npm run dev
```

In another terminal:

```bash
curl http://localhost:3000/api/health
```

You should see:

```json
{ "ok": true, "mongodb": "connected", "database": "studybuddy" }
```

If you see `"mongodb": "disconnected"`, check:

- Username and password in the URI (and special characters URL-encoded).
- Network Access in Atlas allows your current IP (or `0.0.0.0/0` for testing).
- The cluster is running (not paused).

### 4. Seed the database

Load demo users, courses, and data:

```bash
npm run seed
```

If that fails (e.g. Node &lt; 20), run:

```bash
MONGODB_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority" node src/scripts/seed.js
```

You should see: **🎉 Seed completed successfully!**

### 5. Demo logins (after seed)

| Role       | Email               | Password      |
|-----------|---------------------|---------------|
| Student   | john@example.com    | student123    |
| Instructor| jinchun@example.com | instructor123 |
| Admin     | admin@example.com   | admin123      |

---

## Local MongoDB (optional)

If you prefer to run MongoDB on your machine:

- Install: [MongoDB Community Server](https://www.mongodb.com/try/download/community) or `brew install mongodb-community`
- Start the service (e.g. `brew services start mongodb-community`)
- In `.env.local` use: `MONGODB_URI=mongodb://localhost:27017`

Then run **Check connection** and **Seed the database** as above.
