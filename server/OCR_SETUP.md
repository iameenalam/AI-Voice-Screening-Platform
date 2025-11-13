# OCR Setup Guide for CV Parsing

## What Was Added

Your CV upload feature now has **OCR (Optical Character Recognition)** support! This means it can extract text from:
- ✅ Regular text-based PDFs (using pdf-parse)
- ✅ Image-based/Scanned PDFs (using OCR with Tesseract.js)
- ✅ Mixed PDFs (tries text extraction first, falls back to OCR)

## How It Works

1. **First Attempt**: Tries standard PDF text extraction
2. **If Empty**: Converts PDF to image and runs OCR
3. **Extracts Data**: Parses the text for name, email, phone, role

## Windows Setup (Required for pdf2pic)

### Option 1: Using Chocolatey (Recommended)

```powershell
# Install Chocolatey if you don't have it
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Poppler
choco install poppler
```

### Option 2: Manual Installation

1. Download Poppler for Windows: https://github.com/oschwartz10612/poppler-windows/releases/
2. Extract to `C:\Program Files\poppler`
3. Add to PATH:
   - Open System Properties → Environment Variables
   - Edit "Path" variable
   - Add: `C:\Program Files\poppler\Library\bin`
4. Restart your terminal/IDE

### Verify Installation

```bash
pdftoppm -v
```

You should see Poppler version info.

## Testing

Upload "Fariz Ali's Resume.pdf" again. You should see in the terminal:

```
📤 CV Upload started
📁 File: Fariz Ali's Resume.pdf
📄 Processing PDF file...
📝 Extracted text length: 0 characters
⚠️ PDF text extraction returned minimal text. Attempting OCR...
📸 Converting PDF to image for OCR...
✅ PDF converted to image
🔍 Running OCR on image...
OCR Progress: 25%
OCR Progress: 50%
OCR Progress: 75%
OCR Progress: 100%
✅ OCR extracted 1234 characters
📧 Found 1 email(s): ['fariz@example.com']
📞 Found 1 phone(s): ['+1234567890']
👤 Extracted name: "Fariz Ali"
💼 Extracted role: "Software Engineer"
✅ CV processing complete
```

## Performance Notes

- **Text-based PDFs**: ~100-500ms (fast)
- **Image-based PDFs with OCR**: ~3-10 seconds (slower but works!)
- OCR accuracy: ~95% for clear, high-quality scans

## Troubleshooting

### "pdftoppm not found" Error

**Solution**: Install Poppler (see setup above)

### OCR is slow

**Normal**: OCR takes 3-10 seconds per page. Consider:
- Adding a loading indicator (already done in frontend)
- Processing only first page (already implemented)
- Using OpenAI Vision API for faster results (see below)

### OCR accuracy is poor

**Solutions**:
1. Ask users to upload higher quality PDFs
2. Increase DPI in code (change `density: 300` to `density: 600`)
3. Use OpenAI Vision API instead (more accurate)

## Alternative: OpenAI Vision API

For better accuracy and speed, you can use GPT-4o Vision:

### Pricing
- **GPT-4o**: ~$0.0025-0.005 per CV (recommended)
- **GPT-4 Vision**: ~$0.01-0.02 per CV

### Cost Comparison
| Volume | OCR (Free) | GPT-4o Vision |
|--------|-----------|---------------|
| 100 CVs/month | $0 | $0.25-0.50 |
| 1,000 CVs/month | $0 | $2.50-5.00 |
| 10,000 CVs/month | $0 | $25-50 |

### When to Use Each

**Use OCR (Tesseract) when:**
- Budget is tight
- Processing < 100 CVs/month
- PDFs are high quality scans
- You don't mind 3-10 second processing time

**Use OpenAI Vision when:**
- Need better accuracy (95% → 99%)
- Processing many CVs
- Want faster processing (1-2 seconds)
- Budget allows $2-5/month per 1000 CVs

Would you like me to implement the OpenAI Vision API option as well?

## Current Implementation

The code now:
1. ✅ Tries text extraction first (fast)
2. ✅ Falls back to OCR if needed (slower but works)
3. ✅ Shows progress in terminal
4. ✅ Cleans up temporary files
5. ✅ Provides clear error messages

Your CV upload feature is now much more robust! 🎉
