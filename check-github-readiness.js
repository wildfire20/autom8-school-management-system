/**
 * GitHub Readiness Check
 * Verifies that all necessary files are present for GitHub deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AutoM8 School Management System - GitHub Readiness Check');
console.log(''.padEnd(60, '='));

const requiredFiles = [
  { file: 'README.md', description: 'Project documentation' },
  { file: 'LICENSE', description: 'MIT License file' },
  { file: '.gitignore', description: 'Git ignore rules' },
  { file: '.env.example', description: 'Environment template' },
  { file: 'package.json', description: 'Node.js dependencies' },
  { file: 'index.js', description: 'Main server file' },
  { file: 'FINAL-DEPLOYMENT-GUIDE.md', description: 'Deployment instructions' },
  { file: 'PROJECT-COMPLETION-REPORT.md', description: 'Project status' },
  { file: 'GITHUB-DEPLOYMENT-INSTRUCTIONS.md', description: 'GitHub setup guide' }
];

const requiredDirectories = [
  { dir: 'controllers', description: 'Business logic controllers' },
  { dir: 'db', description: 'Database configuration' },
  { dir: 'frontend', description: 'Frontend static files' },
  { dir: 'middleware', description: 'Express middleware' },
  { dir: 'routes', description: 'API route definitions' },
  { dir: 'utils', description: 'Utility functions' },
  { dir: 'uploads', description: 'File upload directory' }
];

let allFilesPresent = true;
let allDirsPresent = true;

console.log('📋 Checking required files...');
requiredFiles.forEach(({ file, description }) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - ${description}`);
  } else {
    console.log(`❌ ${file} - MISSING - ${description}`);
    allFilesPresent = false;
  }
});

console.log('');
console.log('📁 Checking required directories...');
requiredDirectories.forEach(({ dir, description }) => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`✅ ${dir}/ - ${description}`);
  } else {
    console.log(`❌ ${dir}/ - MISSING - ${description}`);
    allDirsPresent = false;
  }
});

console.log('');
console.log('🔒 Checking security files...');

// Check .env is not present (should not be committed)
if (!fs.existsSync('.env')) {
  console.log('✅ .env file not found - Good! (should not be committed to git)');
} else {
  console.log('⚠️  .env file found - Make sure it\'s in .gitignore');
}

// Check .gitignore content
if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  const criticalIgnores = ['.env', 'node_modules/', 'uploads/*'];
  
  criticalIgnores.forEach(ignore => {
    if (gitignoreContent.includes(ignore)) {
      console.log(`✅ .gitignore includes "${ignore}"`);
    } else {
      console.log(`⚠️  .gitignore missing "${ignore}"`);
    }
  });
}

console.log('');
console.log('📊 READINESS SUMMARY');
console.log(''.padEnd(60, '='));

if (allFilesPresent && allDirsPresent) {
  console.log('🎉 ALL CHECKS PASSED! Ready for GitHub deployment');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Install Git (if not already installed)');
  console.log('2. Create a GitHub repository');
  console.log('3. Follow instructions in GITHUB-DEPLOYMENT-INSTRUCTIONS.md');
  console.log('');
  console.log('🚀 Quick commands after Git installation:');
  console.log('   git init');
  console.log('   git add .');
  console.log('   git commit -m "Initial commit: AutoM8 School Management System v1.0"');
  console.log('   git remote add origin https://github.com/yourusername/autom8-school-management-system.git');
  console.log('   git push -u origin main');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('Please ensure all required files and directories are present before deploying to GitHub');
}

console.log('');
console.log('📖 For detailed instructions, see: GITHUB-DEPLOYMENT-INSTRUCTIONS.md');
console.log('');
