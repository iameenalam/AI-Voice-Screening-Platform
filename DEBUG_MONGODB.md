# Quick MongoDB Connection Debug Guide

## Your Current Status
✅ API is running  
❌ Database is disconnected

## Step-by-Step Fix

### Step 1: Verify Environment Variable in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Check if `MONGODB_URI` exists
3. **IMPORTANT**: Make sure it's set for **ALL environments**:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

### Step 2: Check Your MongoDB Atlas Connection String

Your connection string should look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vocalent?retryWrites=true&w=majority
```

**Key points:**
- Must start with `mongodb+srv://`
- Include username and password
- Include cluster URL (e.g., `cluster0.xxxxx.mongodb.net`)
- Include database name: `/vocalent` (before the `?`)
- Include query parameters: `?retryWrites=true&w=majority`

### Step 3: Verify MongoDB Atlas Settings

1. **Network Access (IP Whitelist)**
   - Go to MongoDB Atlas → **Network Access**
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   - Wait 1-2 minutes for changes to apply

2. **Database User**
   - Go to **Database Access**
   - Verify your user exists
   - Make sure password is correct
   - User should have **Atlas admin** or **Read and write** permissions

3. **Cluster Status**
   - Make sure cluster is **running** (green status)
   - Not paused or stopped

### Step 4: Get Fresh Connection String

1. Go to MongoDB Atlas → **Database** → Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Add `/vocalent` before the `?` to specify database name

**Example:**
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/vocalent?retryWrites=true&w=majority
```

### Step 5: Update Vercel Environment Variable

1. In Vercel Dashboard → **Settings** → **Environment Variables**
2. If `MONGODB_URI` exists, **edit** it
3. If it doesn't exist, **add** it
4. Paste your complete connection string
5. **Save**

### Step 6: Redeploy

**CRITICAL**: After adding/updating environment variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger redeploy

### Step 7: Test Again

Visit: `https://your-project.vercel.app/api/health`

**Expected:**
```json
{
  "status": "ok",
  "message": "Vocalent API is running",
  "database": "connected",
  "readyState": 1
}
```

## Common Mistakes

❌ **Mistake 1**: Setting env var but not redeploying
- **Fix**: Always redeploy after adding/updating env vars

❌ **Mistake 2**: Connection string missing database name
- **Wrong**: `mongodb+srv://...@cluster.net?retryWrites=true&w=majority`
- **Right**: `mongodb+srv://...@cluster.net/vocalent?retryWrites=true&w=majority`

❌ **Mistake 3**: Password with special characters not URL-encoded
- **Fix**: Encode special chars (`@` → `%40`, `#` → `%23`, etc.)

❌ **Mistake 4**: IP not whitelisted in Atlas
- **Fix**: Add `0.0.0.0/0` to Network Access

❌ **Mistake 5**: Environment variable only set for Production
- **Fix**: Set for Production, Preview, AND Development

## Check Vercel Logs

1. Go to Vercel Dashboard → **Functions** tab
2. Click on a recent function execution
3. Look for MongoDB connection messages:
   - `🔄 Connecting to MongoDB...` - Trying to connect
   - `✅ Connected to MongoDB` - Success!
   - `❌ MongoDB connection error: ...` - Error details

The error message will tell you exactly what's wrong!

## Still Not Working?

Share the error message from Vercel logs, and I can help you fix it!

