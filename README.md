# Vocalent - AI Voice Screening Platform

Vocalent is an AI-powered voice screening platform that automates first-round interviews for recruiters. It integrates seamlessly with ATS systems and provides real-time insights, sentiment analysis, and comprehensive interview transcripts.

## Features

- 🎤 **AI Voice Interviews** - Conduct natural voice conversations with candidates
- 📄 **CV Upload & Extraction** - Automatically extract candidate information from CVs
- 🤖 **AI-Generated Questions** - Get role-specific interview questions powered by OpenAI
- 📊 **Real-time Analytics** - Sentiment analysis and confidence scoring
- 📝 **Full Transcripts** - Complete interview transcripts with timestamps
- 📥 **Export Reports** - Download reports in PDF, CSV, or JSON formats
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔐 **Secure Authentication** - JWT-based authentication system

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Router
- TanStack Query
- Sonner (toasts)

### Backend
- Node.js with Express
- MongoDB with Mongoose
- OpenAI API (GPT-4)
- JWT authentication
- Multer for file uploads
- pdf-parse & mammoth for CV parsing

## Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB (local or MongoDB Atlas)
- OpenAI API key

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Vocalent-MVP
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/vocalent

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Server Port
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080
```

Create a `.env` file in the `server` directory with the same variables, or use the root `.env` file.

### 5. Create Uploads Directory

```bash
mkdir -p server/uploads
```

## Running the Application

### Development Mode

1. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

2. **Start the Backend Server**:
   ```bash
   cd server
   npm run dev
   ```
   The backend will run on `http://localhost:3000`

3. **Start the Frontend** (in a new terminal):
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:8080`

### Production Mode

1. **Build the Frontend**:
   ```bash
   npm run build
   ```

2. **Start the Backend**:
   ```bash
   cd server
   npm start
   ```

## Project Structure

```
Vocalent-MVP/
├── server/                 # Backend server
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Auth middleware
│   └── index.js          # Server entry point
├── src/                  # Frontend source
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── lib/              # Utilities and API client
│   └── ...
├── public/               # Static assets
└── package.json          # Frontend dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user

### Candidates
- `POST /api/candidates/upload-cv` - Upload and extract CV
- `POST /api/candidates` - Create candidate
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get single candidate

### Interviews
- `POST /api/interviews/generate-questions` - Generate AI questions
- `POST /api/interviews` - Create interview
- `POST /api/interviews/:id/start` - Start interview
- `POST /api/interviews/:id/transcript` - Add transcript entry
- `POST /api/interviews/:id/analyze` - Analyze response
- `POST /api/interviews/:id/complete` - Complete interview
- `GET /api/interviews/:id` - Get interview
- `GET /api/interviews` - Get all interviews

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Usage Flow

1. **Sign Up / Login** - Create an account or sign in
2. **Upload CV** - Upload candidate CV or enter details manually
3. **Setup Questions** - Use AI-generated questions or create custom ones
4. **Mic Test** - Test microphone before starting interview
5. **Conduct Interview** - AI asks questions, candidate responds via voice
6. **View Results** - See AI summary, sentiment analysis, and transcript
7. **Download Report** - Export interview report in preferred format

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `PORT` | Backend server port | No (default: 3000) |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### OpenAI API Errors
- Verify your API key is correct
- Check your OpenAI account has sufficient credits
- Ensure the API key has access to GPT-4

### File Upload Issues
- Ensure the `server/uploads` directory exists
- Check file size limits (default: 10MB)
- Verify file format (PDF, DOC, DOCX)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions, please open an issue on the repository.

