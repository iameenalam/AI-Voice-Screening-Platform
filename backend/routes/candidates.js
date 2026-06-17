import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import Interviewee from '../models/Interviewee.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { PdfReader } from 'pdfreader';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import { sendInterviewInvitation } from '../utils/email.js';

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
  
  // Check if OpenRouter is available
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    console.warn('⚠️ OpenRouter API key not found, using fallback extraction');
    return fallbackExtraction(normalizedText);
  }
  
  try {
    // Use OpenRouter to extract structured data from CV
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: openrouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://vocalent.com',
        'X-Title': 'Vocalent',
      }
    });
    
    console.log('🤖 Calling OpenRouter for CV parsing...');
    
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
      model: process.env.AI_MODEL || 'openai/gpt-3.5-turbo',
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
router.post('/upload-cv', authenticate, async (req, res) => {
  try {
    const { cvUrl, fileName } = req.body;
    if (!cvUrl || !fileName) {
      return res.status(400).json({ error: 'No file URL or name provided' });
    }

    console.log(`\n📤 CV Upload started from URL: ${cvUrl}`);
    console.log(`📁 File: ${fileName}`);

    let text = '';
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const tempFilePath = path.join(process.cwd(), 'uploads', `temp_${Date.now()}.${fileExtension}`);

    try {
      // Ensure temp dir exists
      await fs.mkdir(path.join(process.cwd(), 'uploads'), { recursive: true });
      
      // Download the file from UploadThing
      const response = await fetch(cvUrl);
      if (!response.ok) throw new Error('Failed to fetch file from UploadThing');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(tempFilePath, buffer);

      if (fileExtension === 'pdf') {
        console.log('📄 Processing PDF file...');
        text = await extractTextFromPDF(tempFilePath);
      } else if (['doc', 'docx'].includes(fileExtension)) {
        console.log('📄 Processing DOCX file...');
        text = await extractTextFromDOCX(tempFilePath);
      } else {
        await fs.unlink(tempFilePath);
        return res.status(400).json({ error: 'Unsupported file format. Please upload PDF, DOC, or DOCX.' });
      }

      const extractedData = await parseCVText(text);

      // Clean up temp file
      await fs.unlink(tempFilePath);

      console.log(`✅ CV URL: ${cvUrl}`);
      console.log('✅ CV processing complete\n');

      res.json({
        success: true,
        data: extractedData,
        cvUrl: cvUrl
      });
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(tempFilePath);
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

// Create candidate manually (Recruiter upload path)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, role, fullRole, email, cvUrl, extractedData } = req.body;
    
    // Fetch recruiter to get company
    const recruiter = await User.findById(req.userId);
    const company = recruiter?.company || 'Unknown';

    const candidate = new Candidate({
      recruiterId: req.userId,
      isExternal: true, // Mark as recruiter-uploaded (external badge)
      appliedCompany: company,
      jobField: role, // Default jobField to the extracted role
      name,
      role,
      fullRole: fullRole || role,
      email,
      cvUrl,
      extractedData,
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (error) {
    console.error('❌ Create manual candidate error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Public CV Parse (No authentication required, no permanent saving)
router.post('/public-parse-cv', async (req, res) => {
  try {
    const { cvUrl, fileName } = req.body;
    if (!cvUrl || !fileName) return res.status(400).json({ error: 'No file URL provided' });

    let text = '';
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const tempFilePath = path.join(process.cwd(), 'uploads', `temp_${Date.now()}.${fileExtension}`);

    try {
      await fs.mkdir(path.join(process.cwd(), 'uploads'), { recursive: true });
      const response = await fetch(cvUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(tempFilePath, buffer);

      if (fileExtension === 'pdf') {
        text = await extractTextFromPDF(tempFilePath);
      } else if (['doc', 'docx'].includes(fileExtension)) {
        text = await extractTextFromDOCX(tempFilePath);
      } else {
        await fs.unlink(tempFilePath);
        return res.status(400).json({ error: 'Unsupported file format.' });
      }

      const extractedData = await parseCVText(text);
      await fs.unlink(tempFilePath); // Clean up temp file

      const hasData = extractedData.name || extractedData.email || extractedData.phone;
      if (!hasData) {
        return res.status(400).json({ 
          error: 'Could not extract data. Please fill details manually.' 
        });
      }

      res.json({ success: true, data: extractedData });
    } catch (error) {
      try { await fs.unlink(tempFilePath); } catch {}
      res.status(500).json({ error: 'Parsing failed', details: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Public Apply (Saves candidate with UploadThing URL permanently)
router.post('/public-apply', async (req, res) => {
  try {
    const { name, email, phone, appliedCompany, jobField, extractedData, cvUrl } = req.body;

    if (!name || !email || !appliedCompany || !jobField || !cvUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const candidate = new Candidate({
      name,
      email,
      phone,
      appliedCompany,
      jobField,
      role: jobField,
      fullRole: jobField,
      cvUrl,
      extractedData: extractedData ? (typeof extractedData === 'string' ? JSON.parse(extractedData) : extractedData) : {},
    });

    await candidate.save();
    res.status(201).json({ success: true, candidate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all candidates for recruiter (Only public applicants)
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const query = {
      $or: [
        { appliedCompany: user.company },
        { appliedCompany: 'All' }
      ]
    };

    const candidates = await Candidate.find(query)
      .sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    console.error('❌ Get candidates error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single candidate/interviewee
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Try both collections
    const [candidate, interviewee] = await Promise.all([
      Candidate.findOne({ _id: req.params.id }),
      Interviewee.findOne({ _id: req.params.id, recruiterId: req.userId })
    ]);

    const result = candidate || interviewee;

    if (!result) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send interview invitation to a candidate
router.post('/send-interview-invite', authenticate, async (req, res) => {
  try {
    const { candidateId, questions, customSubject, customMessage } = req.body;

    if (!candidateId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Candidate ID and questions array are required' });
    }

    // Find the candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (!candidate.email) {
      return res.status(400).json({ error: 'Candidate has no email address' });
    }

    // Generate unique interview token
    const interviewToken = crypto.randomBytes(32).toString('hex');

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create interview record
    const interview = new Interview({
      candidateId: candidate._id,
      candidateModel: 'Candidate',
      recruiterId: req.userId,
      questions,
      status: 'pending',
      interviewToken,
      expiresAt,
    });
    await interview.save();

    // Update candidate status
    candidate.status = 'invited';
    candidate.interviewToken = interviewToken;
    candidate.interviewId = interview._id;
    await candidate.save();

    // Construct the interview link
    const frontendUrl = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')[0].trim()
      : 'http://localhost:8080';
    const interviewLink = `${frontendUrl}/interview/${interviewToken}`;

    // Get recruiter's company name
    const recruiter = await User.findById(req.userId);
    const companyName = recruiter?.company || '';

    // Send email
    try {
      await sendInterviewInvitation({
        to: candidate.email,
        candidateName: candidate.name,
        interviewLink,
        companyName,
        jobField: candidate.jobField || candidate.role || '',
        expiresAt,
        customSubject,
        customMessage
      });

      console.log(`✅ Interview invitation sent to ${candidate.email}`);
      res.json({
        success: true,
        message: `Interview invitation sent to ${candidate.email}`,
        interviewId: interview._id,
        interviewToken,
        interviewLink,
        expiresAt,
      });
    } catch (emailError) {
      // Interview was created but email failed — still return success with warning
      console.error('❌ Email sending failed:', emailError.message);
      res.json({
        success: true,
        warning: `Interview created but email failed: ${emailError.message}`,
        interviewId: interview._id,
        interviewToken,
        interviewLink,
        expiresAt,
        emailFailed: true,
      });
    }
  } catch (error) {
    console.error('❌ Send interview invite error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Resend interview email (for when email initially failed)
router.post('/resend-interview-email', authenticate, async (req, res) => {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: 'Candidate ID is required' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (!candidate.interviewToken || !candidate.interviewId) {
      return res.status(400).json({ error: 'No interview invite exists for this candidate. Send an invite first.' });
    }

    const interview = await Interview.findById(candidate.interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview record not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ error: 'Interview has already been completed' });
    }

    const frontendUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')[0].trim()
      : 'http://localhost:8080';
    const interviewLink = `${frontendUrl}/interview/${candidate.interviewToken}`;

    const recruiter = await User.findById(req.userId);
    const companyName = recruiter?.company || '';

    try {
      await sendInterviewInvitation({
        to: candidate.email,
        candidateName: candidate.name,
        interviewLink,
        companyName,
        jobField: candidate.jobField || candidate.role || '',
        expiresAt: interview.expiresAt,
      });

      console.log(`✅ Interview invitation re-sent to ${candidate.email}`);
      res.json({
        success: true,
        message: `Interview invitation re-sent to ${candidate.email}`,
        interviewLink,
      });
    } catch (emailError) {
      console.error('❌ Resend email failed:', emailError.message);
      res.status(500).json({
        error: `Failed to send email: ${emailError.message}`,
        interviewLink,
      });
    }
  } catch (error) {
    console.error('❌ Resend interview email error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Batch send interview invitations
router.post('/batch-send-invites', authenticate, async (req, res) => {
  try {
    const { candidateIds, questions, customSubject, customMessage } = req.body;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: 'candidateIds array is required' });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions array is required' });
    }

    const recruiter = await User.findById(req.userId);
    const companyName = recruiter?.company || '';
    const frontendUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')[0].trim()
      : 'http://localhost:8080';

    const results = [];

    for (const candidateId of candidateIds) {
      try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
          results.push({ candidateId, success: false, error: 'Not found' });
          continue;
        }
        if (!candidate.email) {
          results.push({ candidateId, success: false, error: 'No email' });
          continue;
        }
        if (candidate.status === 'invited' || candidate.status === 'interviewed') {
          results.push({ candidateId, success: false, error: 'Already invited' });
          continue;
        }

        const interviewToken = crypto.randomBytes(32).toString('hex');

        // Set expiry to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const interview = new Interview({
          candidateId: candidate._id,
          candidateModel: 'Candidate',
          recruiterId: req.userId,
          questions,
          status: 'pending',
          interviewToken,
          expiresAt,
        });
        await interview.save();

        candidate.status = 'invited';
        candidate.interviewToken = interviewToken;
        candidate.interviewId = interview._id;
        await candidate.save();

        const interviewLink = `${frontendUrl}/interview/${interviewToken}`;

        try {
          await sendInterviewInvitation({
            to: candidate.email,
            candidateName: candidate.name,
            interviewLink,
            companyName,
            jobField: candidate.jobField || candidate.role || '',
            expiresAt,
            customSubject,
            customMessage
          });
          results.push({ candidateId, success: true, email: candidate.email });
        } catch (emailErr) {
          results.push({ candidateId, success: true, email: candidate.email, emailFailed: true, warning: emailErr.message });
        }
      } catch (err) {
        results.push({ candidateId, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({
      success: true,
      message: `Sent ${successCount}/${candidateIds.length} invitations`,
      results,
    });
  } catch (error) {
    console.error('❌ Batch send invites error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;

