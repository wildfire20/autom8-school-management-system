const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const emailTemplates = {
  assignmentSubmitted: (teacherName, studentName, assignmentTitle) => ({
    subject: `New Assignment Submission - ${assignmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1>🎓 AutoM8 School Management</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>📝 New Assignment Submission</h2>
          <p>Dear ${teacherName},</p>
          <p><strong>${studentName}</strong> has submitted their assignment for:</p>
          <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin: 0; color: #333;">${assignmentTitle}</h3>
          </div>
          <p>You can review and grade the submission by logging into your AutoM8 dashboard.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/assignments.html" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">View Submissions</a>
          </div>
          <p style="color: #666; font-size: 14px;">This is an automated message from AutoM8 School Management System.</p>
        </div>
      </div>
    `
  }),

  assignmentGraded: (studentName, teacherName, assignmentTitle, score, feedback) => ({
    subject: `Assignment Graded - ${assignmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1>🎓 AutoM8 School Management</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>📊 Assignment Graded</h2>
          <p>Dear ${studentName},</p>
          <p><strong>${teacherName}</strong> has graded your assignment:</p>
          <div style="background: white; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${assignmentTitle}</h3>
            <div style="font-size: 24px; color: #28a745; font-weight: bold;">Score: ${score}/100</div>
            ${feedback ? `<div style="margin-top: 15px;"><strong>Feedback:</strong><p style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 5px 0;">${feedback}</p></div>` : ''}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/assignments.html" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">View Grade Details</a>
          </div>
          <p style="color: #666; font-size: 14px;">This is an automated message from AutoM8 School Management System.</p>
        </div>
      </div>
    `
  }),

  assignmentDueReminder: (studentName, assignmentTitle, dueDate) => ({
    subject: `Assignment Due Tomorrow - ${assignmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 20px; text-align: center;">
          <h1>🚨 AutoM8 Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>⏰ Assignment Due Tomorrow</h2>
          <p>Dear ${studentName},</p>
          <p>This is a friendly reminder that your assignment is due tomorrow:</p>
          <div style="background: white; padding: 15px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${assignmentTitle}</h3>
            <div style="color: #ff6b6b; font-weight: bold;">Due: ${dueDate}</div>
          </div>
          <p>Don't forget to submit your work on time!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/assignments.html" style="background: #ff6b6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Submit Assignment</a>
          </div>
          <p style="color: #666; font-size: 14px;">This is an automated reminder from AutoM8 School Management System.</p>
        </div>
      </div>
    `
  })
};

// Send email function
async function sendEmail(to, template, ...templateArgs) {
  try {
    // Skip email sending in development if credentials not configured
    if (process.env.NODE_ENV !== 'production' && (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com')) {
      console.log(`📧 Email would be sent to ${to}:`, template, templateArgs);
      return { success: true, message: 'Email simulated (dev mode)' };
    }

    const { subject, html } = emailTemplates[template](...templateArgs);
    
    const mailOptions = {
      from: `"AutoM8 School System" <${emailConfig.auth.user}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

// Batch email function for multiple recipients
async function sendBatchEmails(recipients, template, ...templateArgs) {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient, template, ...templateArgs);
    results.push({ recipient, ...result });
  }
  
  return results;
}

module.exports = {
  sendEmail,
  sendBatchEmails,
  emailTemplates
};
