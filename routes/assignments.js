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
const { upload, handleUploadError } = require('../middleware/upload');
const { sendEmail } = require('../utils/emailService');

// 📝 CREATE ASSIGNMENT (teachers only, with content modify access)
router.post('/', authenticateToken, requireRole('teacher'), requireContentModifyAccess, async (req, res) => {
  const { title, description, due_date, max_score, class_id, grade_level, assignment_type, instructions } = req.body;
  const { school_id, id: teacher_id } = req.user;

  if (!title || !description || !due_date || !class_id || !grade_level) {
    return res.status(400).json({ 
      error: 'Title, description, due_date, class_id, and grade_level are required' 
    });
  }

  try {
    // Verify teacher is assigned to the class
    const classCheck = await pool.query(`
      SELECT * FROM classes 
      WHERE id = $1 AND teacher_id = $2 AND school_id = $3 AND grade_level = $4 AND is_active = true
    `, [class_id, teacher_id, school_id, grade_level]);

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ 
        error: 'You are not authorized to create assignments for this class' 
      });
    }

    const result = await pool.query(`
      INSERT INTO assignments (
        title, description, instructions, due_date, max_score, assignment_type,
        teacher_id, school_id, class_id, grade_level, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `, [
      title, description, instructions, due_date, max_score || 100, 
      assignment_type || 'homework', teacher_id, school_id, class_id, grade_level
    ]);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// 📋 GET ASSIGNMENT BY ID (with grade access control)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { school_id, role, grade_level, grade_section } = req.user;

  try {
    const result = await pool.query(`
      SELECT a.*, u.full_name as teacher_name, c.name as class_name, c.subject
      FROM assignments a
      JOIN users u ON a.teacher_id = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.id = $1 AND a.school_id = $2
    `, [id, school_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = result.rows[0];

    // Check grade access for students and parents
    if (role === 'student') {
      if (assignment.grade_level !== grade_level) {
        return res.status(403).json({ 
          error: 'You can only access assignments for your grade level' 
        });
      }
      
      // Also get their submission if it exists
      const submission = await pool.query(`
        SELECT * FROM submissions 
        WHERE assignment_id = $1 AND student_id = $2
      `, [id, req.user.id]);

      assignment.my_submission = submission.rows[0] || null;
    }

    // Check if teacher is assigned to this class
    if (role === 'teacher' && assignment.teacher_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'You can only access assignments you created' 
      });
    }

    // For parents, check if they have children in this grade
    if (role === 'parent') {
      const childCheck = await pool.query(`
        SELECT 1 FROM parent_student_links psl
        JOIN users u ON psl.student_id = u.id
        WHERE psl.parent_id = $1 AND u.grade_level = $2 AND u.school_id = $3
      `, [req.user.id, assignment.grade_level, school_id]);

      if (childCheck.rows.length === 0) {
        return res.status(403).json({ 
          error: 'You can only access assignments for your children\'s grade levels' 
        });
      }
    }

    res.json({ assignment });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// 📎 UPLOAD FILE route
router.post('/upload', authenticateToken, upload.single('assignment_file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/assignments/${req.file.filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

// 📤 SUBMIT ASSIGNMENT WITH FILE (enhanced)
router.post('/:id/submit', authenticateToken, requireRole('student'), upload.single('submission_file'), async (req, res) => {
  const { id: assignment_id } = req.params;
  const { content } = req.body;
  const { school_id, id: student_id } = req.user;

  // Get file URL if file was uploaded
  const file_url = req.file ? `/uploads/submissions/${req.file.filename}` : req.body.file_url;

  if (!content && !file_url) {
    return res.status(400).json({ error: 'Either content or file is required' });
  }

  try {
    // Check if assignment exists and belongs to same school
    const assignmentCheck = await pool.query(
      'SELECT * FROM assignments WHERE id = $1 AND school_id = $2',
      [assignment_id, school_id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if already submitted
    const existingSubmission = await pool.query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignment_id, student_id]
    );

    if (existingSubmission.rows.length > 0) {
      // Update existing submission
      const result = await pool.query(`
        UPDATE submissions 
        SET content = $1, file_url = $2, submitted_at = NOW(), status = 'submitted'
        WHERE assignment_id = $3 AND student_id = $4
        RETURNING *
      `, [content, file_url, assignment_id, student_id]);

      // Get assignment and teacher info for notification
      const assignmentInfo = await pool.query(`
        SELECT a.title, a.teacher_id, u.full_name as student_name
        FROM assignments a, users u
        WHERE a.id = $1 AND u.id = $2
      `, [assignment_id, student_id]);

      // Send real-time notification to teacher
      if (assignmentInfo.rows.length > 0) {
        const { title, teacher_id, student_name } = assignmentInfo.rows[0];
        const broadcastNotification = req.app.get('broadcastNotification');
        if (broadcastNotification) {
          broadcastNotification(null, {
            type: 'assignment_resubmitted',
            title: 'Assignment Resubmitted',
            message: `${student_name} has resubmitted: ${title}`,
            assignmentId: assignment_id,
            timestamp: new Date().toISOString()
          }, [teacher_id]);
        }
      }

      res.json({
        message: 'Assignment resubmitted successfully',
        submission: result.rows[0]
      });
    } else {
      // Create new submission
      const result = await pool.query(`
        INSERT INTO submissions (assignment_id, student_id, content, file_url, submitted_at, status)
        VALUES ($1, $2, $3, $4, NOW(), 'submitted')
        RETURNING *
      `, [assignment_id, student_id, content, file_url]);

      // Get assignment and teacher info for notification
      const assignmentInfo = await pool.query(`
        SELECT a.title, a.teacher_id, u.full_name as student_name
        FROM assignments a, users u
        WHERE a.id = $1 AND u.id = $2
      `, [assignment_id, student_id]);

      // Send real-time notification to teacher
      if (assignmentInfo.rows.length > 0) {
        const { title, teacher_id, student_name } = assignmentInfo.rows[0];
        const broadcastNotification = req.app.get('broadcastNotification');
        
        // Real-time notification
        if (broadcastNotification) {
          broadcastNotification(null, {
            type: 'assignment_submitted',
            title: 'New Assignment Submission',
            message: `${student_name} has submitted: ${title}`,
            assignmentId: assignment_id,
            timestamp: new Date().toISOString()
          }, [teacher_id]);
        }

        // Email notification
        const teacherInfo = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [teacher_id]);
        if (teacherInfo.rows.length > 0 && teacherInfo.rows[0].email) {
          sendEmail(
            teacherInfo.rows[0].email,
            'assignmentSubmitted',
            teacherInfo.rows[0].full_name,
            student_name,
            title
          );
        }
      }

      res.status(201).json({
        message: 'Assignment submitted successfully',
        submission: result.rows[0]
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// 📊 GET SUBMISSIONS FOR ASSIGNMENT (teachers only)
router.get('/:id/submissions', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { id: assignment_id } = req.params;
  const { school_id } = req.user;

  try {
    // Verify teacher has access to this assignment
    const assignmentCheck = await pool.query(
      'SELECT * FROM assignments WHERE id = $1 AND school_id = $2',
      [assignment_id, school_id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const result = await pool.query(`
      SELECT 
        s.*,
        u.full_name as student_name,
        u.student_number
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC
    `, [assignment_id]);

    res.json({ submissions: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ✅ GRADE SUBMISSION (teachers only)
router.post('/submissions/:submission_id/grade', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { submission_id } = req.params;
  const { score, feedback } = req.body;
  const { school_id } = req.user;

  if (score === undefined) {
    return res.status(400).json({ error: 'Score is required' });
  }

  try {
    // Verify teacher has access to this submission's assignment
    const submissionCheck = await pool.query(`
      SELECT s.*, a.school_id 
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.id = $1 AND a.school_id = $2
    `, [submission_id, school_id]);

    if (submissionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const result = await pool.query(`
      UPDATE submissions 
      SET score = $1, feedback = $2, graded_at = NOW(), status = 'graded'
      WHERE id = $3
      RETURNING *
    `, [score, feedback, submission_id]);

    // Get submission details for notification
    const submissionDetails = await pool.query(`
      SELECT s.student_id, a.title, u.full_name as teacher_name
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN users u ON a.teacher_id = u.id
      WHERE s.id = $1
    `, [submission_id]);

    // Send real-time notification to student
    if (submissionDetails.rows.length > 0) {
      const { student_id, title, teacher_name } = submissionDetails.rows[0];
      const broadcastNotification = req.app.get('broadcastNotification');
      
      // Real-time notification
      if (broadcastNotification) {
        broadcastNotification(null, {
          type: 'assignment_graded',
          title: 'Assignment Graded',
          message: `${teacher_name} has graded your assignment: ${title}. Score: ${score}/100`,
          assignmentTitle: title,
          score: score,
          feedback: feedback,
          timestamp: new Date().toISOString()
        }, [student_id]);
      }

      // Email notification
      const studentInfo = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [student_id]);
      if (studentInfo.rows.length > 0 && studentInfo.rows[0].email) {
        sendEmail(
          studentInfo.rows[0].email,
          'assignmentGraded',
          studentInfo.rows[0].full_name,
          teacher_name,
          title,
          score,
          feedback
        );
      }
    }

    res.json({
      message: 'Submission graded successfully',
      submission: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// 📚 GET ALL ASSIGNMENTS (with grade-based filtering)
router.get('/', authenticateToken, async (req, res) => {
  const { school_id, role, grade_level, id: user_id } = req.user;
  const { grade, section, class_id } = req.query;

  try {
    let query;
    let params = [school_id];

    if (role === 'admin') {
      // Admins can see all assignments
      query = `
        SELECT a.*, u.full_name as teacher_name, c.name as class_name, c.subject
        FROM assignments a
        JOIN users u ON a.teacher_id = u.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE a.school_id = $1 AND a.is_active = true
      `;
      
      if (grade) {
        query += ` AND a.grade_level = $${params.length + 1}`;
        params.push(grade);
      }
      if (class_id) {
        query += ` AND a.class_id = $${params.length + 1}`;
        params.push(class_id);
      }
    } else if (role === 'teacher') {
      // Teachers can only see assignments they created
      query = `
        SELECT a.*, u.full_name as teacher_name, c.name as class_name, c.subject
        FROM assignments a
        JOIN users u ON a.teacher_id = u.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE a.school_id = $1 AND a.teacher_id = $2 AND a.is_active = true
      `;
      params.push(user_id);
      
      if (grade) {
        query += ` AND a.grade_level = $${params.length + 1}`;
        params.push(grade);
      }
      if (class_id) {
        query += ` AND a.class_id = $${params.length + 1}`;
        params.push(class_id);
      }
    } else if (role === 'student') {
      // Students can only see assignments for their grade level and enrolled classes
      query = `
        SELECT DISTINCT a.*, u.full_name as teacher_name, c.name as class_name, c.subject,
               s.score as my_score, s.submitted_at, s.status as submission_status
        FROM assignments a
        JOIN users u ON a.teacher_id = u.id
        LEFT JOIN classes c ON a.class_id = c.id
        LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.student_id = $2
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $2
        WHERE a.school_id = $1 
          AND a.grade_level = $3 
          AND a.visible_to_students = true 
          AND a.is_active = true
          AND (ce.enrollment_status = 'active' OR a.class_id IS NULL)
      `;
      params.push(user_id, grade_level);
    } else if (role === 'parent') {
      // Parents can see assignments for their children's grade levels
      query = `
        SELECT DISTINCT a.*, u.full_name as teacher_name, c.name as class_name, c.subject
        FROM assignments a
        JOIN users u ON a.teacher_id = u.id
        LEFT JOIN classes c ON a.class_id = c.id
        JOIN parent_student_links psl ON psl.parent_id = $2
        JOIN users students ON psl.student_id = students.id
        WHERE a.school_id = $1 
          AND a.grade_level = students.grade_level
          AND a.visible_to_students = true 
          AND a.is_active = true
      `;
      params.push(user_id);
      
      if (grade) {
        query += ` AND a.grade_level = $${params.length + 1}`;
        params.push(grade);
      }
    }

    query += ` ORDER BY a.due_date DESC, a.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ assignments: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// 📚 GET ASSIGNMENTS BY GRADE/CLASS (with grade access control)
router.get('/grade/:grade_level', authenticateToken, requireGradeAccess, async (req, res) => {
  const { grade_level } = req.params;
  const { section } = req.query;
  const { school_id, role, id: user_id } = req.user;

  try {
    let query = `
      SELECT a.*, u.full_name as teacher_name, c.name as class_name, c.subject
      FROM assignments a
      JOIN users u ON a.teacher_id = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.school_id = $1 AND a.grade_level = $2 AND a.is_active = true
    `;
    let params = [school_id, grade_level];

    if (section) {
      query += ` AND (c.section = $3 OR c.section IS NULL)`;
      params.push(section);
    }

    // Filter based on role
    if (role === 'teacher') {
      query += ` AND a.teacher_id = $${params.length + 1}`;
      params.push(user_id);
    } else if (role === 'student') {
      query += ` AND a.visible_to_students = true`;
    }

    query += ` ORDER BY a.due_date ASC, a.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ assignments: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

module.exports = router;
