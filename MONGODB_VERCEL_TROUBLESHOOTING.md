# MongoDB Connection Issues on Vercel - Troubleshooting Guide

## Common Issues and Solutions

### 1. **Environment Variable Not Set**

**Symptom:** `MongoDB connection error: connect ECONNREFUSED` or `MongoDB_URI is undefined`

**Solution:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add `MONGODB_URI` with your MongoDB Atlas connection string
4. Make sure it's set for **Production**, **Preview**, and **Development** environments
5. **Redeploy** your project after adding the variable

**Format:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vocalent?retryWrites=true&w=majority
```

### 2. **MongoDB Atlas IP Whitelist**

**Symptom:** `MongoDB connection error: IP not whitelisted` or timeout errors

**Solution:**
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Click **Allow Access from Anywhere** (for development)
   - Or add `0.0.0.0/0` to allow all IPs
   - For production, you can restrict to Vercel's IP ranges (but allowing all is easier)
5. Wait 1-2 minutes for changes to propagate

### 3. **Connection String Format Issues**

**Symptom:** Authentication errors or connection timeouts

**Common Issues:**
- **Password with special characters**: URL-encode special characters in your password
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `%` becomes `%25`
  - etc.
- **Missing database name**: Add `/vocalent` before the `?` in the connection string
- **Wrong username/password**: Double-check your Atlas database user credentials

**Correct Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/vocalent?retryWrites=true&w=majority
```

### 4. **Serverless Cold Start Timeout**

**Symptom:** First request fails, subsequent requests work

**Solution:**
The code has been updated with:
- Faster connection timeouts (5s instead of 30s)
- Connection pooling
- Connection state checking
- Automatic reconnection

If you still experience this, consider:
- Using MongoDB Atlas connection string (faster than local)
- Keeping a minimum of 1 connection pool (already configured)

### 5. **Environment Variable Not Loading**

**Symptom:** `MONGODB_URI` is `undefined` or using default localhost value

**Solution:**
1. **Check variable name**: Must be exactly `MONGODB_URI` (case-sensitive)
2. **Check environment scope**: Set for all environments (Production, Preview, Development)
3. **Redeploy**: Vercel requires a redeploy after adding environment variables
4. **Check logs**: Go to Vercel dashboard → Functions → View logs to see actual values

### 6. **Connection String in Wrong Location**

**Symptom:** Works locally but not on Vercel

**Important:** 
- **Local**: `.env` file in `server/` folder
- **Vercel**: Environment variables in Vercel dashboard (NOT in `.env` file - it's not deployed)

**Solution:**
- Set `MONGODB_URI` in Vercel dashboard, not in `.env` file
- `.env` files are typically in `.gitignore` and won't be deployed

## Debugging Steps

### Step 1: Check Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `MONGODB_URI` is set
3. Check the value (it will be masked, but verify it's not empty)

### Step 2: Test Health Endpoint

Visit: `https://your-project.vercel.app/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Vocalent API is running",
  "database": "connected",
  "readyState": 1
}
```

**If database is "disconnected":**
- Check MongoDB Atlas connection string
- Check IP whitelist
- Check Vercel environment variables

### Step 3: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on a function execution
3. View logs for MongoDB connection messages:
   - `🔄 Connecting to MongoDB...`
   - `✅ Connected to MongoDB`
   - `❌ MongoDB connection error: ...`

### Step 4: Verify MongoDB Atlas Setup

1. **Cluster Status**: Make sure cluster is running (green status)
2. **Database User**: Verify user exists and password is correct
3. **Network Access**: Check IP whitelist includes `0.0.0.0/0` or your IP
4. **Connection String**: Get fresh connection string from Atlas

### Step 5: Test Connection String Locally

1. Copy your `MONGODB_URI` from Vercel
2. Test it locally in your `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vocalent?retryWrites=true&w=majority
   ```
3. Run `cd server && npm run dev`
4. If it works locally but not on Vercel, it's likely an environment variable issue

## Quick Checklist

- [ ] `MONGODB_URI` is set in Vercel environment variables
- [ ] Environment variable is set for all environments (Production, Preview, Development)
- [ ] MongoDB Atlas cluster is running
- [ ] Database user exists in MongoDB Atlas
- [ ] IP address is whitelisted in MongoDB Atlas (0.0.0.0/0 for all)
- [ ] Connection string format is correct
- [ ] Password is URL-encoded if it has special characters
- [ ] Database name (`/vocalent`) is included in connection string
- [ ] Project has been redeployed after adding environment variables
- [ ] Health endpoint shows database as "connected"

## Still Having Issues?

1. **Check Vercel Function Logs**: Look for specific error messages
2. **Test Connection String**: Use MongoDB Compass or `mongosh` to test the connection string directly
3. **Verify Atlas Status**: Check MongoDB Atlas dashboard for any service issues
4. **Check Vercel Status**: Visit [Vercel Status Page](https://www.vercel-status.com/)

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Can't reach MongoDB | Check IP whitelist, verify connection string |
| `Authentication failed` | Wrong username/password | Verify database user credentials |
| `IP not whitelisted` | IP not in Atlas whitelist | Add IP to Network Access in Atlas |
| `MONGODB_URI is undefined` | Environment variable not set | Set in Vercel dashboard and redeploy |
| `Connection timeout` | Network/firewall issue | Check Atlas network settings, verify connection string |
| `Database name not specified` | Missing `/vocalent` in URI | Add database name to connection string |

---

**Need more help?** Check the Vercel logs or MongoDB Atlas logs for detailed error messages.

