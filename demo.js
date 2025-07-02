#!/usr/bin/env node

// AutoM8 System Demo Script
// This script demonstrates the system's capabilities and helps with quick setup

const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
🎓 AutoM8 School Management System Demo
=====================================

Welcome to the AutoM8 demonstration! This script will help you:
1. Set up the system for your school
2. Configure branding and customization
3. Start the server and explore features
4. Test the complete functionality

Let's get started!
`);

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function runCommand(command, description) {
  console.log(`\n⏳ ${description}...`);
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
      } else {
        console.log(`✅ ${description} completed!`);
        if (stdout) console.log(stdout);
        resolve(stdout);
      }
    });
  });
}

async function setupDemo() {
  try {
    console.log('\n📋 Step 1: System Setup');
    console.log('========================');
    
    // Check if node_modules exists
    if (!fs.existsSync('./node_modules')) {
      await runCommand('npm install', 'Installing dependencies');
    } else {
      console.log('✅ Dependencies already installed');
    }
    
    // Setup database
    if (!fs.existsSync('./data/school.db')) {
      await runCommand('node setup-complete-schema.js', 'Setting up database');
    } else {
      console.log('✅ Database already configured');
    }
    
    console.log('\n🎨 Step 2: School Branding');
    console.log('===========================');
    
    const schoolChoice = await question(`
Choose a school theme for the demo:
1. Greenwood High School (Blue theme)
2. Riverside Academy (Green theme)  
3. Summit Preparatory School (Red theme)
4. Keep current configuration

Enter your choice (1-4): `);
    
    const themeMap = {
      '1': 'greenwood',
      '2': 'riverside', 
      '3': 'summit'
    };
    
    if (themeMap[schoolChoice]) {
      await runCommand(`node branding-demo.js ${themeMap[schoolChoice]}`, 'Applying school branding');
    }
    
    console.log('\n🚀 Step 3: Starting the Server');
    console.log('===============================');
    
    const startServer = await question('Start the AutoM8 server now? (y/n): ');
    
    if (startServer.toLowerCase() === 'y') {
      console.log(`
🎉 Starting AutoM8 Server...

The server will start on http://localhost:3000

Once started, you can:
📱 Open http://localhost:3000 in your browser
👤 Login with demo credentials:
   - Admin: admin@school.edu / admin123
   - Teacher: teacher@school.edu / teacher123
   - Student: student@school.edu / student123

🔧 Access the admin panel at: http://localhost:3000/admin.html

Press Ctrl+C to stop the server when you're done.
`);
      
      // Start the server
      const server = exec('npm start');
      
      server.stdout.on('data', (data) => {
        console.log(data);
      });
      
      server.stderr.on('data', (data) => {
        console.error(data);
      });
      
      // Open browser after a short delay
      setTimeout(() => {
        const platform = process.platform;
        const openCommand = platform === 'win32' ? 'start' : 
                           platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${openCommand} http://localhost:3000`);
      }, 3000);
      
    } else {
      console.log('\n✅ Setup complete! You can start the server anytime with: npm start');
    }
    
  } catch (error) {
    console.error('\n❌ Demo setup failed:', error.message);
  }
}

async function showSystemInfo() {
  console.log(`
📊 AutoM8 System Information
============================

🏗️  Architecture: Node.js + Express + SQLite + Socket.IO
📱 Frontend: Responsive HTML5/CSS3/JavaScript
🔒 Security: JWT Authentication + Role-based Access
📧 Email: Nodemailer integration
⚡ Real-time: WebSocket notifications
🎨 Branding: Fully customizable themes

📁 Key Files:
   - index.js (Main server)
   - frontend/ (All web pages)
   - routes/ (API endpoints)
   - db/schema.sql (Database structure)
   - frontend/assets/school-config.js (Branding)

🔧 Main Features:
   ✅ User Management (Students, Teachers, Parents, Admins)
   ✅ Assignment System (Create, Submit, Grade)
   ✅ Real-time Notifications
   ✅ Email System
   ✅ Attendance Tracking
   ✅ Grade Management
   ✅ Admin Panel
   ✅ Mobile Responsive
   ✅ School Branding
   ✅ File Upload Support

📚 Documentation:
   - SYSTEM-OVERVIEW.md (Complete system guide)
   - SCHOOL-CUSTOMIZATION-GUIDE.md (Branding instructions)
   - FINAL-COMPLETION-REPORT.md (Project completion)
   - API-TESTING.md (API documentation)
`);
}

async function main() {
  const action = await question(`
What would you like to do?
1. 🚀 Quick Demo Setup (Recommended)
2. 📊 View System Information
3. 🎨 Change School Branding Only
4. 🏃 Start Server Only
5. 📖 View Documentation
6. ❌ Exit

Enter your choice (1-6): `);
  
  switch(action) {
    case '1':
      await setupDemo();
      break;
      
    case '2':
      showSystemInfo();
      break;
      
    case '3':
      console.log('\nAvailable themes: greenwood, riverside, summit');
      const theme = await question('Enter theme name: ');
      try {
        await runCommand(`node branding-demo.js ${theme}`, 'Applying branding');
      } catch (error) {
        console.log('❌ Invalid theme or error occurred');
      }
      break;
      
    case '4':
      console.log('\n🚀 Starting server...');
      exec('npm start');
      break;
      
    case '5':
      console.log(`
📖 Available Documentation:
   - SYSTEM-OVERVIEW.md (Complete guide)
   - SCHOOL-CUSTOMIZATION-GUIDE.md (Branding)
   - FINAL-COMPLETION-REPORT.md (Project status)
   - NEXT-STEPS-GUIDE.md (Future enhancements)
`);
      break;
      
    case '6':
      console.log('\n👋 Thanks for using AutoM8! Goodbye!');
      rl.close();
      return;
      
    default:
      console.log('❌ Invalid choice');
  }
  
  // Ask if user wants to do something else
  const continueDemo = await question('\nWould you like to do something else? (y/n): ');
  if (continueDemo.toLowerCase() === 'y') {
    await main();
  } else {
    console.log('\n🎓 AutoM8 Demo Complete! Have a great day!');
    rl.close();
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

// Start the demo
main().catch(error => {
  console.error('Demo error:', error);
  rl.close();
});
