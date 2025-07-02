const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 📢 CREATE NOTIFICATION
router.post('/', authenticateToken, requireRole(['admin', 'teacher']), async (req, res) => {
  const { title, message, type, recipients, priority } = req.body;
  const { school_id, id: sender_id } = req.user;

  if (!title || !message || !recipients) {
    return res.status(400).json({ error: 'Title, message, and recipients are required' });
  }

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Create notification
    const notificationResult = await pool.query(`
      INSERT INTO notifications (title, message, type, priority, sender_id, school_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [title, message, type || 'general', priority || 'normal', sender_id, school_id]);

    const notification_id = notificationResult.rows[0].id;

    // Send to recipients
    for (const recipient_id of recipients) {
      await pool.query(`
        INSERT INTO notification_recipients (notification_id, recipient_id, created_at)
        VALUES ($1, $2, NOW())
      `, [notification_id, recipient_id]);
    }

    await pool.query('COMMIT');

    res.status(201).json({
      message: `Notification sent to ${recipients.length} recipients`,
      notification: notificationResult.rows[0]
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// 🔔 GET MY NOTIFICATIONS
router.get('/my-notifications', authenticateToken, async (req, res) => {
  const { id: user_id } = req.user;
  const { unread_only, limit = 50, page = 1 } = req.query;

  try {
    let query = `
      SELECT 
        n.*,
        nr.read_at,
        u.full_name as sender_name
      FROM notifications n
      JOIN notification_recipients nr ON n.id = nr.notification_id
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE nr.recipient_id = $1
    `;
    let params = [user_id];

    if (unread_only === 'true') {
      query += ` AND nr.read_at IS NULL`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $2 OFFSET $3`;
    params.push(limit, (page - 1) * limit);

    const result = await pool.query(query, params);

    // Get unread count
    const unreadCount = await pool.query(`
      SELECT COUNT(*) as unread_count
      FROM notification_recipients nr
      WHERE nr.recipient_id = $1 AND nr.read_at IS NULL
    `, [user_id]);

    res.json({
      notifications: result.rows,
      unread_count: parseInt(unreadCount.rows[0].unread_count),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ✅ MARK NOTIFICATION AS READ
router.post('/:id/read', authenticateToken, async (req, res) => {
  const { id: notification_id } = req.params;
  const { id: user_id } = req.user;

  try {
    const result = await pool.query(`
      UPDATE notification_recipients 
      SET read_at = NOW()
      WHERE notification_id = $1 AND recipient_id = $2 AND read_at IS NULL
      RETURNING *
    `, [notification_id, user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or already read' });
    }

    res.json({ message: 'Notification marked as read' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// 📊 SEND ANNOUNCEMENT TO CLASS
router.post('/class-announcement', authenticateToken, requireRole(['admin', 'teacher']), async (req, res) => {
  const { class_id, title, message, type } = req.body;
  const { school_id, id: sender_id } = req.user;

  if (!class_id || !title || !message) {
    return res.status(400).json({ error: 'Class ID, title, and message are required' });
  }

  try {
    // Get all students in the class
    const students = await pool.query(`
      SELECT ce.student_id
      FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.class_id = $1 AND c.school_id = $2
    `, [class_id, school_id]);

    if (students.rows.length === 0) {
      return res.status(404).json({ error: 'No students found in this class' });
    }

    // Begin transaction
    await pool.query('BEGIN');

    // Create notification
    const notificationResult = await pool.query(`
      INSERT INTO notifications (title, message, type, sender_id, school_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [title, message, type || 'class_announcement', sender_id, school_id]);

    const notification_id = notificationResult.rows[0].id;

    // Send to all students in class
    for (const student of students.rows) {
      await pool.query(`
        INSERT INTO notification_recipients (notification_id, recipient_id, created_at)
        VALUES ($1, $2, NOW())
      `, [notification_id, student.student_id]);
    }

    await pool.query('COMMIT');

    res.json({
      message: `Class announcement sent to ${students.rows.length} students`,
      notification: notificationResult.rows[0]
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to send class announcement' });
  }
});

module.exports = router;
