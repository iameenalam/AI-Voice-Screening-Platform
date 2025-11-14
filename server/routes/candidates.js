import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import { PdfReader } from 'pdfreader';
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

// Use /tmp for Vercel serverless functions, 'uploads/' for local development
const uploadDir = process.env.VERCEL ? '/tmp' : 'uploads/';
const upload = multer({ dest: uploadDir });

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

// Extract text from PDF using pdfreader
async function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Reading PDF file: ${filePath}`);
      
      const reader = new PdfReader();
      let currentPage = 0;
      const pageLines = {}; // Store lines by page, grouped by y-position
      
      reader.parseFileItems(filePath, (err, item) => {
        if (err) {
          console.error('❌ pdfreader error:', err.message);
          reject(new Error(`PDF parsing failed: ${err.message}`));
          return;
        }
        
        if (!item) {
          // End of file - combine all pages
          const allText = Object.keys(pageLines)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(pageNum => {
              // Get all lines for this page, sorted by y-position (top to bottom)
              const lines = pageLines[pageNum] || [];
              // Group by y-position (same y = same line), then sort by y descending
              const lineGroups = {};
              lines.forEach(line => {
                const yKey = Math.round(line.y * 10) / 10; // Round to 1 decimal for grouping
                if (!lineGroups[yKey]) {
                  lineGroups[yKey] = [];
                }
                lineGroups[yKey].push(line.text);
              });
              
              // Sort by y descending (top first) and join text on same line
              return Object.keys(lineGroups)
                .sort((a, b) => parseFloat(b) - parseFloat(a))
                .map(yKey => lineGroups[yKey].join(' '))
                .join('\n');
            })
            .join('\n\n');
          
          const finalText = allText.trim();
          console.log(`📝 Extracted text length: ${finalText.length} characters`);
          console.log(`📄 PDF pages processed: ${Object.keys(pageLines).length}`);
          console.log(`📝 First 500 chars:`, finalText.substring(0, 500));
          
          if (finalText && finalText.length > 50) {
            console.log('✅ PDF text extraction successful');
            resolve(finalText);
          } else {
            console.log('⚠️ PDF text extraction returned minimal text. Attempting OCR...');
            // Try OCR fallback
            extractTextFromPDFWithOCR(filePath)
              .then(resolve)
              .catch(reject);
          }
          return;
        }
        
        // Track page numbers
        if (item.page !== undefined) {
          currentPage = item.page;
          if (!pageLines[currentPage]) {
            pageLines[currentPage] = [];
          }
        }
        
        // Extract text items with their positions
        if (item.text) {
          if (!pageLines[currentPage]) {
            pageLines[currentPage] = [];
          }
          
          // Store text with y-position for proper ordering
          // pdfreader provides x, y, w, h for positioning
          const y = item.y !== undefined ? item.y : 0;
          pageLines[currentPage].push({
            text: item.text,
            y: y
          });
        }
      });
    } catch (error) {
      console.error('❌ PDF extraction error:', error.message);
      reject(error);
    }
  });
}

// OCR fallback for image-based PDFs
async function extractTextFromPDFWithOCR(filePath) {
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
}

// Extract text from DOCX
async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// Normalize text - remove excessive spaces between characters
function normalizeText(text) {
  if (!text) return '';
  
  // Strategy: Split by lines, then process each line
  const lines = text.split('\n');
  const normalizedLines = lines.map(line => {
    // If line has many single characters separated by spaces, it's likely spaced text
    const words = line.split(/\s+/);
    
    // Check if this looks like spaced characters (many single-char "words")
    const singleCharCount = words.filter(w => w.length === 1 && /[A-Za-z0-9]/.test(w)).length;
    const totalWords = words.filter(w => w.length > 0).length;
    
    if (totalWords > 0 && singleCharCount / totalWords > 0.5) {
      // This line has spaced characters - join them
      return words.join('').replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between word boundaries
    } else {
      // Normal line - just normalize spaces
      return words.join(' ');
    }
  });
  
  let normalized = normalizedLines.join('\n')
    // Fix email patterns that might have been spaced
    .replace(/(\w)\s+@\s+(\w)/g, '$1@$2')
    .replace(/(\w)\s+\.\s+(\w)/g, '$1.$2')
    // Fix phone patterns - remove spaces in phone numbers
    .replace(/(\+?\d)\s+(\d)/g, '$1$2')
    .replace(/(\d)\s+(\d)/g, '$1$2')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
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
  
  // Normalize the text first to fix spacing issues
  const normalizedText = normalizeText(text);
  console.log(`📝 Normalized text length: ${normalizedText.length} characters`);
  console.log(`📝 First 500 chars of normalized:`, normalizedText.substring(0, 500));
  
  // Enhanced email regex
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/gi;
  // Enhanced phone regex (supports more formats)
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
  
  const emails = normalizedText.match(emailRegex) || [];
  const phones = normalizedText.match(phoneRegex) || [];
  
  console.log(`📧 Found ${emails.length} email(s):`, emails);
  console.log(`📞 Found ${phones.length} phone(s):`, phones);
  
  // Try to extract name (first non-empty line, cleaned)
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let name = '';
  
  // Look for name in first few lines (skip common headers)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Skip lines that look like headers, labels, or contact info
    if (line.length > 2 && line.length < 80 && 
        !lowerLine.includes('resume') && 
        !lowerLine.includes('curriculum') &&
        !lowerLine.includes('cv') &&
        !lowerLine.includes('experience') &&
        !lowerLine.includes('education') &&
        !lowerLine.includes('skills') &&
        !line.includes('@') &&
        !phoneRegex.test(line) &&
        // Name should have at least one capital letter
        /[A-Z]/.test(line) &&
        // Name shouldn't be all caps (usually headers)
        line !== line.toUpperCase()) {
      name = line;
      break;
    }
  }
  
  console.log(`👤 Extracted name: "${name}"`);

  // Try to extract role from Experience section
  let role = '';
  let fullRole = '';
  
  // Find the Experience section
  const experienceKeywords = ['experience', 'work experience', 'professional experience', 'employment', 'work history', 'career'];
  let experienceStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase().trim();
    // Remove extra spaces for matching
    const cleanLine = lowerLine.replace(/\s+/g, ' ');
    for (const keyword of experienceKeywords) {
      if (cleanLine === keyword || 
          cleanLine.startsWith(keyword + ' ') || 
          cleanLine.endsWith(' ' + keyword) ||
          cleanLine.includes(keyword)) {
        experienceStartIndex = i + 1; // Start after the header
        break;
      }
    }
    if (experienceStartIndex >= 0) break;
  }
  
  if (experienceStartIndex >= 0 && experienceStartIndex < lines.length) {
    console.log(`📋 Found Experience section at line ${experienceStartIndex}`);
    
    // Look for the first job title in the experience section
    // Job titles are typically on their own line or at the start of a line
    const roleKeywords = [
      'developer', 'engineer', 'manager', 'designer', 'analyst', 'specialist',
      'architect', 'consultant', 'director', 'lead', 'senior', 'junior',
      'programmer', 'administrator', 'coordinator', 'executive', 'officer',
      'scientist', 'researcher', 'technician', 'assistant'
    ];
    
    // Search in the experience section (next 30 lines after the header)
    for (let i = experienceStartIndex; i < Math.min(experienceStartIndex + 30, lines.length); i++) {
      const line = lines[i].trim();
      if (!line || line.length < 3) continue;
      
      const lowerLine = line.toLowerCase();
      
      // Stop if we hit another major section
      if (lowerLine.startsWith('education') || 
          lowerLine.startsWith('skills') || 
          lowerLine.startsWith('projects') ||
          lowerLine.startsWith('certifications') ||
          lowerLine.startsWith('awards') ||
          lowerLine.startsWith('publications')) {
        break;
      }
      
      // Check if this line contains a job title keyword
      // Normalize the line for better matching
      const normalizedLine = lowerLine.replace(/\s+/g, ' ');
      let foundKeyword = false;
      let matchedKeyword = '';
      
      for (const keyword of roleKeywords) {
        if (normalizedLine.includes(keyword)) {
          foundKeyword = true;
          matchedKeyword = keyword;
          break;
        }
      }
      
      if (foundKeyword) {
        // This looks like a job title line
        // Extract the job title (usually the first part of the line, before dates, company names, etc.)
        let jobTitle = line.trim();
        
        // Remove common patterns that come after job titles
        // Dates: "2020 - 2021", "Jan 2020 - Present", etc.
        jobTitle = jobTitle.replace(/\d{4}\s*[-–—]\s*\d{4}|\d{4}\s*[-–—]\s*(present|current|now)/gi, '');
        jobTitle = jobTitle.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*[-–—]\s*(present|current|now|\d{4})/gi, '');
        
        // Remove company names (often after "at", "|", "-", or "•")
        jobTitle = jobTitle.split(/ at | \| | - | • |\s{2,}/)[0].trim();
        
        // Remove extra whitespace
        jobTitle = jobTitle.replace(/\s+/g, ' ').trim();
        
        // Make sure it contains the keyword we found
        if (jobTitle.toLowerCase().includes(matchedKeyword) && jobTitle.length > 5 && jobTitle.length < 100) {
          fullRole = jobTitle;
          
          // Extract short version (just the title, before "with", "at", etc.)
          const stopWords = [' with ', ' at ', ' in ', ' for ', ' who ', ' that ', ' and ', ' responsible '];
          let shortRole = fullRole;
          
          for (const stopWord of stopWords) {
            const index = shortRole.toLowerCase().indexOf(stopWord);
            if (index > 0) {
              shortRole = shortRole.substring(0, index).trim();
              break;
            }
          }
          
          role = shortRole;
          console.log(`💼 Found job title in Experience section: "${role}"`);
          break;
        }
      }
    }
  }
  
  // Fallback: if we didn't find role in experience section, try the old method
  if (!role) {
    console.log(`⚠️ No role found in Experience section, trying fallback method...`);
    const roleKeywords = [
      'developer', 'engineer', 'manager', 'designer', 'analyst', 'specialist',
      'architect', 'consultant', 'director', 'lead', 'senior', 'junior',
      'programmer', 'administrator', 'coordinator', 'executive', 'officer',
      'scientist', 'researcher', 'technician', 'assistant'
    ];
    
    let roleStartIndex = -1;
    
    // Find the line with role keywords (but skip if it's in education section)
    let inEducationSection = false;
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const lowerLine = lines[i].toLowerCase();
      
      // Check if we're in education section
      if (lowerLine.includes('education') || lowerLine.includes('academic')) {
        inEducationSection = true;
        continue;
      }
      
      // If we hit experience section, we're past education
      if (lowerLine.includes('experience') || lowerLine.includes('work')) {
        inEducationSection = false;
      }
      
      // Skip education section
      if (inEducationSection) continue;
      
      for (const keyword of roleKeywords) {
        if (lowerLine.includes(keyword)) {
          roleStartIndex = i;
          break;
        }
      }
      if (roleStartIndex >= 0) break;
    }
    
    if (roleStartIndex >= 0) {
      const line = lines[roleStartIndex];
      fullRole = line.replace(/\s+/g, ' ').trim();
      
      // Extract short version
      const stopWords = [' with ', ' at ', ' in ', ' for ', ' who ', ' that ', ' and '];
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

