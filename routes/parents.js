const express = require('express');
const router = express.Router();
const pool = require('../db');
const { 
  authenticateToken, 
  requireRole, 
  requireSameSchool, 
  requireGradeAccess 
} = require('../middleware/auth');

// 👨‍👩‍👧‍👦 LINK PARENT TO STUDENT
router.post('/link-student', authenticateToken, requireRole(['admin', 'parent']), async (req, res) => {
  const { student_id, parent_email, relationship } = req.body;
  const { school_id, role, id: requester_id } = req.user;

  if (!student_id || !parent_email || !relationship) {
    return res.status(400).json({ error: 'Student ID, parent email, and relationship are required' });
  }

  try {
    // Find or create parent user
    let parentResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND school_id = $2',
      [parent_email, school_id]
    );

    let parent_id;
    if (parentResult.rows.length === 0) {
      // Create parent account if it doesn't exist
      const newParent = await pool.query(`
        INSERT INTO users (full_name, email, password, role, school_id, created_at)
        VALUES ($1, $2, $3, 'parent', $4, NOW())
        RETURNING *
      `, [`Parent of Student ${student_id}`, parent_email, 'temp_password_change_required', school_id]);
      
      parent_id = newParent.rows[0].id;
    } else {
      parent_id = parentResult.rows[0].id;
    }

    // Verify student exists and belongs to same school
    const studentCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND school_id = $2 AND role = $3',
      [student_id, school_id, 'student']
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if relationship already exists
    const existingLink = await pool.query(
      'SELECT * FROM parent_student_links WHERE parent_id = $1 AND student_id = $2',
      [parent_id, student_id]
    );

    if (existingLink.rows.length > 0) {
      return res.status(409).json({ error: 'Parent-student relationship already exists' });
    }

    // Create parent-student link
    await pool.query(`
      INSERT INTO parent_student_links (parent_id, student_id, relationship, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [parent_id, student_id, relationship]);

    res.json({
      message: 'Parent-student relationship created successfully',
      parent_email,
      student_name: studentCheck.rows[0].full_name,
      relationship
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to link parent to student' });
  }
});

// 👨‍👩‍👧‍👦 GET MY CHILDREN (for parents)
router.get('/my-children', authenticateToken, requireRole('parent'), async (req, res) => {
  const { id: parent_id } = req.user;

  try {
    const result = await pool.query(`
      SELECT 
        u.*,
        psl.relationship,
        psl.created_at as linked_at
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      WHERE psl.parent_id = $1
      ORDER BY u.full_name
    `, [parent_id]);

    res.json({ children: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// 📊 GET CHILD'S ACADEMIC OVERVIEW
router.get('/child/:student_id/overview', authenticateToken, requireRole('parent'), async (req, res) => {
  const { student_id } = req.params;
  const { id: parent_id, school_id } = req.user;

  try {
    // Verify parent has access to this student
    const linkCheck = await pool.query(
      'SELECT * FROM parent_student_links WHERE parent_id = $1 AND student_id = $2',
      [parent_id, student_id]
    );

    if (linkCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this student' });
    }

    // Get student info
    const student = await pool.query(
      'SELECT id, full_name, student_number FROM users WHERE id = $1',
      [student_id]
    );

    // Get enrolled classes
    const classes = await pool.query(`
      SELECT c.name, c.subject, u.full_name as teacher_name
      FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE ce.student_id = $1
    `, [student_id]);

    // Get recent grades
    const recentGrades = await pool.query(`
      SELECT 
        c.name as class_name,
        ge.name as assignment_name,
        g.points_earned,
        ge.max_points,
        ROUND((g.points_earned * 100.0 / ge.max_points), 2) as percentage,
        g.created_at
      FROM grades g
      JOIN gradebook_entries ge ON g.gradebook_entry_id = ge.id
      JOIN classes c ON ge.class_id = c.id
      WHERE g.student_id = $1
      ORDER BY g.created_at DESC
      LIMIT 10
    `, [student_id]);

    // Get attendance summary (last 30 days)
    const attendanceSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days
      FROM attendance 
      WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
    `, [student_id]);

    res.json({
      student: student.rows[0],
      classes: classes.rows,
      recent_grades: recentGrades.rows,
      attendance_summary: attendanceSummary.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch academic overview' });
  }
});

// 📅 GET CHILD'S ATTENDANCE
router.get('/child/:student_id/attendance', authenticateToken, requireRole('parent'), async (req, res) => {
  const { student_id } = req.params;
  const { id: parent_id } = req.user;
  const { start_date, end_date, limit = 50 } = req.query;

  try {
    // Verify parent has access to this student
    const linkCheck = await pool.query(
      'SELECT * FROM parent_student_links WHERE parent_id = $1 AND student_id = $2',
      [parent_id, student_id]
    );

    if (linkCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this student' });
    }

    let query = `
      SELECT 
        a.*,
        c.name as class_name,
        c.subject
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      WHERE a.student_id = $1
    `;
    let params = [student_id];
    let paramCount = 1;

    if (start_date) {
      query += ` AND DATE(a.date) >= DATE($${++paramCount})`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND DATE(a.date) <= DATE($${++paramCount})`;
      params.push(end_date);
    }

    query += ` ORDER BY a.date DESC LIMIT $${++paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({ attendance: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// 📝 GET CHILD'S ASSIGNMENTS
router.get('/child/:student_id/assignments', authenticateToken, requireRole('parent'), async (req, res) => {
  const { student_id } = req.params;
  const { id: parent_id } = req.user;
  const { status, limit = 20 } = req.query;

  try {
    // Verify parent has access to this student
    const linkCheck = await pool.query(
      'SELECT * FROM parent_student_links WHERE parent_id = $1 AND student_id = $2',
      [parent_id, student_id]
    );

    if (linkCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this student' });
    }

    let query = `
      SELECT 
        a.*,
        c.name as class_name,
        s.status as submission_status,
        s.submitted_at,
        s.score,
        s.feedback
      FROM assignments a
      JOIN classes c ON a.school_id = c.school_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE a.school_id = (SELECT school_id FROM users WHERE id = $1)
    `;
    let params = [student_id];

    if (status === 'pending') {
      query += ` AND (s.status IS NULL OR s.status = 'draft')`;
    } else if (status === 'submitted') {
      query += ` AND s.status = 'submitted'`;
    } else if (status === 'graded') {
      query += ` AND s.status = 'graded'`;
    }

    query += ` ORDER BY a.due_date DESC LIMIT $2`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({ assignments: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// 👨‍👩‍👧‍👦 GET PARENT'S CHILDREN
router.get('/children', authenticateToken, requireRole('parent'), async (req, res) => {
  const { school_id, id: parent_id } = req.user;

  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.student_number, u.grade_level, u.grade_section,
             u.date_of_birth, u.admission_date, u.profile_picture_url,
             COALESCE(AVG(CASE WHEN g.points_earned IS NOT NULL THEN (g.points_earned::float / ge.max_points) * 100 END), 0) as current_gpa,
             COALESCE(attendance_stats.attendance_rate, 0) as attendance_rate
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'active'
      LEFT JOIN gradebook_entries ge ON ce.class_id = ge.class_id
      LEFT JOIN grades g ON ge.id = g.gradebook_entry_id AND g.student_id = u.id
      LEFT JOIN (
        SELECT student_id, 
               (COUNT(CASE WHEN status = 'present' THEN 1 END)::float / COUNT(*)::float * 100) as attendance_rate
        FROM attendance 
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY student_id
      ) attendance_stats ON u.id = attendance_stats.student_id
      WHERE psl.parent_id = $1 AND u.school_id = $2
      GROUP BY u.id, u.full_name, u.student_number, u.grade_level, u.grade_section,
               u.date_of_birth, u.admission_date, u.profile_picture_url, attendance_stats.attendance_rate
      ORDER BY u.grade_level, u.full_name
    `, [parent_id, school_id]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// 📊 GET RECENT GRADES FOR PARENT'S CHILDREN
router.get('/recent-grades', authenticateToken, requireRole('parent'), async (req, res) => {
  const { school_id, id: parent_id } = req.user;
  const { limit = 10 } = req.query;

  try {
    const result = await pool.query(`
      SELECT g.*, ge.name as assignment_title, ge.max_points, ge.category, ge.date,
             u.full_name as student_name, u.student_number,
             c.name as class_name, c.subject,
             t.full_name as teacher_name
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      JOIN grades g ON u.id = g.student_id
      JOIN gradebook_entries ge ON g.gradebook_entry_id = ge.id
      JOIN classes c ON ge.class_id = c.id
      JOIN users t ON c.teacher_id = t.id
      WHERE psl.parent_id = $1 AND u.school_id = $2
      ORDER BY g.created_at DESC
      LIMIT $3
    `, [parent_id, school_id, limit]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recent grades' });
  }
});

// 📅 GET ATTENDANCE SUMMARY FOR PARENT'S CHILDREN
router.get('/attendance-summary', authenticateToken, requireRole('parent'), async (req, res) => {
  const { school_id, id: parent_id } = req.user;
  const { days = 30 } = req.query;

  try {
    const result = await pool.query(`
      SELECT u.id as student_id, u.full_name as student_name, u.student_number,
             COUNT(a.id) as total_days,
             COUNT(CASE WHEN a.status = 'present' THEN 1 END) as days_present,
             COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as days_absent,
             COUNT(CASE WHEN a.status = 'late' THEN 1 END) as days_late,
             ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END)::float / COUNT(a.id)::float * 100), 2) as attendance_rate
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      LEFT JOIN attendance a ON u.id = a.student_id 
        AND a.date >= CURRENT_DATE - INTERVAL '$3 days'
      WHERE psl.parent_id = $1 AND u.school_id = $2
      GROUP BY u.id, u.full_name, u.student_number
      ORDER BY u.full_name
    `, [parent_id, school_id, days]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// 📅 GET UPCOMING EVENTS FOR PARENT'S CHILDREN
router.get('/upcoming-events', authenticateToken, requireRole('parent'), async (req, res) => {
  const { school_id, id: parent_id } = req.user;
  const { limit = 5 } = req.query;

  try {
    const result = await pool.query(`
      SELECT DISTINCT a.id, a.title, a.description, a.due_date as event_date, 
             'assignment' as type, c.subject, c.name as class_name
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'active'
      JOIN assignments a ON ce.class_id = a.class_id
      JOIN classes c ON a.class_id = c.id
      WHERE psl.parent_id = $1 AND u.school_id = $2 
        AND a.due_date >= CURRENT_DATE 
        AND a.visible_to_students = true 
        AND a.is_active = true
      
      UNION
      
      SELECT DISTINCT n.id, n.title, n.message as description, n.scheduled_date as event_date,
             'notification' as type, '' as subject, '' as class_name
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      JOIN notifications n ON (n.target_audience = 'all' OR n.target_audience = 'parents' 
        OR (n.target_audience = 'grade' AND n.grade_level = u.grade_level))
      WHERE psl.parent_id = $1 AND u.school_id = n.school_id = $2
        AND n.scheduled_date >= CURRENT_DATE
        AND n.is_active = true
      
      ORDER BY event_date ASC
      LIMIT $3
    `, [parent_id, school_id, limit]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// 📋 GET RECENT ACTIVITY FOR PARENT'S CHILDREN
router.get('/recent-activity', authenticateToken, requireRole('parent'), async (req, res) => {
  const { school_id, id: parent_id } = req.user;
  const { limit = 10 } = req.query;

  try {
    const result = await pool.query(`
      SELECT 'grade' as type, 
             CONCAT('New grade: ', ge.name) as title,
             CONCAT(u.full_name, ' received ', g.points_earned, '/', ge.max_points, ' in ', c.subject) as description,
             g.created_at
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      JOIN grades g ON u.id = g.student_id
      JOIN gradebook_entries ge ON g.gradebook_entry_id = ge.id
      JOIN classes c ON ge.class_id = c.id
      WHERE psl.parent_id = $1 AND u.school_id = $2
      
      UNION
      
      SELECT 'assignment' as type,
             CONCAT('Assignment due: ', a.title) as title,
             CONCAT(u.full_name, ' has assignment due in ', c.subject) as description,
             a.created_at
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'active'
      JOIN assignments a ON ce.class_id = a.class_id
      JOIN classes c ON a.class_id = c.id
      WHERE psl.parent_id = $1 AND u.school_id = $2 
        AND a.due_date >= CURRENT_DATE 
        AND a.visible_to_students = true
        AND a.is_active = true
      
      UNION
      
      SELECT 'attendance' as type,
             CONCAT('Attendance: ', att.status) as title,
             CONCAT(u.full_name, ' was marked ', att.status, ' on ', att.date) as description,
             att.created_at
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      JOIN attendance att ON u.id = att.student_id
      WHERE psl.parent_id = $1 AND u.school_id = $2
        AND att.date >= CURRENT_DATE - INTERVAL '7 days'
      
      ORDER BY created_at DESC
      LIMIT $3
    `, [parent_id, school_id, limit]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

module.exports = router;
