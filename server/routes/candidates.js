import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Extract text from PDF
async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// Extract text from DOCX
async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// Simple CV parser (you can enhance this with AI)
function parseCVText(text) {
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  
  // Try to extract name (first line or before email)
  const lines = text.split('\n').filter(line => line.trim());
  let name = lines[0] || '';
  
  // Try to extract role (look for common job titles)
  const roleKeywords = ['developer', 'engineer', 'manager', 'designer', 'analyst', 'specialist'];
  let role = '';
  for (const line of lines.slice(0, 10)) {
    for (const keyword of roleKeywords) {
      if (line.toLowerCase().includes(keyword)) {
        role = line.trim();
        break;
      }
    }
    if (role) break;
  }

  return {
    name: name.substring(0, 100),
    email: emails[0] || '',
    phone: phones[0] || '',
    role: role || 'Not specified',
  };
}

// Upload CV and extract data
router.post('/upload-cv', authenticate, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let text = '';
    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    try {
      if (fileExtension === 'pdf') {
        text = await extractTextFromPDF(filePath);
      } else if (['doc', 'docx'].includes(fileExtension)) {
        text = await extractTextFromDOCX(filePath);
      } else {
        return res.status(400).json({ error: 'Unsupported file format' });
      }

      const extractedData = parseCVText(text);

      // Clean up uploaded file
      await fs.unlink(filePath);

      res.json({
        success: true,
        data: extractedData,
      });
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(filePath);
      } catch {}
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create candidate
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, role, email, phone, cvUrl, extractedData } = req.body;

    const candidate = new Candidate({
      recruiterId: req.userId,
      name,
      role,
      email,
      phone,
      cvUrl,
      extractedData,
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all candidates for recruiter
router.get('/', authenticate, async (req, res) => {
  try {
    const candidates = await Candidate.find({ recruiterId: req.userId })
      .sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single candidate
router.get('/:id', authenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

