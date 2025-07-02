// Script to add AutoM8 footer branding to all HTML files
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');

// HTML files to update
const htmlFiles = [
  'admin.html',
  'attendance.html', 
  'classes.html',
  'grades.html',
  'notifications.html',
  'parents.html',
  'profile.html'
];

const footerScript = `
    <!-- Include school branding configuration -->
    <script src="/assets/school-config.js"></script>`;

htmlFiles.forEach(filename => {
  const filePath = path.join(frontendDir, filename);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if footer script is already added
    if (!content.includes('school-config.js')) {
      // Add before closing </body> tag
      content = content.replace('</body>', `${footerScript}\n</body>`);
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Added AutoM8 footer to ${filename}`);
    } else {
      console.log(`⏭️  AutoM8 footer already exists in ${filename}`);
    }
  } else {
    console.log(`❌ File not found: ${filename}`);
  }
});

console.log('\n🎉 AutoM8 footer branding added to all HTML pages!');
console.log('📱 Restart the server to see the "Powered by AutoM8" footer on all pages.');
