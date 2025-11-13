import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Extract text from image using OCR
async function extractTextFromImage(imagePath) {
  console.log('🔍 Running OCR on image...');
  try {
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    console.log(`✅ OCR extracted ${text.length} characters`);
    return text;
  } catch (error) {
    console.error('❌ OCR error:', error.message);
    throw error;
  }
}

// Convert PDF to image using pdftoppm (Poppler)
async function convertPDFToImage(pdfPath, outputPath) {
  const outputBase = path.join(path.dirname(pdfPath), `ocr_${Date.now()}`);
  
  try {
    // Check if pdftoppm is available
    await execAsync('pdftoppm -v');
  } catch (error) {
    throw new Error('Poppler (pdftoppm) is not installed. See server/OCR_SETUP.md for installation instructions.');
  }
  
  try {
    // Convert first page of PDF to PNG with high quality
    const command = `pdftoppm -png -f 1 -l 1 -r 300 "${pdfPath}" "${outputBase}"`;
    await execAsync(command);
    
    // pdftoppm creates files like: outputBase-1.png
    const imagePath = `${outputBase}-1.png`;
    
    // Check if file was created
    try {
      await fs.access(imagePath);
      return imagePath;
    } catch {
      throw new Error('PDF to image conversion failed - output file not found');
    }
  } catch (error) {
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  }
}

// Extract text from PDF with OCR fallback
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    console.log(`📄 PDF file size: ${dataBuffer.length} bytes`);
    
    // Try standard PDF text extraction first
    let data;
    try {
      data = await pdfParse(dataBuffer);
    } catch (parseError) {
      console.error('❌ pdf-parse error:', parseError.message);
      throw new Error(`PDF parsing failed: ${parseError.message}`);
    }
    
    console.log(`📝 Extracted text length: ${data.text.length} characters`);
    console.log(`📄 PDF pages: ${data.numpages}`);
    console.log(`📝 First 500 chars:`, data.text.substring(0, 500));
    
    // If we got meaningful text, return it
    if (data.text && data.text.trim().length > 50) {
      console.log('✅ PDF text extraction successful');
      return data.text;
    }
    
    // If text is empty or too short, try OCR
    console.log('⚠️ PDF text extraction returned minimal text. Attempting OCR...');
    
    try {
      // Convert PDF to image using pdftoppm
      console.log('📸 Converting PDF to image for OCR...');
      const imagePath = await convertPDFToImage(filePath);
      
      console.log(`✅ PDF converted to image: ${imagePath}`);
      
      // Run OCR on the image
      const ocrText = await extractTextFromImage(imagePath);
      
      // Clean up the temporary image
      try {
        await fs.unlink(imagePath);
        console.log('🗑️ Cleaned up temporary image');
      } catch (cleanupError) {
        console.warn('⚠️ Could not delete temporary image:', cleanupError.message);
      }
      
      if (ocrText && ocrText.trim().length > 0) {
        console.log('✅ OCR successful! Extracted text from image-based PDF');
        return ocrText;
      }
      
      throw new Error('OCR returned empty text');
      
    } catch (ocrError) {
      console.error('❌ OCR fallback failed:', ocrError.message);
      
      // Check if it's a Poppler installation issue
      if (ocrError.message.includes('pdftoppm') || ocrError.message.includes('Poppler')) {
        throw new Error('OCR requires Poppler to be installed. See server/OCR_SETUP.md for installation instructions. For now, please enter details manually.');
      }
      
      throw new Error('PDF appears to be image-based and OCR failed. Please try a text-based PDF or enter details manually.');
    }
    
  } catch (error) {
    console.error('❌ PDF extraction error:', error.message);
    throw error;
  }
}

// Extract text from DOCX
async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// Simple CV parser (you can enhance this with AI)
function parseCVText(text) {
  console.log(`🔍 Parsing CV text (${text.length} characters)`);
  
  if (!text || text.trim().length === 0) {
    console.warn('⚠️ Empty text provided to parser');
    return {
      name: '',
      email: '',
      phone: '',
      role: '',
    };
  }
  
  // Enhanced email regex
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/gi;
  // Enhanced phone regex (supports more formats)
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  
  console.log(`📧 Found ${emails.length} email(s):`, emails);
  console.log(`📞 Found ${phones.length} phone(s):`, phones);
  
  // Try to extract name (first non-empty line, cleaned)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let name = '';
  
  // Look for name in first few lines (skip common headers)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip lines that look like headers or labels
    if (line.length > 2 && line.length < 50 && 
        !line.toLowerCase().includes('resume') && 
        !line.toLowerCase().includes('curriculum') &&
        !line.toLowerCase().includes('cv') &&
        !line.includes('@')) {
      name = line;
      break;
    }
  }
  
  console.log(`👤 Extracted name: "${name}"`);
  
  // Try to extract role (look for common job titles and patterns)
  const roleKeywords = [
    'developer', 'engineer', 'manager', 'designer', 'analyst', 'specialist',
    'architect', 'consultant', 'director', 'lead', 'senior', 'junior',
    'programmer', 'administrator', 'coordinator', 'executive', 'officer',
    'scientist', 'researcher', 'technician', 'assistant', 'student'
  ];
  
  let role = '';
  let fullRole = '';
  let roleStartIndex = -1;
  
  // Find the line with role keywords
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const lowerLine = lines[i].toLowerCase();
    for (const keyword of roleKeywords) {
      if (lowerLine.includes(keyword)) {
        roleStartIndex = i;
        break;
      }
    }
    if (roleStartIndex >= 0) break;
  }
  
  if (roleStartIndex >= 0) {
    // Collect the full role description (current line + next lines until we hit a clear break)
    const roleLines = [];
    let foundEnd = false;
    
    for (let i = roleStartIndex; i < Math.min(roleStartIndex + 10, lines.length); i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Stop conditions: contact info or major section headers
      if (line.includes('@') || 
          (line.includes('+') && line.length < 20) || // Phone numbers are usually short
          lowerLine.startsWith('experience') ||
          lowerLine.startsWith('education') ||
          lowerLine.startsWith('skills') ||
          lowerLine.startsWith('projects') ||
          lowerLine.startsWith('work') ||
          lowerLine.startsWith('professional')) {
        foundEnd = true;
        break;
      }
      
      // Add the line if it has content
      if (line.length > 0) {
        roleLines.push(line);
      }
      
      // If we have collected some lines and hit an empty line or very short line, might be end of paragraph
      if (roleLines.length > 2 && line.length < 5) {
        foundEnd = true;
        break;
      }
    }
    
    // Join all role lines into full description, clean up extra spaces
    fullRole = roleLines.join(' ').replace(/\s+/g, ' ').trim();
    
    // Extract short version (just the first part, before "with", "at", etc.)
    const stopWords = [' with ', ' at ', ' in ', ' for ', ' who ', ' that ', ' and ', ' complemented'];
    let shortRole = fullRole;
    
    for (const stopWord of stopWords) {
      const index = shortRole.toLowerCase().indexOf(stopWord);
      if (index > 0) {
        shortRole = shortRole.substring(0, index).trim();
        break;
      }
    }
    
    role = shortRole;
  }
  
  console.log(`💼 Extracted role (short): "${role}"`);
  console.log(`💼 Extracted role (full): "${fullRole}"`);
  
  const result = {
    name: name.substring(0, 100),
    email: emails[0] || '',
    phone: phones[0] || '',
    role: role || '',
    fullRole: fullRole || role || '', // Include full role for expand feature
  };
  
  console.log('✅ Parsing result:', result);
  
  return result;
}

// Upload CV and extract data
router.post('/upload-cv', authenticate, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`\n📤 CV Upload started`);
    console.log(`📁 File: ${req.file.originalname}`);
    console.log(`📏 Size: ${req.file.size} bytes`);

    let text = '';
    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    try {
      if (fileExtension === 'pdf') {
        console.log('📄 Processing PDF file...');
        text = await extractTextFromPDF(filePath);
      } else if (['doc', 'docx'].includes(fileExtension)) {
        console.log('📄 Processing DOCX file...');
        text = await extractTextFromDOCX(filePath);
      } else {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Unsupported file format. Please upload PDF, DOC, or DOCX.' });
      }

      const extractedData = parseCVText(text);

      // Check if we got meaningful data
      const hasData = extractedData.name || extractedData.email || extractedData.phone;
      
      // Clean up uploaded file
      await fs.unlink(filePath);

      if (!hasData) {
        console.warn('⚠️ No data extracted from CV - may be image-based or poorly formatted');
        console.log('❌ CV processing failed - no data extracted\n');
        return res.status(400).json({ 
          error: 'Could not extract data automatically. Please enter details manually.',
          details: 'The PDF may be image-based, scanned, or have unusual formatting. OCR support requires Poppler installation.'
        });
      }

      console.log('✅ CV processing complete\n');

      res.json({
        success: true,
        data: extractedData,
      });
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(filePath);
      } catch {}
      
      console.error('❌ CV extraction error:', error.message);
      console.error('   Stack:', error.stack);
      
      return res.status(500).json({ 
        error: 'Could not extract data automatically. Please enter details manually.',
        details: error.message,
        suggestion: 'The PDF may be image-based or have encoding issues. Try entering the details manually.'
      });
    }
  } catch (error) {
    console.error('❌ CV upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed. Please try again.',
      details: error.message
    });
  }
});

// Create candidate
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, role, fullRole, email, phone, cvUrl, extractedData } = req.body;

    const candidate = new Candidate({
      recruiterId: req.userId,
      name,
      role,
      fullRole: fullRole || role, // Store full role, fallback to role if not provided
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

