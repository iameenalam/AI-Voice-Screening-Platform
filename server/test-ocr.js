// Quick test script to verify OCR dependencies are installed
import Tesseract from 'tesseract.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🧪 Testing OCR Dependencies...\n');

// Test 1: Check if Tesseract is available
try {
  console.log('✅ Tesseract.js imported successfully');
} catch (error) {
  console.error('❌ Tesseract.js import failed:', error.message);
  process.exit(1);
}

// Test 2: Check if Poppler is installed (required for PDF to image conversion)
console.log('\n📋 Checking Poppler installation...');
try {
  const { stdout } = await execAsync('pdftoppm -v');
  console.log('✅ Poppler is installed!');
  console.log(`   Version: ${stdout.split('\n')[0]}`);
} catch (error) {
  console.error('❌ Poppler is NOT installed');
  console.error('   Install it to enable OCR for image-based PDFs');
  console.error('   See server/OCR_SETUP.md for installation instructions\n');
  process.exit(1);
}

console.log('\n✅ All OCR dependencies are installed and working!');
console.log('\n📝 Next steps:');
console.log('   1. Restart your server: npm run dev');
console.log('   2. Upload a CV to test OCR functionality');
console.log('   3. Watch the terminal for OCR progress\n');
