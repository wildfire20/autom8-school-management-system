const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const { authenticateToken, requireRole } = require('../middleware/auth');
const StudentPasswordManager = require('../utils/studentPasswordManager');

// 📊 GET ADMIN DASHBOARD STATS
router.get('/dashboard/admin-stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE school_id = $1) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND school_id = $1) as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND school_id = $1) as total_teachers,
        (SELECT COUNT(*) FROM users WHERE role = 'parent' AND school_id = $1) as total_parents,
        (SELECT COUNT(*) FROM assignments WHERE school_id = $1) as total_assignments,
        (SELECT COUNT(*) FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.school_id = $1) as total_submissions
    `, [req.user.school_id]);

    res.json({ stats: stats.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// 👥 GET ALL USERS (admin only)
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, role, is_active, created_at
      FROM users 
      WHERE school_id = $1
      ORDER BY created_at DESC
    `, [req.user.school_id]);

    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ➕ CREATE USER (admin only)
router.post('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  const { full_name, email, role, password } = req.body;
  const { school_id } = req.user;

  if (!full_name || !email || !role || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!['student', 'teacher', 'parent', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique student/employee number
    const numberPrefix = role === 'student' ? 'STU' : role === 'teacher' ? 'TCH' : role === 'parent' ? 'PAR' : 'ADM';
    const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const uniqueNumber = `${numberPrefix}${Date.now().toString().slice(-6)}${randomNumber}`;

    const result = await pool.query(`
      INSERT INTO users (full_name, email, password, role, school_id, student_number, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, full_name, email, role, student_number, is_active, created_at
    `, [full_name, email, hashedPassword, role, school_id, uniqueNumber]);

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 🔧 UPDATE USER (admin only)
router.put('/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, is_active } = req.body;
  const { school_id } = req.user;

  try {
    const result = await pool.query(`
      UPDATE users 
      SET full_name = $1, email = $2, role = $3, is_active = $4
      WHERE id = $5 AND school_id = $6
      RETURNING id, full_name, email, role, is_active
    `, [full_name, email, role, is_active, id, school_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 🗑️ DELETE USER (admin only)
router.delete('/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { school_id } = req.user;

  try {
    // Don't allow deleting the current admin user
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(`
      DELETE FROM users 
      WHERE id = $1 AND school_id = $2
      RETURNING id, full_name
    `, [id, school_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 📈 SYSTEM USAGE REPORT
router.get('/reports/usage', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const report = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as daily_logins
      FROM auth_logs 
      WHERE school_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [req.user.school_id]);

    res.json({ report: report.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate usage report' });
  }
});

// 🔧 SYSTEM MAINTENANCE
router.post('/maintenance/optimize-db', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Run basic database optimization
    await pool.query('VACUUM ANALYZE');
    await pool.query('REINDEX DATABASE autom8_school');
    
    res.json({ message: 'Database optimization completed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database optimization failed' });
  }
});

// 📤 EXPORT USERS
router.get('/export/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT full_name, email, role, student_number, is_active, created_at
      FROM users 
      WHERE school_id = $1
      ORDER BY role, full_name
    `, [req.user.school_id]);

    // Convert to CSV format
    const csvHeader = 'Name,Email,Role,ID Number,Status,Created Date\n';
    const csvData = users.rows.map(user => 
      `"${user.full_name}","${user.email}","${user.role}","${user.student_number}","${user.is_active ? 'Active' : 'Inactive'}","${user.created_at}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
    res.send(csvHeader + csvData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// 🎓 STUDENT NUMBER MANAGEMENT

// Get all student numbers for the school
router.get('/student-numbers', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sn.*, u.full_name as assigned_user_name, u.email as assigned_user_email
      FROM student_numbers sn
      LEFT JOIN users u ON sn.assigned_user_id = u.id
      WHERE sn.school_id = $1
      ORDER BY sn.grade_level, sn.section, sn.student_number
    `, [req.user.school_id]);

    res.json({ student_numbers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student numbers' });
  }
});

// Generate student numbers for a grade/section
router.post('/student-numbers/generate', authenticateToken, requireRole('admin'), async (req, res) => {
  const { grade_level, section, count, prefix } = req.body;
  const { school_id } = req.user;

  if (!grade_level || !section || !count || count < 1 || count > 100) {
    return res.status(400).json({ error: 'Invalid parameters. Count must be between 1 and 100.' });
  }

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current year
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      
      // Get next sequential number for this grade/section
      const lastNumberResult = await client.query(`
        SELECT student_number FROM student_numbers 
        WHERE school_id = $1 AND grade_level = $2 AND section = $3
        ORDER BY student_number DESC LIMIT 1
      `, [school_id, grade_level, section]);
      
      let nextNumber = 1;
      if (lastNumberResult.rows.length > 0) {
        const lastNumber = lastNumberResult.rows[0].student_number;
        const lastSequence = parseInt(lastNumber.slice(-3)) || 0;
        nextNumber = lastSequence + 1;
      }
      
      const generatedNumbers = [];
      
      for (let i = 0; i < count; i++) {
        const sequenceNumber = (nextNumber + i).toString().padStart(3, '0');
        const studentNumber = `${prefix || 'STU'}${yearSuffix}${grade_level}${section}${sequenceNumber}`;
        
        await client.query(`
          INSERT INTO student_numbers (school_id, student_number, grade_level, section, is_active)
          VALUES ($1, $2, $3, $4, true)
        `, [school_id, studentNumber, grade_level, section]);
        
        generatedNumbers.push(studentNumber);
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: `Generated ${count} student numbers successfully`,
        student_numbers: generatedNumbers
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate student numbers' });
  }
});

// Assign student number to a user
router.post('/student-numbers/:studentNumber/assign', authenticateToken, requireRole('admin'), async (req, res) => {
  const { studentNumber } = req.params;
  const { user_id } = req.body;
  const { school_id } = req.user;

  try {
    // Verify the student number exists and is not assigned
    const studentNumberResult = await pool.query(`
      SELECT * FROM student_numbers 
      WHERE student_number = $1 AND school_id = $2 AND assigned_user_id IS NULL
    `, [studentNumber, school_id]);

    if (studentNumberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student number not found or already assigned' });
    }

    // Verify the user exists and is a student
    const userResult = await pool.query(`
      SELECT * FROM users 
      WHERE id = $1 AND school_id = $2 AND role = 'student'
    `, [user_id, school_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student user not found' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update student number assignment
      await client.query(`
        UPDATE student_numbers 
        SET assigned_user_id = $1, assigned_at = NOW()
        WHERE student_number = $2 AND school_id = $3
      `, [user_id, studentNumber, school_id]);
      
      // Update user with student number and grade info
      await client.query(`
        UPDATE users 
        SET student_number = $1, grade_level = $2, section = $3
        WHERE id = $4 AND school_id = $5
      `, [studentNumber, studentNumberResult.rows[0].grade_level, 
          studentNumberResult.rows[0].section, user_id, school_id]);
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Student number assigned successfully',
        assignment: {
          student_number: studentNumber,
          user_id: user_id,
          grade_level: studentNumberResult.rows[0].grade_level,
          section: studentNumberResult.rows[0].section
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign student number' });
  }
});

// Import student numbers from CSV
router.post('/student-numbers/import', authenticateToken, requireRole('admin'), async (req, res) => {
  const { csv_data } = req.body;
  const { school_id } = req.user;

  if (!csv_data) {
    return res.status(400).json({ error: 'CSV data is required' });
  }

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const lines = csv_data.trim().split('\n');
      const header = lines[0].toLowerCase();
      
      // Validate CSV format
      if (!header.includes('student_number') || !header.includes('grade_level')) {
        return res.status(400).json({ 
          error: 'Invalid CSV format. Required columns: student_number, grade_level, section' 
        });
      }
      
      const importedNumbers = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < 3) {
          errors.push(`Line ${i + 1}: Invalid format`);
          continue;
        }
        
        const [studentNumber, gradeLevel, section] = values;
        
        try {
          await client.query(`
            INSERT INTO student_numbers (school_id, student_number, grade_level, section, is_active)
            VALUES ($1, $2, $3, $4, true)
          `, [school_id, studentNumber, gradeLevel, section]);
          
          importedNumbers.push(studentNumber);
        } catch (error) {
          if (error.code === '23505') { // Duplicate key
            errors.push(`Line ${i + 1}: Student number ${studentNumber} already exists`);
          } else {
            errors.push(`Line ${i + 1}: ${error.message}`);
          }
        }
      }
      
      await client.query('COMMIT');
      
      res.json({
        message: `Import completed. ${importedNumbers.length} student numbers imported.`,
        imported_count: importedNumbers.length,
        errors: errors,
        imported_numbers: importedNumbers
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import student numbers' });
  }
});

// 🎓 ENHANCED STUDENT MANAGEMENT WITH AUTOMATIC PASSWORD GENERATION

// Register student with existing student number and auto-generated password
router.post('/students/register', authenticateToken, requireRole('admin'), async (req, res) => {
  const { student_number, full_name, grade_level, section, date_of_birth, address, parent_email } = req.body;
  const { school_id } = req.user;

  if (!student_number || !full_name || !grade_level || !section) {
    return res.status(400).json({ error: 'Student number, full name, grade level, and section are required' });
  }

  try {
    // Validate student number format
    if (!StudentPasswordManager.validateStudentNumber(student_number)) {
      return res.status(400).json({ error: 'Invalid student number format' });
    }

    // Parse student number to verify grade/section match
    const parsed = StudentPasswordManager.parseStudentNumber(student_number);
    if (parsed.grade !== grade_level.toString() || parsed.section !== section) {
      return res.status(400).json({ 
        error: 'Student number does not match provided grade/section' 
      });
    }

    // Check if student number already exists
    const existingStudent = await pool.query(
      'SELECT id FROM users WHERE student_number = $1',
      [student_number]
    );

    if (existingStudent.rows.length > 0) {
      return res.status(409).json({ error: 'Student number already registered' });
    }

    // Generate automatic password
    const generatedPassword = StudentPasswordManager.generatePassword(student_number);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert student
      const studentResult = await client.query(`
        INSERT INTO users (
          full_name, student_number, password, role, school_id, 
          grade_level, grade_section, date_of_birth, address, 
          is_active, is_verified
        ) VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, $8, true, true)
        RETURNING id, full_name, student_number, grade_level, grade_section, created_at
      `, [full_name, student_number, hashedPassword, school_id, grade_level, section, date_of_birth, address]);

      const student = studentResult.rows[0];

      // If parent email provided, create/link parent
      if (parent_email) {
        let parentId;
        
        // Check if parent already exists
        const existingParent = await client.query(
          'SELECT id FROM users WHERE email = $1 AND school_id = $2',
          [parent_email, school_id]
        );

        if (existingParent.rows.length > 0) {
          parentId = existingParent.rows[0].id;
        } else {
          // Create new parent account
          const parentPassword = StudentPasswordManager.generateTempPassword();
          const hashedParentPassword = await bcrypt.hash(parentPassword, 10);
          
          const parentResult = await client.query(`
            INSERT INTO users (
              full_name, email, password, role, school_id, is_active, is_verified
            ) VALUES ($1, $2, $3, 'parent', $4, true, true)
            RETURNING id
          `, [`Parent of ${full_name}`, parent_email, hashedParentPassword, school_id]);
          
          parentId = parentResult.rows[0].id;
        }

        // Link parent to student
        await client.query(`
          INSERT INTO parent_student_links (
            parent_id, student_id, relationship, is_primary_contact, 
            can_view_grades, can_view_attendance, can_receive_notifications
          ) VALUES ($1, $2, 'parent', true, true, true, true)
          ON CONFLICT (parent_id, student_id) DO NOTHING
        `, [parentId, student.id]);
      }

      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'Student registered successfully',
        student: student,
        generated_password: generatedPassword,
        login_instructions: {
          username: student_number,
          password: generatedPassword,
          note: 'Student should change password on first login'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Student registration error:', err);
    res.status(500).json({ error: 'Failed to register student' });
  }
});

// Bulk register students from CSV
router.post('/students/bulk-register', authenticateToken, requireRole('admin'), async (req, res) => {
  const { csv_data } = req.body;
  const { school_id } = req.user;

  if (!csv_data) {
    return res.status(400).json({ error: 'CSV data is required' });
  }

  try {
    const lines = csv_data.trim().split('\n');
    const header = lines[0].toLowerCase();
    
    // Validate CSV format
    const requiredColumns = ['student_number', 'full_name', 'grade_level', 'section'];
    const hasRequiredColumns = requiredColumns.every(col => header.includes(col));
    
    if (!hasRequiredColumns) {
      return res.status(400).json({ 
        error: `Invalid CSV format. Required columns: ${requiredColumns.join(', ')}` 
      });
    }

    const client = await pool.connect();
    const results = {
      successful: [],
      failed: [],
      passwords: {}
    };
    
    try {
      await client.query('BEGIN');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const [studentNumber, fullName, gradeLevel, section, dateOfBirth, address, parentEmail] = values;
          
          // Validate required fields
          if (!studentNumber || !fullName || !gradeLevel || !section) {
            results.failed.push(`Line ${i + 1}: Missing required fields`);
            continue;
          }
          
          // Validate student number format
          if (!StudentPasswordManager.validateStudentNumber(studentNumber)) {
            results.failed.push(`Line ${i + 1}: Invalid student number format`);
            continue;
          }
          
          // Check if already exists
          const existing = await client.query(
            'SELECT id FROM users WHERE student_number = $1',
            [studentNumber]
          );
          
          if (existing.rows.length > 0) {
            results.failed.push(`Line ${i + 1}: Student number ${studentNumber} already exists`);
            continue;
          }
          
          // Generate password and hash it
          const generatedPassword = StudentPasswordManager.generatePassword(studentNumber);
          const hashedPassword = await bcrypt.hash(generatedPassword, 10);
          
          // Insert student
          await client.query(`
            INSERT INTO users (
              full_name, student_number, password, role, school_id, 
              grade_level, grade_section, date_of_birth, address, 
              is_active, is_verified
            ) VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, $8, true, true)
          `, [fullName, studentNumber, hashedPassword, school_id, gradeLevel, section, dateOfBirth || null, address || null]);
          
          results.successful.push(studentNumber);
          results.passwords[studentNumber] = generatedPassword;
          
        } catch (error) {
          results.failed.push(`Line ${i + 1}: ${error.message}`);
        }
      }
      
      await client.query('COMMIT');
      
      res.json({
        message: `Bulk registration completed. ${results.successful.length} students registered, ${results.failed.length} failed.`,
        successful_count: results.successful.length,
        failed_count: results.failed.length,
        successful_students: results.successful,
        failed_registrations: results.failed,
        generated_passwords: results.passwords
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Bulk registration error:', err);
    res.status(500).json({ error: 'Failed to process bulk registration' });
  }
});

// Get students by grade and section
router.get('/students/by-grade/:grade/:section', authenticateToken, requireRole(['admin', 'teacher']), async (req, res) => {
  const { grade, section } = req.params;
  const { school_id } = req.user;

  try {
    const result = await pool.query(`
      SELECT 
        id, full_name, student_number, grade_level, grade_section,
        date_of_birth, address, is_active, created_at
      FROM users 
      WHERE role = 'student' 
        AND school_id = $1 
        AND grade_level = $2 
        AND grade_section = $3
      ORDER BY full_name
    `, [school_id, grade, section]);

    res.json({ 
      students: result.rows,
      count: result.rows.length,
      grade: grade,
      section: section
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Reset student password
router.post('/students/:studentId/reset-password', authenticateToken, requireRole('admin'), async (req, res) => {
  const { studentId } = req.params;
  const { school_id } = req.user;

  try {
    // Get student info
    const studentResult = await pool.query(`
      SELECT student_number, full_name FROM users 
      WHERE id = $1 AND school_id = $2 AND role = 'student'
    `, [studentId, school_id]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];
    
    // Generate new password
    const newPassword = StudentPasswordManager.generatePassword(student.student_number);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(`
      UPDATE users 
      SET password = $1, password_changed_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND school_id = $3
    `, [hashedPassword, studentId, school_id]);

    res.json({
      message: 'Password reset successfully',
      student_name: student.full_name,
      student_number: student.student_number,
      new_password: newPassword
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
