# Quick Start - OCR Setup (2 Minutes)

## ✅ What You Have Now

Your CV upload feature now supports **image-based PDFs** with automatic OCR!

**Note**: Only `tesseract.js` is required as a Node dependency. We use the native `pdftoppm` command (from Poppler) directly.

## 🚀 Quick Setup (Windows)

### Step 1: Install Poppler (Required)

**Option A - Chocolatey (Fastest):**
```powershell
# Run as Administrator
choco install poppler
```

**Option B - Manual:**
1. Download: https://github.com/oschwartz10612/poppler-windows/releases/
2. Extract to `C:\Program Files\poppler`
3. Add to PATH: `C:\Program Files\poppler\Library\bin`

### Step 2: Verify Installation
```bash
pdftoppm -v
```
Should show version info.

### Step 3: Restart Server
```bash
# Stop server (Ctrl+C)
cd server
npm run dev
```

### Step 4: Test
Upload "Fariz Ali's Resume.pdf" and watch the terminal!

## 📊 What to Expect

**Text-based PDF:**
```
✅ Extracted 1234 characters (100-500ms)
```

**Image-based PDF:**
```
⚠️ Attempting OCR...
OCR Progress: 100%
✅ OCR extracted 1234 characters (3-10 seconds)
```

## 💰 Costs

- **Tesseract OCR**: FREE (current implementation)
- **OpenAI GPT-4o Vision**: ~$0.003 per CV (optional upgrade)

## 🆘 Troubleshooting

**"pdftoppm not found"**
→ Install Poppler (see Step 1)

**Form still empty**
→ Check terminal logs to see what was extracted

**OCR too slow**
→ Normal (3-10s). Consider OpenAI Vision for 1-2s processing

## 📚 Full Documentation

- **Installation Guide**: `server/OCR_SETUP.md`
- **Complete Summary**: `CV_PARSING_UPGRADE.md`
- **Test Script**: `node server/test-ocr.js`

---

**Ready to test?** Just install Poppler and restart your server! 🎉
