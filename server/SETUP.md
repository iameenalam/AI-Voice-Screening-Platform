# Server Setup Guide

## MongoDB Setup

You have two options for MongoDB:

### Option 1: Local MongoDB

1. **Install MongoDB**:
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Mac: `brew install mongodb-community`
   - Linux: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB**:
   - Windows: MongoDB usually runs as a service automatically
   - Mac/Linux: `mongod` (or `brew services start mongodb-community` on Mac)

3. **Verify MongoDB is running**:
   ```bash
   mongosh
   # or
   mongo
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Development)

1. **Create a free account** at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a cluster** (free tier available)

3. **Get connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

4. **Update .env file**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vocalent?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your Atlas credentials.

## Environment Variables

Create a `.env` file in the `server` directory:

```env
# MongoDB Connection
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/vocalent

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vocalent?retryWrites=true&w=majority

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API Key (optional - app will work with fallbacks if not provided)
OPENAI_API_KEY=your-openai-api-key-here

# Server Port
PORT=3000
```

## Quick Start

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Set up MongoDB** (choose one):
   - Start local MongoDB: `mongod`
   - Or configure MongoDB Atlas connection string in `.env`

3. **Create .env file** with your configuration

4. **Start the server**:
   ```bash
   npm run dev
   ```

## Troubleshooting

### MongoDB Connection Refused

**Error**: `ECONNREFUSED 127.0.0.1:27017`

**Solutions**:
1. Make sure MongoDB is installed and running
2. Check if MongoDB service is running:
   - Windows: Check Services (services.msc) for "MongoDB"
   - Mac: `brew services list`
   - Linux: `sudo systemctl status mongod`
3. Try starting MongoDB manually:
   - Windows: `net start MongoDB`
   - Mac/Linux: `mongod`

### Using MongoDB Atlas Instead

If you don't want to install MongoDB locally, use MongoDB Atlas (free tier available):

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

### Server Starts But Can't Connect to Database

The server will start even if MongoDB isn't connected, but database features won't work. Make sure:
- MongoDB is running (if using local)
- Connection string in `.env` is correct
- Network/firewall allows connection (for Atlas)

