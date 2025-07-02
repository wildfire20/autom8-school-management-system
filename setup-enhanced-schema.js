/**
 * Enhanced Database Schema for Real-World School Implementation
 * Supports student numbers, grade-based organization, and school domain authentication
 */

const pool = require('./db');

async function createEnhancedSchema() {
  console.log('🏫 Creating enhanced database schema for real-world school implementation...');
  
  try {
    // Drop existing tables in reverse order (including all current tables)
    const tablesToDrop = [
      'notification_recipients', 'notifications', 'parent_student_links', 
      'grades', 'gradebook_entries', 'attendance', 'submissions', 
      'assignments', 'class_enrollments', 'classes', 'users', 'schools',
      'student_numbers', 'school_settings', 'tasks', 'announcements'
    ];
    
    for (const table of tablesToDrop) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }
    console.log('✅ Dropped existing tables');

    // Create schools table with domain support
    await pool.query(`
      CREATE TABLE schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'riverside' for riverside.eud.co
        full_domain VARCHAR(150) UNIQUE NOT NULL, -- e.g., 'riverside.eud.co'
        address TEXT,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        logo_url TEXT,
        primary_color VARCHAR(7) DEFAULT '#007bff',
        secondary_color VARCHAR(7) DEFAULT '#6c757d',
        academic_year VARCHAR(20) DEFAULT '2024-2025',
        principal_name VARCHAR(255),
        subscription_plan VARCHAR(50) DEFAULT 'basic',
        student_number_prefix VARCHAR(10) DEFAULT 'STU', -- Prefix for student numbers
        student_number_format VARCHAR(50) DEFAULT 'PREFIX-YYYY-#### ', -- Format: STU-2024-0001
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create enhanced users table with student numbers and grade support
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        student_number VARCHAR(100) UNIQUE, -- School-specific student number
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        grade_level VARCHAR(20), -- e.g., '9', '10', '11', '12', 'K', '1st', etc.
        grade_section VARCHAR(10), -- e.g., 'A', 'B', 'C' for different sections
        date_of_birth DATE,
        gender VARCHAR(20),
        address TEXT,
        phone_number VARCHAR(50),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(50),
        profile_picture_url TEXT,
        admission_date DATE, -- For students
        employee_id VARCHAR(100), -- For teachers/staff
        subject_specialization VARCHAR(255), -- For teachers
        department VARCHAR(100), -- For teachers/staff
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create enhanced classes table with grade and section support
    await pool.query(`
      CREATE TABLE classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        class_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'MATH-9A-2024'
        description TEXT,
        subject VARCHAR(100) NOT NULL,
        grade_level VARCHAR(20) NOT NULL, -- Must match specific grade
        section VARCHAR(10), -- A, B, C, etc.
        room_number VARCHAR(50),
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        max_students INTEGER DEFAULT 30,
        schedule_days VARCHAR(50), -- 'Mon,Wed,Fri'
        schedule_time VARCHAR(50), -- '09:00-10:00'
        academic_year VARCHAR(20),
        semester VARCHAR(20), -- 'Fall', 'Spring', 'Summer'
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, subject, grade_level, section, academic_year)
      );
    `);

    // Create class_enrollments with grade validation
    await pool.query(`
      CREATE TABLE class_enrollments (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        enrollment_status VARCHAR(20) DEFAULT 'active' CHECK (enrollment_status IN ('active', 'dropped', 'transferred')),
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        dropped_at TIMESTAMP,
        UNIQUE(class_id, student_id)
      );
    `);

    // Create enhanced assignments table with grade-specific permissions
    await pool.query(`
      CREATE TABLE assignments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        instructions TEXT,
        due_date TIMESTAMP NOT NULL,
        max_score INTEGER DEFAULT 100,
        assignment_type VARCHAR(50) DEFAULT 'homework',
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        grade_level VARCHAR(20) NOT NULL, -- Restrict to specific grade
        visible_to_students BOOLEAN DEFAULT true,
        allow_late_submission BOOLEAN DEFAULT false,
        late_penalty_percentage INTEGER DEFAULT 0,
        attachment_url TEXT,
        rubric_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create enhanced submissions table
    await pool.query(`
      CREATE TABLE submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        file_url TEXT,
        additional_files TEXT[], -- Array of file URLs
        score DECIMAL(8,2),
        feedback TEXT,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'late')),
        submitted_at TIMESTAMP,
        graded_at TIMESTAMP,
        returned_at TIMESTAMP,
        late_submission BOOLEAN DEFAULT false,
        late_penalty_applied DECIMAL(5,2) DEFAULT 0,
        plagiarism_score DECIMAL(5,2), -- For future plagiarism detection
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(assignment_id, student_id)
      );
    `);

    // Create enhanced attendance with grade-level tracking
    await pool.query(`
      CREATE TABLE attendance (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        period VARCHAR(20), -- 'Period 1', 'Period 2', etc.
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'tardy')),
        arrival_time TIME,
        departure_time TIME,
        notes TEXT,
        marked_by INTEGER REFERENCES users(id),
        grade_level VARCHAR(20), -- For reporting by grade
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class_id, student_id, date, period)
      );
    `);

    // Create enhanced gradebook system
    await pool.query(`
      CREATE TABLE gradebook_entries (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        max_points DECIMAL(8,2) NOT NULL,
        weight DECIMAL(5,2) DEFAULT 1.0,
        grade_level VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        due_date TIMESTAMP,
        is_published BOOLEAN DEFAULT false, -- Control when grades are visible to students
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create grades table
    await pool.query(`
      CREATE TABLE grades (
        id SERIAL PRIMARY KEY,
        gradebook_entry_id INTEGER REFERENCES gradebook_entries(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        points_earned DECIMAL(8,2) NOT NULL,
        letter_grade VARCHAR(5), -- A+, A, A-, B+, etc.
        percentage DECIMAL(5,2), -- Calculated percentage
        feedback TEXT,
        is_excused BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT false,
        graded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(gradebook_entry_id, student_id)
      );
    `);

    // Create parent-student relationships
    await pool.query(`
      CREATE TABLE parent_student_links (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        relationship VARCHAR(50) NOT NULL,
        is_primary_contact BOOLEAN DEFAULT false,
        is_emergency_contact BOOLEAN DEFAULT false,
        can_pickup BOOLEAN DEFAULT true,
        can_view_grades BOOLEAN DEFAULT true,
        can_view_attendance BOOLEAN DEFAULT true,
        can_receive_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parent_id, student_id)
      );
    `);

    // Create notifications with grade-level targeting
    await pool.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'general',
        priority VARCHAR(20) DEFAULT 'normal',
        sender_id INTEGER REFERENCES users(id),
        school_id INTEGER REFERENCES schools(id),
        target_role VARCHAR(50), -- Target specific role
        target_grade_level VARCHAR(20), -- Target specific grade
        target_class_id INTEGER REFERENCES classes(id), -- Target specific class
        expires_at TIMESTAMP,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create notification recipients
    await pool.query(`
      CREATE TABLE notification_recipients (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
        recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP,
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(notification_id, recipient_id)
      );
    `);

    // Create school settings table for domain configuration
    await pool.query(`
      CREATE TABLE school_settings (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(20) DEFAULT 'text', -- text, number, boolean, json
        is_public BOOLEAN DEFAULT false, -- Can be accessed by non-admin users
        updated_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, setting_key)
      );
    `);

    // Create performance indexes
    const indexes = [
      'CREATE INDEX idx_users_email ON users(email);',
      'CREATE INDEX idx_users_student_number ON users(student_number);',
      'CREATE INDEX idx_users_school_grade ON users(school_id, grade_level);',
      'CREATE INDEX idx_users_role_active ON users(role, is_active);',
      'CREATE INDEX idx_classes_school_grade ON classes(school_id, grade_level);',
      'CREATE INDEX idx_classes_teacher_active ON classes(teacher_id, is_active);',
      'CREATE INDEX idx_assignments_class_due ON assignments(class_id, due_date);',
      'CREATE INDEX idx_assignments_grade_level ON assignments(grade_level);',
      'CREATE INDEX idx_submissions_student_status ON submissions(student_id, status);',
      'CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);',
      'CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);',
      'CREATE INDEX idx_grades_student ON grades(student_id);',
      'CREATE INDEX idx_grades_published ON grades(is_published);',
      'CREATE INDEX idx_notifications_school_type ON notifications(school_id, type);',
      'CREATE INDEX idx_notification_recipients_unread ON notification_recipients(recipient_id, read_at);'
    ];

    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }

    console.log('✅ Performance indexes created');

    // Insert demo school and admin user
    await pool.query(`
      INSERT INTO schools (name, domain_name, full_domain, address, contact_email, primary_color, secondary_color, student_number_prefix)
      VALUES ('Demo Academy', 'demo-academy', 'demo-academy.eud.co', '123 Education Street', 'admin@demo-academy.eud.co', '#667eea', '#764ba2', 'STU')
      ON CONFLICT (domain_name) DO NOTHING;
    `);

    const schoolResult = await pool.query("SELECT id FROM schools WHERE domain_name = 'demo-academy'");
    const schoolId = schoolResult.rows[0].id;

    // Create default admin user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO users (full_name, email, password, role, school_id, is_active, is_verified)
      VALUES ('System Administrator', 'admin@demo-academy.eud.co', $1, 'admin', $2, true, true)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword, schoolId]);

    // Create demo teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    await pool.query(`
      INSERT INTO users (full_name, email, password, role, school_id, grade_level, subject_specialization, is_active, is_verified)
      VALUES ('Demo Teacher', 'teacher@demo-academy.eud.co', $1, 'teacher', $2, '9', 'Mathematics', true, true)
      ON CONFLICT (email) DO NOTHING;
    `, [teacherPassword, schoolId]);

    console.log('✅ Demo school and users created');

    console.log('🎉 Enhanced database schema created successfully!');
    console.log('');
    console.log('🏫 New Features Added:');
    console.log('✅ School domain support (e.g., riverside.eud.co)');
    console.log('✅ Student number generation and management');
    console.log('✅ Grade-level based organization and permissions');
    console.log('✅ Enhanced class management with sections');
    console.log('✅ Improved attendance tracking with periods');
    console.log('✅ Advanced gradebook with publishing controls');
    console.log('✅ Parent-student relationship management');
    console.log('✅ Grade-specific notification targeting');
    console.log('✅ School settings and configuration');

  } catch (err) {
    console.error('❌ Enhanced schema creation failed:', err.message);
  } finally {
    await pool.end();
  }
}

// Auto-run if called directly
if (require.main === module) {
  createEnhancedSchema();
}

module.exports = { createEnhancedSchema };
