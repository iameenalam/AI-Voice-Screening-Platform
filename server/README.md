# Vocalent Backend Server

Express.js backend server for Vocalent AI Voice Screening Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/vocalent
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
PORT=3000
```

3. Create uploads directory:
```bash
mkdir uploads
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Documentation

See main README.md for API endpoint documentation.

