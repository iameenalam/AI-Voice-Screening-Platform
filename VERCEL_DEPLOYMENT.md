# Vercel Deployment Guide for Vocalent

This guide will walk you through deploying your Vocalent MVP to Vercel.

## 📋 Prerequisites

1. **MongoDB Atlas Account** (required for production)
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Create a free cluster
   - Get your connection string

2. **Vercel Account**
   - Sign up at [Vercel](https://vercel.com/signup) (free tier available)

3. **GitHub Account** (recommended)
   - Push your code to GitHub for easy deployment

## 🚀 Deployment Steps

### Step 1: Prepare Your Code

1. **Ensure all dependencies are installed:**
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

2. **Test your build locally:**
   ```bash
   npm run build
   ```
   This should create a `dist` folder with your frontend build.

### Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (free tier M0 is fine)
3. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Save the username and password
4. Whitelist IP addresses:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add specific IPs for production
5. Get your connection string:
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Add database name: `mongodb+srv://username:password@cluster.mongodb.net/vocalent?retryWrites=true&w=majority`

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import project on Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect the project settings

3. **Configure environment variables:**
   In the Vercel project settings, add these environment variables:
   
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vocalent?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   VITE_API_URL=https://your-project.vercel.app/api
   OPENAI_API_KEY=your-openai-api-key-here (optional)
   NODE_ENV=production
   ```

   **Important:** 
   - Replace `your-project.vercel.app` with your actual Vercel deployment URL
   - Use a strong, random string for `JWT_SECRET`
   - The `VITE_API_URL` will be set automatically after first deployment

4. **Configure build settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts to configure your project.

4. **Set environment variables:**
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add VITE_API_URL
   vercel env add OPENAI_API_KEY
   ```

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Step 4: Update Environment Variables After First Deployment

After your first deployment, you'll get a URL like `https://your-project.vercel.app`.

1. Go to your Vercel project settings
2. Update `VITE_API_URL` to: `https://your-project.vercel.app/api`
3. Redeploy your project (or it will auto-redeploy if connected to GitHub)

## 🔧 Configuration Files

The following files have been created/updated for Vercel deployment:

- **`vercel.json`** - Vercel configuration for routing
- **`api/index.js`** - Serverless function wrapper for Express API
- **`server/index.js`** - Updated to work with Vercel serverless functions
- **`server/routes/candidates.js`** - Updated file uploads to use `/tmp` directory

## 📝 Important Notes

### File Uploads
- File uploads are stored in `/tmp` directory on Vercel (temporary storage)
- Files are automatically cleaned up after the function execution
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.) for persistent file storage

### MongoDB Connection
- **MUST use MongoDB Atlas** for production (local MongoDB won't work on Vercel)
- Connection pooling is handled automatically
- The connection is reused across function invocations

### API Routes
- All API routes are prefixed with `/api`
- Frontend should use `VITE_API_URL` environment variable
- In production, this will be `https://your-project.vercel.app/api`

### CORS
- CORS is configured to allow requests from your Vercel domain
- Update CORS settings in `server/index.js` if needed

## 🧪 Testing Your Deployment

1. **Check health endpoint:**
   ```
   https://your-project.vercel.app/api/health
   ```
   Should return: `{"status":"ok","message":"Vocalent API is running","database":"connected"}`

2. **Test frontend:**
   - Visit your Vercel URL
   - Try signing up/logging in
   - Test CV upload functionality

3. **Check Vercel logs:**
   - Go to your project dashboard
   - Click on "Functions" tab
   - View logs for any errors

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found"
- Make sure all dependencies are in `package.json`
- Check that `node_modules` is in `.gitignore`

**Error:** "Build command failed"
- Check build logs in Vercel dashboard
- Test build locally: `npm run build`

### API Routes Not Working

**Error:** "404 Not Found"
- Check `vercel.json` routing configuration
- Ensure `api/index.js` exists and exports the Express app
- Verify routes are prefixed with `/api`

### Database Connection Issues

**Error:** "MongoDB connection error"
- Verify `MONGODB_URI` is set correctly in Vercel environment variables
- Check MongoDB Atlas network access (IP whitelist)
- Ensure database user credentials are correct
- Check connection string format

### File Upload Issues

**Error:** "Upload failed"
- File uploads use `/tmp` directory (temporary)
- Large files may timeout (Vercel has 10s timeout on free tier)
- Consider using cloud storage for production

### Environment Variables Not Working

**Frontend:** `VITE_API_URL` not updating
- Vercel needs to rebuild after env var changes
- Trigger a new deployment
- Check that variable name starts with `VITE_` for Vite apps

**Backend:** Environment variables not loading
- Ensure variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding new variables

## 🔄 Continuous Deployment

If you connected your GitHub repository:

1. **Automatic deployments:**
   - Every push to `main` branch triggers production deployment
   - Pull requests get preview deployments

2. **Manual deployments:**
   - Go to Vercel dashboard
   - Click "Deployments" → "Redeploy"

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP addresses whitelisted
- [ ] Connection string obtained
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Build settings configured
- [ ] First deployment successful
- [ ] Health endpoint working
- [ ] Frontend accessible
- [ ] API routes working
- [ ] Database connection verified
- [ ] Authentication tested
- [ ] File upload tested (if applicable)

---

**Need help?** Check the Vercel logs or open an issue on GitHub.

