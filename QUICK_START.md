# Quick Start Guide - MongoDB Atlas Setup

## Fastest Way to Get Started (5 minutes)

### 1. Create MongoDB Atlas Account
- Go to: https://www.mongodb.com/cloud/atlas/register
- Sign up for free account

### 2. Create Free Cluster
- Click "Build a Database"
- Select **FREE (M0)** tier
- Choose any cloud provider/region
- Click "Create" (takes 1-3 minutes)

### 3. Create Database User
- Go to "Database Access" → "Add New Database User"
- Username: `vocalent` (or any name)
- Password: Create a strong password (save it!)
- Privileges: "Atlas admin"
- Click "Add User"

### 4. Whitelist IP Address
- Go to "Network Access" → "Add IP Address"
- Click "Allow Access from Anywhere" (0.0.0.0/0) for development
- Or "Add Current IP Address" for security
- Click "Confirm"

### 5. Get Connection String
- Go to "Database" → Click "Connect" on your cluster
- Choose "Connect your application"
- Copy the connection string
- It looks like: `mongodb+srv://username:password@cluster.mongodb.net/`

### 6. Update .env File

Create `server/.env` file:

```env
# Replace with your actual connection string from Atlas
MONGODB_URI=mongodb+srv://vocalent:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vocalent?retryWrites=true&w=majority

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API Key (optional - app works without it)
OPENAI_API_KEY=your-openai-api-key-here

# Server Port
PORT=3000
```

**Important**: Replace:
- `vocalent` with your database username
- `YOUR_PASSWORD` with your database password
- `cluster0.xxxxx.mongodb.net` with your actual cluster URL

### 7. Restart Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd server
npm run dev
```

You should see: `✅ Connected to MongoDB`

## Alternative: Local MongoDB

If you prefer local MongoDB:

1. **Download**: https://www.mongodb.com/try/download/community
2. **Install** MongoDB Community Server
3. **Start MongoDB**:
   - Windows: Usually runs as service automatically
   - Check: Services → MongoDB
   - Or run: `net start MongoDB` (as admin)
4. **Update .env**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/vocalent
   ```

## Verify Connection

After setting up, you should see:
```
✅ Connected to MongoDB
   Database: mongodb+srv://***@cluster.mongodb.net/vocalent
🚀 Server running on port 3000
```

## Troubleshooting

**Still seeing connection error?**
- Check your `.env` file is in the `server` directory
- Verify connection string has correct username/password
- Make sure IP is whitelisted in Atlas
- Check cluster is fully created (green status)

**Need help?** Check `server/SETUP.md` for detailed instructions.

