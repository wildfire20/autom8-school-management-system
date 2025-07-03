/**
 * Fix API_BASE URLs in all frontend files for Railway deployment
 */

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
    'frontend/admin.html',
    'frontend/dashboard.html',
    'frontend/assignments.html',
    'frontend/classes.html',
    'frontend/attendance.html',
    'frontend/grades.html',
    'frontend/notifications.html',
    'frontend/admin-tester.html',
    'frontend/admin-panel-final-test.html',
    'frontend/admin-enhanced.html',
    'frontend/student-dashboard.html',
    'frontend/teacher-dashboard.html'
];

// Replacement pattern
const oldPattern = `const API_BASE = 'http://localhost:3000/api';`;
const newPattern = `// API configuration - automatically detects the environment
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : \`\${window.location.protocol}//\${window.location.host}/api\`;`;

console.log('🔧 Fixing API_BASE URLs in frontend files...');

filesToFix.forEach(filePath => {
    try {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            if (content.includes(oldPattern)) {
                content = content.replace(oldPattern, newPattern);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Fixed: ${filePath}`);
            } else {
                console.log(`⚠️  Pattern not found in: ${filePath}`);
            }
        } else {
            console.log(`❌ File not found: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
});

console.log('🎉 Frontend API URLs fixed for Railway deployment!');
