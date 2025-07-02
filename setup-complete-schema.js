/**
 * Complete Database Schema for AutoM8 School Management System
 */

const pool = require('./db');

async function createCompleteSchema() {
  console.log('🗄️ Creating complete AutoM8 database schema...');
  
  try {
    // Drop existing tables in reverse order
    await pool.query('DROP TABLE IF EXISTS notification_recipients CASCADE;');
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE;');
    await pool.query('DROP TABLE IF EXISTS parent_student_links CASCADE;');
    await pool.query('DROP TABLE IF EXISTS grades CASCADE;');
    await pool.query('DROP TABLE IF EXISTS gradebook_entries CASCADE;');
    await pool.query('DROP TABLE IF EXISTS attendance CASCADE;');
    await pool.query('DROP TABLE IF EXISTS submissions CASCADE;');
    await pool.query('DROP TABLE IF EXISTS assignments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS class_enrollments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS classes CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    await pool.query('DROP TABLE IF EXISTS schools CASCADE;');
    
    console.log('✅ Dropped existing tables');

    // Create schools table
    await pool.query(`
      CREATE TABLE schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        subscription_plan VARCHAR(50) DEFAULT 'basic',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table (enhanced)
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        student_number VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
        school_id INTEGER REFERENCES schools(id),
        profile_picture_url TEXT,
        phone_number VARCHAR(50),
        address TEXT,
        date_of_birth DATE,
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create classes table (enhanced)
    await pool.query(`
      CREATE TABLE classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        subject VARCHAR(100) NOT NULL,
        grade_level VARCHAR(50),
        room_number VARCHAR(50),
        teacher_id INTEGER REFERENCES users(id),
        school_id INTEGER REFERENCES schools(id),
        max_students INTEGER DEFAULT 30,
        schedule_days VARCHAR(50), -- e.g., 'Mon,Wed,Fri'
        schedule_time VARCHAR(50), -- e.g., '09:00-10:00'
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create class_enrollments table
    await pool.query(`
      CREATE TABLE class_enrollments (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(class_id, student_id)
      );
    `);

    // Create assignments table (enhanced)
    await pool.query(`
      CREATE TABLE assignments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        instructions TEXT,
        due_date TIMESTAMP NOT NULL,
        max_score INTEGER DEFAULT 100,
        assignment_type VARCHAR(50) DEFAULT 'homework', -- homework, quiz, exam, project
        teacher_id INTEGER REFERENCES users(id),
        school_id INTEGER REFERENCES schools(id),
        class_id INTEGER REFERENCES classes(id),
        attachment_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create submissions table (enhanced)
    await pool.query(`
      CREATE TABLE submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        file_url TEXT,
        score INTEGER,
        feedback TEXT,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
        submitted_at TIMESTAMP,
        graded_at TIMESTAMP,
        returned_at TIMESTAMP,
        late_submission BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(assignment_id, student_id)
      );
    `);

    // Create attendance table
    await pool.query(`
      CREATE TABLE attendance (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
        notes TEXT,
        marked_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class_id, student_id, date)
      );
    `);

    // Create gradebook_entries table
    await pool.query(`
      CREATE TABLE gradebook_entries (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL, -- homework, quiz, exam, participation, etc.
        name VARCHAR(255) NOT NULL,
        description TEXT,
        max_points INTEGER NOT NULL,
        weight DECIMAL(5,2) DEFAULT 1.0, -- For weighted grades
        date DATE NOT NULL,
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
        feedback TEXT,
        is_excused BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(gradebook_entry_id, student_id)
      );
    `);

    // Create parent_student_links table
    await pool.query(`
      CREATE TABLE parent_student_links (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        relationship VARCHAR(50) NOT NULL, -- father, mother, guardian, etc.
        is_primary_contact BOOLEAN DEFAULT false,
        can_pickup BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parent_id, student_id)
      );
    `);

    // Create notifications table
    await pool.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'general', -- general, announcement, alert, reminder
        priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
        sender_id INTEGER REFERENCES users(id),
        school_id INTEGER REFERENCES schools(id),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create notification_recipients table
    await pool.query(`
      CREATE TABLE notification_recipients (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
        recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(notification_id, recipient_id)
      );
    `);

    // Create indexes for performance
    await pool.query('CREATE INDEX idx_users_email ON users(email);');
    await pool.query('CREATE INDEX idx_users_school_role ON users(school_id, role);');
    await pool.query('CREATE INDEX idx_classes_school_teacher ON classes(school_id, teacher_id);');
    await pool.query('CREATE INDEX idx_assignments_class_due ON assignments(class_id, due_date);');
    await pool.query('CREATE INDEX idx_submissions_assignment_student ON submissions(assignment_id, student_id);');
    await pool.query('CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);');
    await pool.query('CREATE INDEX idx_grades_student ON grades(student_id);');
    await pool.query('CREATE INDEX idx_notifications_recipient ON notification_recipients(recipient_id, read_at);');

    console.log('✅ All tables created successfully!');

    // Insert demo data
    await pool.query(`
      INSERT INTO schools (name, contact_email, address) 
      VALUES ('Demo High School', 'admin@demoschool.edu', '123 Education Street, Learning City, LC 12345');
    `);

    console.log('✅ Demo school created');
    console.log('🎉 Complete database schema is ready!');
    
  } catch (err) {
    console.error('❌ Schema creation failed:', err.message);
  } finally {
    await pool.end();
  }
}

createCompleteSchema();
