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

// 📊 CREATE GRADEBOOK ENTRY (with content modify access)
router.post('/', authenticateToken, requireRole('teacher'), requireContentModifyAccess, async (req, res) => {
  const { class_id, category, name, max_points, date, grade_level } = req.body;
  const { school_id, id: teacher_id } = req.user;

  if (!class_id || !category || !name || !max_points || !grade_level) {
    return res.status(400).json({ 
      error: 'Class ID, category, name, max points, and grade level are required' 
    });
  }

  try {
    // Verify teacher owns this class and has access to the grade level
    const classCheck = await pool.query(`
      SELECT * FROM classes 
      WHERE id = $1 AND teacher_id = $2 AND school_id = $3 AND grade_level = $4 AND is_active = true
    `, [class_id, teacher_id, school_id, grade_level]);

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ 
        error: 'You can only create grades for your own classes and assigned grade levels' 
      });
    }

    const result = await pool.query(`
      INSERT INTO gradebook_entries (class_id, category, name, max_points, date, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [class_id, category, name, max_points, date || new Date(), teacher_id]);

    res.status(201).json({
      message: 'Gradebook entry created successfully',
      entry: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create gradebook entry' });
  }
});

// 📝 RECORD GRADES
router.post('/grades', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { gradebook_entry_id, grades } = req.body;
  const { school_id, id: teacher_id } = req.user;

  if (!gradebook_entry_id || !grades || !Array.isArray(grades)) {
    return res.status(400).json({ error: 'Gradebook entry ID and grades array are required' });
  }

  try {
    // Verify teacher has access to this gradebook entry
    const entryCheck = await pool.query(`
      SELECT ge.*, c.teacher_id, c.school_id 
      FROM gradebook_entries ge
      JOIN classes c ON ge.class_id = c.id
      WHERE ge.id = $1 AND c.teacher_id = $2 AND c.school_id = $3
    `, [gradebook_entry_id, teacher_id, school_id]);

    if (entryCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this gradebook entry' });
    }

    const maxPoints = entryCheck.rows[0].max_points;

    // Begin transaction
    await pool.query('BEGIN');

    for (const grade of grades) {
      const { student_id, points_earned, feedback } = grade;

      if (points_earned > maxPoints) {
        throw new Error(`Points earned (${points_earned}) cannot exceed max points (${maxPoints})`);
      }

      // Check if grade already exists
      const existingGrade = await pool.query(
        'SELECT * FROM grades WHERE gradebook_entry_id = $1 AND student_id = $2',
        [gradebook_entry_id, student_id]
      );

      if (existingGrade.rows.length > 0) {
        // Update existing grade
        await pool.query(`
          UPDATE grades 
          SET points_earned = $1, feedback = $2, updated_at = NOW()
          WHERE gradebook_entry_id = $3 AND student_id = $4
        `, [points_earned, feedback, gradebook_entry_id, student_id]);
      } else {
        // Insert new grade
        await pool.query(`
          INSERT INTO grades (gradebook_entry_id, student_id, points_earned, feedback, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [gradebook_entry_id, student_id, points_earned, feedback]);
      }
    }

    await pool.query('COMMIT');

    res.json({
      message: `Grades recorded for ${grades.length} students`,
      entry_name: entryCheck.rows[0].name
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to record grades' });
  }
});

// 📊 GET CLASS GRADEBOOK
router.get('/class/:class_id', authenticateToken, async (req, res) => {
  const { class_id } = req.params;
  const { school_id } = req.user;

  try {
    // Verify access to class
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND school_id = $2',
      [class_id, school_id]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get gradebook entries
    const entries = await pool.query(`
      SELECT * FROM gradebook_entries 
      WHERE class_id = $1 
      ORDER BY date DESC, created_at DESC
    `, [class_id]);

    // Get all students in class
    const students = await pool.query(`
      SELECT u.id, u.full_name, u.student_number
      FROM class_enrollments ce
      JOIN users u ON ce.student_id = u.id
      WHERE ce.class_id = $1
      ORDER BY u.full_name
    `, [class_id]);

    // Get all grades for this class
    const grades = await pool.query(`
      SELECT g.*, ge.name as entry_name, ge.max_points
      FROM grades g
      JOIN gradebook_entries ge ON g.gradebook_entry_id = ge.id
      WHERE ge.class_id = $1
    `, [class_id]);

    // Organize data
    const gradebook = {
      class_name: classCheck.rows[0].name,
      entries: entries.rows,
      students: students.rows.map(student => ({
        ...student,
        grades: grades.rows.filter(grade => grade.student_id === student.id)
      }))
    };

    res.json(gradebook);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch gradebook' });
  }
});

// 📊 GET STUDENT GRADES (for students and parents with grade access)
router.get('/student/:student_id', authenticateToken, async (req, res) => {
  const { student_id } = req.params;
  const { school_id, role, id: user_id, grade_level } = req.user;
  const { subject, grade_filter } = req.query;

  try {
    // Check access permissions
    if (role === 'student') {
      // Students can only view their own grades
      if (parseInt(student_id) !== user_id) {
        return res.status(403).json({ error: 'You can only view your own grades' });
      }
    } else if (role === 'parent') {
      // Parents can only view their children's grades
      const childCheck = await pool.query(`
        SELECT 1 FROM parent_student_links 
        WHERE parent_id = $1 AND student_id = $2
      `, [user_id, student_id]);

      if (childCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You can only view your children\'s grades' });
      }
    } else if (role === 'teacher') {
      // Teachers can only view grades for students in their classes
      const studentClassCheck = await pool.query(`
        SELECT 1 FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.id
        WHERE ce.student_id = $1 AND c.teacher_id = $2 AND c.school_id = $3
      `, [student_id, user_id, school_id]);

      if (studentClassCheck.rows.length === 0) {
        return res.status(403).json({ 
          error: 'You can only view grades for students in your classes' 
        });
      }
    }
    // Admins have full access

    // Get student info
    const studentInfo = await pool.query(`
      SELECT id, full_name, student_number, grade_level, grade_section
      FROM users 
      WHERE id = $1 AND school_id = $2 AND role = 'student'
    `, [student_id, school_id]);

    if (studentInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get grades with class and assignment info
    let query = `
      SELECT g.*, ge.name as assignment_name, ge.category, ge.max_points, ge.date,
             c.name as class_name, c.subject, c.grade_level,
             u.full_name as teacher_name
      FROM grades g
      JOIN gradebook_entries ge ON g.gradebook_entry_id = ge.id
      JOIN classes c ON ge.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE g.student_id = $1 AND c.school_id = $2
    `;
    let params = [student_id, school_id];

    if (subject) {
      query += ` AND c.subject = $${params.length + 1}`;
      params.push(subject);
    }

    if (grade_filter) {
      query += ` AND c.grade_level = $${params.length + 1}`;
      params.push(grade_filter);
    }

    query += ` ORDER BY ge.date DESC, g.created_at DESC`;

    const grades = await pool.query(query, params);

    // Calculate grade statistics
    const stats = await pool.query(`
      SELECT 
        c.subject,
        COUNT(g.id) as assignment_count,
        AVG(CASE WHEN g.points_earned IS NOT NULL THEN (g.points_earned::float / ge.max_points) * 100 END) as average_percentage,
        SUM(g.points_earned) as total_points_earned,
        SUM(ge.max_points) as total_points_possible
      FROM grades g
      JOIN gradebook_entries ge ON g.gradebook_entry_id = ge.id
      JOIN classes c ON ge.class_id = c.id
      WHERE g.student_id = $1 AND c.school_id = $2
      GROUP BY c.subject
      ORDER BY c.subject
    `, [student_id, school_id]);

    res.json({
      student: studentInfo.rows[0],
      grades: grades.rows,
      statistics: stats.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student grades' });
  }
});

// 📊 GET GRADES BY GRADE LEVEL (with grade access control)
router.get('/grade/:grade_level', authenticateToken, requireGradeAccess, async (req, res) => {
  const { grade_level } = req.params;
  const { section } = req.query;
  const { school_id, role, id: user_id } = req.user;

  try {
    let query = `
      SELECT g.*, ge.name as assignment_name, ge.category, ge.max_points, ge.date,
             c.name as class_name, c.subject, c.grade_level, c.section,
             u.full_name as student_name, u.student_number,
             t.full_name as teacher_name
      FROM grades g
      JOIN gradebook_entries ge ON g.gradebook_entry_id = ge.id
      JOIN classes c ON ge.class_id = c.id
      JOIN users u ON g.student_id = u.id
      JOIN users t ON c.teacher_id = t.id
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
    }

    query += ` ORDER BY c.subject, u.full_name, ge.date DESC`;

    const result = await pool.query(query, params);
    res.json({ grades: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch grades by grade level' });
  }
});

// 📊 GET ALL GRADEBOOK ENTRIES (for admin)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const { school_id } = req.user;

  try {
    const result = await pool.query(`
      SELECT ge.*, c.name as class_name, c.grade_level, c.subject, u.full_name as teacher_name
      FROM gradebook_entries ge
      JOIN classes c ON ge.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE c.school_id = $1
      ORDER BY ge.date DESC, ge.created_at DESC
    `, [school_id]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch gradebook entries' });
  }
});

// 📊 GET GRADEBOOK ENTRY BY ID
router.get('/entry/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { school_id, role, id: user_id } = req.user;

  try {
    // Admins can access any entry
    if (role === 'admin') {
      const result = await pool.query(`
        SELECT ge.*, c.name as class_name, c.grade_level, c.subject, u.full_name as teacher_name
        FROM gradebook_entries ge
        JOIN classes c ON ge.class_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE ge.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Gradebook entry not found' });
      }

      return res.json(result.rows[0]);
    }

    // Teachers can access entries for their classes
    const result = await pool.query(`
      SELECT ge.*, c.name as class_name, c.grade_level, c.subject, u.full_name as teacher_name
      FROM gradebook_entries ge
      JOIN classes c ON ge.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE ge.id = $1 AND c.teacher_id = $2 AND c.school_id = $3
    `, [id, user_id, school_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gradebook entry not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch gradebook entry' });
  }
});

// 📊 UPDATE GRADEBOOK ENTRY (with content modify access)
router.put('/:id', authenticateToken, requireRole('teacher'), requireContentModifyAccess, async (req, res) => {
  const { id } = req.params;
  const { category, name, max_points, date } = req.body;
  const { school_id, id: teacher_id } = req.user;

  try {
    // Update gradebook entry
    const result = await pool.query(`
      UPDATE gradebook_entries
      SET category = $1, name = $2, max_points = $3, date = $4, updated_at = NOW()
      WHERE id = $5 AND teacher_id = $6 AND school_id = $7
      RETURNING *
    `, [category, name, max_points, date || new Date(), id, teacher_id, school_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gradebook entry not found or you do not have access' });
    }

    res.json({
      message: 'Gradebook entry updated successfully',
      entry: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update gradebook entry' });
  }
});

// 📊 DELETE GRADEBOOK ENTRY (with content modify access)
router.delete('/:id', authenticateToken, requireRole('teacher'), requireContentModifyAccess, async (req, res) => {
  const { id } = req.params;
  const { school_id, id: teacher_id } = req.user;

  try {
    // Delete gradebook entry
    const result = await pool.query(`
      DELETE FROM gradebook_entries
      WHERE id = $1 AND teacher_id = $2 AND school_id = $3
      RETURNING *
    `, [id, teacher_id, school_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gradebook entry not found or you do not have access' });
    }

    res.json({ message: 'Gradebook entry deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete gradebook entry' });
  }
});

module.exports = router;
