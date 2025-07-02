# School Customization Guide for AutoM8 School Management System

## Quick Start: Customizing for Your School

### Step 1: Update School Identity

Edit `frontend/assets/school-config.js`:

```javascript
const SCHOOL_CONFIG = {
  // Update these with your school's information
  schoolName: "Your School Name",
  schoolSlogan: "Your School Slogan",
  schoolMotto: "Your School Motto",
  
  // Contact details
  address: "Your School Address",
  phone: "Your Phone Number",
  email: "your-email@school.edu",
  website: "www.yourschool.edu",
  
  // Academic year
  academicYear: "2024-2025",
  semester: "Current Semester"
}
```

### Step 2: Add Your School Logo

1. **Prepare your logo image:**
   - Recommended size: 200x80 pixels
   - Format: PNG with transparent background
   - Name it: `school-logo.png`

2. **Place the logo:**
   - Copy your logo to: `frontend/assets/school-logo.png`
   - Update the config if using a different name:
     ```javascript
     logoUrl: "/assets/your-logo-name.png"
     ```

### Step 3: Customize Colors

Update the color scheme in `school-config.js`:

```javascript
// Color Scheme - Use your school colors
primaryColor: "#your-primary-color",      // Main brand color
secondaryColor: "#your-secondary-color",  // Accent color
```

**Color Examples:**
- Blue theme: `primaryColor: "#0066cc", secondaryColor: "#004499"`
- Green theme: `primaryColor: "#28a745", secondaryColor: "#1e7e34"`
- Red theme: `primaryColor: "#dc3545", secondaryColor: "#c82333"`

### Step 4: Configure Academic Settings

```javascript
// Customize grading scale if needed
gradingScale: {
  A: { min: 90, max: 100, gpa: 4.0 },
  B: { min: 80, max: 89, gpa: 3.0 },
  // Add or modify grades as per your system
}
```

### Step 5: Email Configuration

Update email settings in the main server configuration:

1. **Edit email credentials** (contact your IT administrator):
   - Gmail, Outlook, or your school's email server
   - Update `utils/emailService.js` with proper credentials

2. **Customize email signature** in `school-config.js`:
   ```javascript
   emailSignature: `
     <div style="margin-top: 20px;">
       <p><strong>Your School Name</strong></p>
       <p>Your Address | Your Phone | your-email@school.edu</p>
     </div>
   `
   ```

## Advanced Customization

### Custom CSS Styling

Create a custom CSS file for additional styling:

1. Create `frontend/assets/custom-school-styles.css`
2. Add school-specific styles:
   ```css
   /* Your school's custom styles */
   .header {
     background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
   }
   
   .school-logo {
     max-height: 60px;
     width: auto;
   }
   ```

3. Include it in your HTML pages:
   ```html
   <link rel="stylesheet" href="/assets/custom-school-styles.css">
   ```

### Database Customization

For school-specific data setup:

1. **Run the setup script:**
   ```bash
   node setup-complete-schema.js
   ```

2. **Add initial data** (teachers, classes, subjects):
   - Use the admin panel at `/admin.html`
   - Or modify `setup-database.js` with your data

### Multi-School Configuration

For managing multiple schools with one system:

1. **Add school identification** to the database
2. **Modify authentication** to include school context
3. **Create school-specific configurations**

## Testing Your Customization

### 1. Start the Server
```bash
npm start
```

### 2. Test Pages
- Visit `http://localhost:3000` to see the main page
- Check logo, colors, and school name display
- Test login functionality
- Verify email notifications work

### 3. Admin Panel Testing
- Login as admin at `http://localhost:3000/admin.html`
- Test user management features
- Verify analytics and reports

## Deployment Checklist

Before going live with your customized system:

- [ ] Updated all school information in `school-config.js`
- [ ] Added school logo and favicon
- [ ] Configured email settings with valid credentials
- [ ] Tested all features with sample data
- [ ] Set up proper database backups
- [ ] Configured SSL certificates for production
- [ ] Updated default admin credentials
- [ ] Trained staff on system usage

## Support and Maintenance

### Regular Maintenance Tasks:
1. **Database backups** (weekly recommended)
2. **System updates** (check for security updates)
3. **User account management** (add/remove users)
4. **Performance monitoring** (check logs for errors)

### Common Customization Requests:
- **Additional grade levels or subjects**
- **Custom report formats**
- **Integration with existing school systems**
- **Mobile app development**

For technical support or advanced customizations, contact your system administrator or development team.
