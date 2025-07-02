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

// 📊 MARK ATTENDANCE (teachers only with content modify access)
router.post('/', authenticateToken, requireRole('teacher'), requireContentModifyAccess, async (req, res) => {
  const { class_id, attendance_records, date, grade_level } = req.body;
  const { school_id, id: teacher_id } = req.user;

  if (!class_id || !attendance_records || !Array.isArray(attendance_records) || !grade_level) {
    return res.status(400).json({ 
      error: 'Class ID, attendance records array, and grade level are required' 
    });
  }

  const attendanceDate = date ? new Date(date) : new Date();

  try {
    // Verify teacher owns this class and has access to the grade level
    const classCheck = await pool.query(`
      SELECT * FROM classes 
      WHERE id = $1 AND teacher_id = $2 AND school_id = $3 AND grade_level = $4 AND is_active = true
    `, [class_id, teacher_id, school_id, grade_level]);

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ 
        error: 'You can only take attendance for your own classes and assigned grade levels' 
      });
    }

    // Begin transaction
    await pool.query('BEGIN');

    // Delete existing attendance for this date and class
    await pool.query(
      'DELETE FROM attendance WHERE class_id = $1 AND DATE(date) = DATE($2)',
      [class_id, attendanceDate]
    );

    // Insert new attendance records
    for (const record of attendance_records) {
      const { student_id, status, notes } = record;
      
      // Verify student is enrolled in this class
      const enrollmentCheck = await pool.query(`
        SELECT 1 FROM class_enrollments 
        WHERE class_id = $1 AND student_id = $2 AND enrollment_status = 'active'
      `, [class_id, student_id]);

      if (enrollmentCheck.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Student ${student_id} is not enrolled in this class` 
        });
      }
      
      await pool.query(`
        INSERT INTO attendance (class_id, student_id, date, status, notes, marked_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [class_id, student_id, attendanceDate, status, notes || null, teacher_id]);
    }

    await pool.query('COMMIT');

    res.json({
      message: `Attendance marked for ${attendance_records.length} students`,
      date: attendanceDate.toISOString().split('T')[0]
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// 📅 GET ATTENDANCE FOR CLASS
router.get('/class/:class_id', authenticateToken, async (req, res) => {
  const { class_id } = req.params;
  const { school_id } = req.user;
  const { date, start_date, end_date } = req.query;

  try {
    // Verify access to class
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND school_id = $2',
      [class_id, school_id]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    let query = `
      SELECT a.*, u.full_name as student_name, u.student_number
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.class_id = $1
    `;
    let params = [class_id];
    let paramCount = 1;

    // Add date filters
    if (date) {
      query += ` AND DATE(a.date) = DATE($${++paramCount})`;
      params.push(date);
    } else if (start_date && end_date) {
      query += ` AND DATE(a.date) BETWEEN DATE($${++paramCount}) AND DATE($${++paramCount})`;
      params.push(start_date, end_date);
    }

    query += ` ORDER BY a.date DESC, u.full_name`;

    const result = await pool.query(query, params);

    res.json({
      class_name: classCheck.rows[0].name,
      attendance: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// 📈 GET ATTENDANCE SUMMARY
router.get('/summary/:student_id', authenticateToken, async (req, res) => {
  const { student_id } = req.params;
  const { school_id, role, id: user_id } = req.user;
  const { start_date, end_date } = req.query;

  // Students can only view their own attendance
  if (role === 'student' && parseInt(student_id) !== user_id) {
    return res.status(403).json({ error: 'You can only view your own attendance' });
  }

  try {
    // Verify student belongs to same school
    const studentCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND school_id = $2',
      [student_id, school_id]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let query = `
      SELECT 
        c.name as class_name,
        COUNT(*) as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as attendance_percentage
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      WHERE a.student_id = $1 AND c.school_id = $2
    `;
    let params = [student_id, school_id];
    let paramCount = 2;

    if (start_date) {
      query += ` AND DATE(a.date) >= DATE($${++paramCount})`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND DATE(a.date) <= DATE($${++paramCount})`;
      params.push(end_date);
    }

    query += ` GROUP BY c.id, c.name ORDER BY c.name`;

    const result = await pool.query(query, params);

    res.json({
      student_name: studentCheck.rows[0].full_name,
      attendance_summary: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// 📊 GET ATTENDANCE BY GRADE LEVEL (with grade access control)
router.get('/grade/:grade_level', authenticateToken, requireGradeAccess, async (req, res) => {
  const { grade_level } = req.params;
  const { section, date_from, date_to, class_id } = req.query;
  const { school_id, role, id: user_id } = req.user;

  try {
    let query = `
      SELECT a.*, c.name as class_name, c.subject, c.grade_level, c.section,
             u.full_name as student_name, u.student_number,
             t.full_name as teacher_name
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      JOIN users u ON a.student_id = u.id
      JOIN users t ON c.teacher_id = t.id
      WHERE c.school_id = $1 AND c.grade_level = $2 AND c.is_active = true
    `;
    let params = [school_id, grade_level];

    if (section) {
      query += ` AND c.section = $${params.length + 1}`;
      params.push(section);
    }

    if (class_id) {
      query += ` AND c.id = $${params.length + 1}`;
      params.push(class_id);
    }

    if (date_from) {
      query += ` AND a.date >= $${params.length + 1}`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND a.date <= $${params.length + 1}`;
      params.push(date_to);
    }

    // Filter based on role
    if (role === 'teacher') {
      query += ` AND c.teacher_id = $${params.length + 1}`;
      params.push(user_id);
    } else if (role === 'student') {
      query += ` AND a.student_id = $${params.length + 1}`;
      params.push(user_id);
    } else if (role === 'parent') {
      query += ` AND EXISTS (
        SELECT 1 FROM parent_student_links psl 
        WHERE psl.parent_id = $${params.length + 1} AND psl.student_id = a.student_id
      )`;
      params.push(user_id);
    }

    query += ` ORDER BY a.date DESC, c.subject, u.full_name`;

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance by grade level' });
  }
});

// 📊 GET STUDENT ATTENDANCE (for students and parents)
router.get('/student/:student_id', authenticateToken, async (req, res) => {
  const { student_id } = req.params;
  const { school_id, role, id: user_id } = req.user;
  const { date_from, date_to, subject } = req.query;

  try {
    // Check access permissions
    if (role === 'student') {
      if (parseInt(student_id) !== user_id) {
        return res.status(403).json({ error: 'You can only view your own attendance' });
      }
    } else if (role === 'parent') {
      const childCheck = await pool.query(`
        SELECT 1 FROM parent_student_links 
        WHERE parent_id = $1 AND student_id = $2
      `, [user_id, student_id]);

      if (childCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You can only view your children\'s attendance' });
      }
    } else if (role === 'teacher') {
      const studentClassCheck = await pool.query(`
        SELECT 1 FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.id
        WHERE ce.student_id = $1 AND c.teacher_id = $2 AND c.school_id = $3
      `, [student_id, user_id, school_id]);

      if (studentClassCheck.rows.length === 0) {
        return res.status(403).json({ 
          error: 'You can only view attendance for students in your classes' 
        });
      }
    }

    let query = `
      SELECT a.*, c.name as class_name, c.subject, c.grade_level,
             t.full_name as teacher_name
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      JOIN users t ON c.teacher_id = t.id
      WHERE a.student_id = $1 AND c.school_id = $2
    `;
    let params = [student_id, school_id];

    if (date_from) {
      query += ` AND a.date >= $${params.length + 1}`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND a.date <= $${params.length + 1}`;
      params.push(date_to);
    }

    if (subject) {
      query += ` AND c.subject = $${params.length + 1}`;
      params.push(subject);
    }

    query += ` ORDER BY a.date DESC, c.subject`;

    const attendance = await pool.query(query, params);

    // Get attendance statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as days_present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as days_absent,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as days_late,
        ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END)::float / COUNT(*)::float * 100), 2) as attendance_rate
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      WHERE a.student_id = $1 AND c.school_id = $2
        ${date_from ? 'AND a.date >= $3' : ''}
        ${date_to ? `AND a.date <= $${date_from ? '4' : '3'}` : ''}
    `, [student_id, school_id, ...(date_from ? [date_from] : []), ...(date_to ? [date_to] : [])]);

    res.json({
      attendance: attendance.rows,
      statistics: stats.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student attendance' });
  }
});

module.exports = router;
