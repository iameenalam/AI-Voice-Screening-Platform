# MongoDB Setup Guide - Quick Start

## 🚀 Fastest Way: MongoDB Atlas (5 minutes)

### Step 1: Create MongoDB Atlas Account
1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with your email (free account)

### Step 2: Create a Free Cluster
1. Click **"Build a Database"**
2. Select **FREE (M0)** tier
3. Choose any cloud provider (AWS, Google Cloud, or Azure)
4. Select a region closest to you
5. Click **"Create"** (takes 1-3 minutes)

### Step 3: Create Database User
1. Go to **"Database Access"** in the left menu
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter:
   - **Username**: `vocalent` (or any name you like)
   - **Password**: Create a strong password (save it!)
5. Set privileges to **"Atlas admin"**
6. Click **"Add User"**

### Step 4: Whitelist Your IP
1. Go to **"Network Access"** in the left menu
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - Or click **"Add Current IP Address"** for better security
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** in the left menu
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
   - It looks like: `mongodb+srv://vocalent:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Step 6: Update .env File
1. Open `server/.env` file
2. Replace the `MONGODB_URI` line with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://vocalent:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vocalent?retryWrites=true&w=majority
   ```
   **Important**: 
   - Replace `YOUR_PASSWORD` with the password you created in Step 3
   - Replace `cluster0.xxxxx.mongodb.net` with your actual cluster URL
   - Add `/vocalent` before the `?` to specify the database name

### Step 7: Restart Server
1. Stop your server (Ctrl+C)
2. Restart it:
   ```bash
   cd server
   npm run dev
   ```

You should now see: **✅ Connected to MongoDB**

---

## 🖥️ Alternative: Local MongoDB

### Windows:
1. **Download MongoDB**: https://www.mongodb.com/try/download/community
2. **Install** MongoDB Community Server
3. **Start MongoDB**:
   - Usually starts automatically as a Windows service
   - Or run: `net start MongoDB` (in admin PowerShell)
   - Or check Services (services.msc) for "MongoDB" service

### Mac:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux:
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

Then your `.env` file should have:
```env
MONGODB_URI=mongodb://localhost:27017/vocalent
```

---

## ✅ Verify Connection

After setting up, restart your server and you should see:
```
✅ Connected to MongoDB
   Database: mongodb+srv://***@cluster.mongodb.net/vocalent
🚀 Server running on port 3000
```

If you still see an error, check:
- ✅ `.env` file is in the `server` directory
- ✅ Connection string is correct (no extra spaces)
- ✅ Password is correct (no special characters need URL encoding)
- ✅ IP address is whitelisted (for Atlas)
- ✅ MongoDB service is running (for local)

---

## 🆘 Troubleshooting

**"Authentication failed"**
- Check your username and password in the connection string
- Make sure you created a database user in Atlas

**"IP not whitelisted"**
- Go to Network Access in Atlas
- Add your current IP or allow 0.0.0.0/0

**"Connection timeout"**
- Check your internet connection
- Verify the cluster is fully created (green status in Atlas)
- Try the connection string again from Atlas

**Local MongoDB won't start**
- Check if MongoDB service is running
- Check MongoDB logs for errors
- Make sure port 27017 is not blocked by firewall

