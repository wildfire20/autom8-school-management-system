const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole, requireSameSchool } = require('../middleware/auth');

// 📊 DASHBOARD STATS (for admins and teachers)
router.get('/stats', authenticateToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { school_id } = req.user;

    // Get basic stats for the school
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as total_students FROM users WHERE school_id = $1 AND role = $2', [school_id, 'student']),
      pool.query('SELECT COUNT(*) as total_teachers FROM users WHERE school_id = $1 AND role = $2', [school_id, 'teacher']),
      pool.query('SELECT COUNT(*) as total_assignments FROM assignments WHERE school_id = $1', [school_id]),
      pool.query('SELECT COUNT(*) as total_submissions FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.school_id = $1', [school_id])
    ]);

    res.json({
      school_id,
      stats: {
        total_students: parseInt(stats[0].rows[0].total_students),
        total_teachers: parseInt(stats[1].rows[0].total_teachers),
        total_assignments: parseInt(stats[2].rows[0].total_assignments),
        total_submissions: parseInt(stats[3].rows[0].total_submissions)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// 👥 GET ALL USERS IN SCHOOL (admin only)
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { school_id } = req.user;
    const { role, page = 1, limit = 50 } = req.query;

    let query = 'SELECT id, full_name, email, student_number, role, created_at FROM users WHERE school_id = $1';
    let params = [school_id];

    if (role) {
      query += ' AND role = $2';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, (page - 1) * limit);

    const result = await pool.query(query, params);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 📝 GET MY ASSIGNMENTS (for students)
router.get('/assignments', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const { school_id, id: student_id } = req.user;

    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.created_at,
        s.id as submission_id,
        s.submitted_at,
        s.status
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE a.school_id = $2
      ORDER BY a.due_date ASC
    `, [student_id, school_id]);

    res.json({ assignments: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// 📚 GET ASSIGNMENTS I CREATED (for teachers)
router.get('/my-assignments', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { school_id, id: teacher_id } = req.user;

    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.created_at,
        COUNT(s.id) as submission_count
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.school_id = $1 AND a.teacher_id = $2
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `, [school_id, teacher_id]);

    res.json({ assignments: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your assignments' });
  }
});

module.exports = router;
