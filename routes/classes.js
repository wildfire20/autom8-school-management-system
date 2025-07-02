const express = require('express');
const router = express.Router();
const pool = require('../db');
const { 
  authenticateToken, 
  requireRole, 
  requireSameSchool, 
  requireGradeAccess, 
  requireContentModifyAccess 
} = require('../middleware/auth');

// 📚 CREATE CLASS (teachers and admins with content modify access)
router.post('/', authenticateToken, requireRole(['teacher', 'admin']), requireContentModifyAccess, async (req, res) => {
  const { name, description, subject, grade_level, section, room_number, max_students, class_code } = req.body;
  const { school_id, id: teacher_id, role } = req.user;

  if (!name || !subject || !grade_level) {
    return res.status(400).json({ error: 'Name, subject, and grade level are required' });
  }

  try {
    // Generate class code if not provided
    const finalClassCode = class_code || `${subject.toUpperCase()}-${grade_level}${section ? section : ''}-${new Date().getFullYear()}`;

    // Check for duplicate class code
    const existingClass = await pool.query(`
      SELECT id FROM classes WHERE class_code = $1 AND school_id = $2
    `, [finalClassCode, school_id]);

    if (existingClass.rows.length > 0) {
      return res.status(400).json({ error: 'Class code already exists' });
    }

    const result = await pool.query(`
      INSERT INTO classes (
        name, description, subject, grade_level, section, room_number, 
        max_students, class_code, teacher_id, school_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `, [
      name, description, subject, grade_level, section, room_number, 
      max_students || 30, finalClassCode, teacher_id, school_id
    ]);

    res.status(201).json({
      message: 'Class created successfully',
      class: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// 📋 GET ALL CLASSES FOR SCHOOL (with role-based filtering)
router.get('/', authenticateToken, async (req, res) => {
  const { school_id, role, id: user_id, grade_level: user_grade } = req.user;
  const { teacher_id, subject, grade_level, section } = req.query;

  try {
    let query = `
      SELECT c.*, u.full_name as teacher_name, 
             COUNT(ce.student_id) as enrolled_students,
             c.max_students
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.enrollment_status = 'active'
      WHERE c.school_id = $1 AND c.is_active = true
    `;
    let params = [school_id];

    // Role-based filtering
    if (role === 'teacher') {
      // Teachers see only their classes
      query += ` AND c.teacher_id = $${params.length + 1}`;
      params.push(user_id);
    } else if (role === 'student') {
      // Students see only classes they're enrolled in
      query += ` AND EXISTS (
        SELECT 1 FROM class_enrollments ce2 
        WHERE ce2.class_id = c.id AND ce2.student_id = $${params.length + 1} 
        AND ce2.enrollment_status = 'active'
      )`;
      params.push(user_id);
    } else if (role === 'parent') {
      // Parents see classes their children are enrolled in
      query += ` AND EXISTS (
        SELECT 1 FROM class_enrollments ce2 
        JOIN parent_student_links psl ON ce2.student_id = psl.student_id
        WHERE ce2.class_id = c.id AND psl.parent_id = $${params.length + 1} 
        AND ce2.enrollment_status = 'active'
      )`;
      params.push(user_id);
    }
    // Admins see all classes (no additional filter)

    // Additional filters
    if (teacher_id) {
      query += ` AND c.teacher_id = $${params.length + 1}`;
      params.push(teacher_id);
    }

    if (subject) {
      query += ` AND c.subject = $${params.length + 1}`;
      params.push(subject);
    }

    if (grade_level) {
      query += ` AND c.grade_level = $${params.length + 1}`;
      params.push(grade_level);
    }

    if (section) {
      query += ` AND c.section = $${params.length + 1}`;
      params.push(section);
    }

    query += ` GROUP BY c.id, u.full_name ORDER BY c.grade_level, c.section, c.subject, c.name`;

    const result = await pool.query(query, params);
    res.json({ classes: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// 📚 GET CLASSES BY GRADE LEVEL (with grade access control)
router.get('/grade/:grade_level', authenticateToken, requireGradeAccess, async (req, res) => {
  const { grade_level } = req.params;
  const { section } = req.query;
  const { school_id, role, id: user_id } = req.user;

  try {
    let query = `
      SELECT c.*, u.full_name as teacher_name, 
             COUNT(ce.student_id) as enrolled_students,
             c.max_students
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.enrollment_status = 'active'
      WHERE c.school_id = $1 AND c.grade_level = $2 AND c.is_active = true
    `;
    let params = [school_id, grade_level];

    if (section) {
      query += ` AND c.section = $${params.length + 1}`;
      params.push(section);
    }

    // Filter based on role
    if (role === 'teacher') {
      query += ` AND c.teacher_id = $${params.length + 1}`;
      params.push(user_id);
    } else if (role === 'student') {
      query += ` AND EXISTS (
        SELECT 1 FROM class_enrollments ce2 
        WHERE ce2.class_id = c.id AND ce2.student_id = $${params.length + 1} 
        AND ce2.enrollment_status = 'active'
      )`;
      params.push(user_id);
    } else if (role === 'parent') {
      query += ` AND EXISTS (
        SELECT 1 FROM class_enrollments ce2 
        JOIN parent_student_links psl ON ce2.student_id = psl.student_id
        WHERE ce2.class_id = c.id AND psl.parent_id = $${params.length + 1} 
        AND ce2.enrollment_status = 'active'
      )`;
      params.push(user_id);
    }

    query += ` GROUP BY c.id, u.full_name ORDER BY c.section, c.subject, c.name`;

    const result = await pool.query(query, params);
    res.json({ classes: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes by grade level' });
  }
});

// 👥 ENROLL STUDENT IN CLASS
router.post('/:id/enroll', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  const { id: class_id } = req.params;
  const { student_id } = req.body;
  const { school_id } = req.user;

  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  try {
    // Verify class belongs to same school
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND school_id = $2',
      [class_id, school_id]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Verify student exists and belongs to same school
    const studentCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND school_id = $2 AND role = $3',
      [student_id, school_id, 'student']
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT * FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
      [class_id, student_id]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(409).json({ error: 'Student already enrolled in this class' });
    }

    // Enroll student
    await pool.query(
      'INSERT INTO class_enrollments (class_id, student_id, enrolled_at) VALUES ($1, $2, NOW())',
      [class_id, student_id]
    );

    res.json({ message: `Student enrolled successfully in ${classCheck.rows[0].name}` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// 📝 GET CLASS ROSTER
router.get('/:id/students', authenticateToken, async (req, res) => {
  const { id: class_id } = req.params;
  const { school_id } = req.user;

  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.student_number, ce.enrolled_at
      FROM class_enrollments ce
      JOIN users u ON ce.student_id = u.id
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.class_id = $1 AND c.school_id = $2
      ORDER BY u.full_name
    `, [class_id, school_id]);

    res.json({ students: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch class roster' });
  }
});

// 🎓 GET MY CLASSES (for students)
router.get('/my-classes', authenticateToken, requireRole('student'), async (req, res) => {
  const { id: student_id, school_id } = req.user;

  try {
    const result = await pool.query(`
      SELECT c.*, u.full_name as teacher_name, ce.enrolled_at
      FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE ce.student_id = $1 AND c.school_id = $2
      ORDER BY c.name
    `, [student_id, school_id]);

    res.json({ classes: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your classes' });
  }
});

module.exports = router;
