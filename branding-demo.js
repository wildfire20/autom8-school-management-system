// Quick Branding Demo Script
// This script demonstrates how to quickly rebrand the AutoM8 system for different schools

const fs = require('fs');
const path = require('path');

// Sample school configurations
const SCHOOL_TEMPLATES = {
  greenwood: {
    schoolName: "Greenwood High School",
    schoolSlogan: "Excellence in Education, Leadership in Life",
    schoolMotto: "Learn • Lead • Succeed",
    primaryColor: "#667eea",
    secondaryColor: "#764ba2",
    address: "123 Education Boulevard, Learning City, LC 12345",
    phone: "(555) 123-4567",
    email: "info@greenwoodhigh.edu",
    website: "www.greenwoodhigh.edu"
  },
  
  riverside: {
    schoolName: "Riverside Academy",
    schoolSlogan: "Where Every Student Shines",
    schoolMotto: "Inspire • Achieve • Excel",
    primaryColor: "#28a745",
    secondaryColor: "#1e7e34",
    address: "456 River Street, Riverside, RS 67890",
    phone: "(555) 987-6543",
    email: "admin@riversideacademy.edu",
    website: "www.riversideacademy.edu"
  },
  
  summit: {
    schoolName: "Summit Preparatory School",
    schoolSlogan: "Reaching New Heights Together",
    schoolMotto: "Challenge • Growth • Success",
    primaryColor: "#dc3545",
    secondaryColor: "#c82333",
    address: "789 Mountain View Drive, Summit, SM 13579",
    phone: "(555) 246-8135",
    email: "contact@summitprep.edu",
    website: "www.summitprep.edu"
  }
};

function generateSchoolConfig(schoolKey) {
  const school = SCHOOL_TEMPLATES[schoolKey];
  if (!school) {
    console.error('School template not found:', schoolKey);
    return;
  }

  const configContent = `// School Branding Configuration
const SCHOOL_CONFIG = {
  // School Identity
  schoolName: "${school.schoolName}",
  schoolSlogan: "${school.schoolSlogan}",
  schoolMotto: "${school.schoolMotto}",
  
  // Logo and Images
  logoUrl: "/assets/school-logo.png",
  faviconUrl: "/assets/favicon.ico",
  backgroundImage: "/assets/school-background.jpg",
  
  // Color Scheme
  primaryColor: "${school.primaryColor}",      // Main brand color
  secondaryColor: "${school.secondaryColor}",    // Accent color
  successColor: "#28a745",      // Success messages
  errorColor: "#dc3545",        // Error messages
  warningColor: "#ffc107",      // Warning messages
  
  // Contact Information
  address: "${school.address}",
  phone: "${school.phone}",
  email: "${school.email}",
  website: "${school.website}",
  
  // Academic Configuration
  gradingScale: {
    A: { min: 90, max: 100, gpa: 4.0 },
    B: { min: 80, max: 89, gpa: 3.0 },
    C: { min: 70, max: 79, gpa: 2.0 },
    D: { min: 60, max: 69, gpa: 1.0 },
    F: { min: 0, max: 59, gpa: 0.0 }
  },
  
  // School Calendar
  academicYear: "2024-2025",
  semester: "Fall 2024",
  
  // Features Configuration
  features: {
    enableParentPortal: true,
    enableEmailNotifications: true,
    enableFileUploads: true,
    maxFileSize: "10MB",
    allowedFileTypes: [".pdf", ".doc", ".docx", ".txt", ".jpg", ".png"]
  },
  
  // Email Templates Customization
  emailSignature: \`
    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
      <p><strong>${school.schoolName}</strong></p>
      <p>${school.address}</p>
      <p>Phone: ${school.phone} | Email: ${school.email}</p>
      <p><a href="http://${school.website}">${school.website}</a></p>
    </div>
  \`
};

// Apply school branding when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Update page title
  document.title = \`\${SCHOOL_CONFIG.schoolName} - AutoM8\`;
  
  // Update navigation title
  const navTitle = document.querySelector('.navbar h1');
  if (navTitle) {
    navTitle.innerHTML = \`🎓 \${SCHOOL_CONFIG.schoolName}\`;
  }
  
  // Update favicon
  const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = SCHOOL_CONFIG.faviconUrl;
  document.head.appendChild(favicon);
  
  // Apply CSS custom properties for colors
  document.documentElement.style.setProperty('--primary-color', SCHOOL_CONFIG.primaryColor);
  document.documentElement.style.setProperty('--secondary-color', SCHOOL_CONFIG.secondaryColor);
  document.documentElement.style.setProperty('--success-color', SCHOOL_CONFIG.successColor);
  document.documentElement.style.setProperty('--error-color', SCHOOL_CONFIG.errorColor);
  
  // Update logo if present
  const logoElement = document.querySelector('.school-logo');
  if (logoElement) {
    logoElement.src = SCHOOL_CONFIG.logoUrl;
    logoElement.alt = \`\${SCHOOL_CONFIG.schoolName} Logo\`;
  }
  
  // Update footer information if present
  const footerInfo = document.querySelector('.footer-info');
  if (footerInfo) {
    footerInfo.innerHTML = \`
      <h3>\${SCHOOL_CONFIG.schoolName}</h3>
      <p>\${SCHOOL_CONFIG.schoolSlogan}</p>
      <p>\${SCHOOL_CONFIG.address}</p>
      <p>Phone: \${SCHOOL_CONFIG.phone} | Email: \${SCHOOL_CONFIG.email}</p>
    \`;
  }
  
  // Add "Powered by AutoM8" footer if not exists
  let autoM8Footer = document.querySelector('.autom8-footer');
  if (!autoM8Footer) {
    autoM8Footer = document.createElement('div');
    autoM8Footer.className = 'autom8-footer';
    autoM8Footer.innerHTML = \`
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
        padding: 15px 20px;
        margin-top: 50px;
        font-size: 14px;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
      ">
        <p style="margin: 0; opacity: 0.9;">
          Powered by <strong>AutoM8</strong> School Management System
        </p>
        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">
          Complete Educational Management Solution
        </p>
      </div>
    \`;
    document.body.appendChild(autoM8Footer);
  }
});

// Export for Node.js use (email templates, etc.)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCHOOL_CONFIG;
}`;

  return configContent;
}

// CLI interface
if (require.main === module) {
  const schoolKey = process.argv[2];
  
  if (!schoolKey) {
    console.log('Usage: node branding-demo.js <school_key>');
    console.log('Available schools:', Object.keys(SCHOOL_TEMPLATES).join(', '));
    console.log('\\nExample: node branding-demo.js riverside');
    return;
  }
  
  const config = generateSchoolConfig(schoolKey);
  if (config) {
    const configPath = path.join(__dirname, 'frontend', 'assets', 'school-config.js');
    fs.writeFileSync(configPath, config);
    console.log(`✅ School configuration updated for ${SCHOOL_TEMPLATES[schoolKey].schoolName}`);
    console.log(`📄 Configuration saved to: ${configPath}`);
    console.log('\\n🔄 Restart the server to see changes: npm start');
  }
}

module.exports = { SCHOOL_TEMPLATES, generateSchoolConfig };
