import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import { PdfReader } from 'pdfreader';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const router = express.Router();

const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : 'uploads/';
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
          console.log(`\n🔍 RAW EXTRACTED TEXT FROM PDF:\n${finalText}\n`);
          
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
      // This line has spaced characters - join them but preserve word boundaries
      let joined = words.join('');
      // Add space between lowercase followed by uppercase (word boundaries)
      joined = joined.replace(/([a-z])([A-Z])/g, '$1 $2');
      // Add space between letter and number
      joined = joined.replace(/([a-zA-Z])(\d)/g, '$1 $2');
      // Add space between number and letter
      joined = joined.replace(/(\d)([a-zA-Z])/g, '$1 $2');
      // Add space after common punctuation
      joined = joined.replace(/([.,;:!?])([A-Za-z])/g, '$1 $2');
      return joined;
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

// AI-powered CV parser using OpenAI
async function parseCVText(text) {
  console.log(`🔍 Parsing CV text with AI (${text.length} characters)`);
  
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
  
  // Check if OpenAI is available
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn('⚠️ OpenAI API key not found, using fallback extraction');
    return fallbackExtraction(normalizedText);
  }
  
  try {
    // Use OpenAI to extract structured data from CV
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openaiKey });
    
    console.log('🤖 Calling OpenAI for CV parsing...');
    
    const prompt = `Extract the following information from this CV/resume text. Return ONLY a valid JSON object with these exact fields:
{
  "name": "candidate's full name",
  "email": "email address",
  "phone": "phone number with country code if available",
  "role": "most recent or current job title (short version, e.g., 'Software Engineer', 'AI Intern')",
  "fullRole": "most recent job title with full context (e.g., 'Back-End & AI Intern at Disrupt.com')"
}

Rules:
- Extract the candidate's actual name (usually at top or bottom of CV)
- For role, prioritize the most recent position in the Experience section
- Keep role short and professional (just the title)
- Include company name in fullRole if available
- If any field is not found, use empty string ""
- Return ONLY the JSON object, no other text

CV Text:
${normalizedText.substring(0, 4000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a CV parsing assistant. Extract structured data from resumes and return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });
    
    const content = response.choices[0].message.content.trim();
    console.log('🤖 OpenAI response:', content);
    
    // Parse the JSON response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI JSON response:', parseError.message);
      console.log('⚠️ Falling back to simple extraction');
      return fallbackExtraction(normalizedText);
    }
    
    const result = {
      name: (parsed.name || '').substring(0, 100),
      email: parsed.email || '',
      phone: parsed.phone || '',
      role: parsed.role || '',
      fullRole: parsed.fullRole || parsed.role || '',
    };
    
    console.log('✅ AI Parsing result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error('❌ OpenAI parsing error:', error.message);
    console.log('⚠️ Falling back to simple extraction');
    return fallbackExtraction(normalizedText);
  }
}

// Fallback extraction using simple string methods (no regex)
function fallbackExtraction(text) {
  console.log('📝 Using fallback extraction method');
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let name = '';
  let email = '';
  let phone = '';
  let role = '';
  
  // Extract email (look for @ symbol)
  for (const line of lines) {
    if (line.includes('@') && line.includes('.')) {
      const words = line.split(/\s+/);
      for (const word of words) {
        if (word.includes('@') && word.includes('.')) {
          // Clean up the email
          let cleanEmail = word;
          // Remove common trailing characters
          while (cleanEmail.endsWith('.') || cleanEmail.endsWith(',') || cleanEmail.endsWith('|')) {
            cleanEmail = cleanEmail.slice(0, -1);
          }
          if (cleanEmail.length > 5) {
            email = cleanEmail;
            console.log('📧 Found email:', email);
            break;
          }
        }
      }
      if (email) break;
    }
  }
  
  // Extract phone (look for + followed by digits, or long digit sequences)
  for (const line of lines) {
    if (line.includes('+')) {
      const words = line.split(/\s+/);
      for (const word of words) {
        if (word.startsWith('+')) {
          // Extract digits after +
          let digits = '';
          for (const char of word) {
            if (char >= '0' && char <= '9') {
              digits += char;
            } else if (char === '+') {
              continue;
            } else {
              break;
            }
          }
          if (digits.length >= 10) {
            phone = '+' + digits;
            console.log('📞 Found phone:', phone);
            break;
          }
        }
      }
      if (phone) break;
    }
  }
  
  // Extract name (look for proper capitalized words at start or end)
  const skipWords = ['resume', 'curriculum', 'cv', 'experience', 'education', 'skills', 'projects', 'certifications'];
  const searchLines = [...lines.slice(0, 10), ...lines.slice(-5)];
  
  for (const line of searchLines) {
    const lower = line.toLowerCase();
    
    // Skip lines with skip words
    if (skipWords.some(word => lower.includes(word))) continue;
    
    // Skip lines with email or phone
    if (line.includes('@') || line.includes('+')) continue;
    
    // Skip long lines
    if (line.length > 50) continue;
    
    // Check if line has 2-4 capitalized words
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      const allCapitalized = words.every(word => {
        if (word.length === 0) return false;
        const firstChar = word[0];
        return firstChar >= 'A' && firstChar <= 'Z';
      });
      
      if (allCapitalized) {
        name = line;
        console.log('👤 Found name:', name);
        break;
      }
    }
  }
  
  // Extract role (look for common job titles in Experience section)
  const jobWords = ['intern', 'developer', 'engineer', 'designer', 'manager', 'analyst', 'freelancer', 'consultant'];
  let inExperience = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Check if we're in Experience section
    if (lower === 'experience' || lower.includes('work experience')) {
      inExperience = true;
      continue;
    }
    
    // Stop at next section
    if (inExperience && (lower === 'education' || lower === 'skills' || lower === 'projects')) {
      break;
    }
    
    // Look for job titles
    if (inExperience || i < 30) {
      for (const jobWord of jobWords) {
        if (lower.includes(jobWord)) {
          // Extract the job title part
          let jobTitle = line;
          
          // Remove bullets
          if (jobTitle.startsWith('•')) {
            jobTitle = jobTitle.substring(1).trim();
          }
          
          // Split by common separators and take first part
          const separators = [' – ', ' — ', ' - ', ' | '];
          for (const sep of separators) {
            if (jobTitle.includes(sep)) {
              jobTitle = jobTitle.split(sep)[0].trim();
              break;
            }
          }
          
          // Remove dates (look for 4-digit years)
          const words = jobTitle.split(/\s+/);
          const filtered = words.filter(word => {
            // Check if word contains 4 consecutive digits
            let digitCount = 0;
            for (const char of word) {
              if (char >= '0' && char <= '9') {
                digitCount++;
                if (digitCount >= 4) return false;
              }
            }
            return true;
          });
          
          jobTitle = filtered.join(' ').trim();
          
          if (jobTitle.length >= 5 && jobTitle.length <= 80) {
            role = jobTitle;
            console.log('💼 Found role:', role);
            break;
          }
        }
      }
      if (role) break;
    }
  }
  
  return {
    name: name.substring(0, 100),
    email: email,
    phone: phone,
    role: role,
    fullRole: role,
  };
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

      const extractedData = await parseCVText(text);

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

