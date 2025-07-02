const jwt = require('jsonwebtoken');
const pool = require('../db');

// Middleware to verify JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user; // Add user info to request object
    next();
  });
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Allow array of roles or single role
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

// Middleware to check if user belongs to same school (for multi-tenant)
const requireSameSchool = (req, res, next) => {
  const requestedSchoolId = req.params.school_id || req.body.school_id;
  
  if (requestedSchoolId && parseInt(requestedSchoolId) !== req.user.school_id) {
    return res.status(403).json({ error: 'Access denied to different school data' });
  }
  
  next();
};

// Check if user can access specific grade/class content
const requireGradeAccess = (req, res, next) => {
  const { grade_level, section } = req.params;
  const user = req.user;

  // Admins have access to all grades
  if (user.role === 'admin') {
    return next();
  }

  // Teachers can access grades they are assigned to
  if (user.role === 'teacher') {
    // Check if teacher is assigned to this grade/section
    pool.query(`
      SELECT 1 FROM classes 
      WHERE teacher_id = $1 AND grade_level = $2 AND (section = $3 OR $3 IS NULL)
      AND school_id = $4 AND is_active = true
    `, [user.id, grade_level, section, user.school_id])
    .then(result => {
      if (result.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Access denied. You are not assigned to this grade/section.' 
        });
      }
      next();
    })
    .catch(err => {
      console.error('Grade access check error:', err);
      res.status(500).json({ error: 'Access check failed' });
    });
    return;
  }

  // Students can only access their own grade/section
  if (user.role === 'student') {
    if (user.grade_level !== grade_level || user.section !== section) {
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own grade/section content.' 
      });
    }
    return next();
  }

  // Parents can access their children's grades
  if (user.role === 'parent') {
    pool.query(`
      SELECT 1 FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      WHERE psl.parent_id = $1 
        AND u.grade_level = $2 
        AND (u.grade_section = $3 OR $3 IS NULL)
        AND u.school_id = $4
    `, [user.id, grade_level, section, user.school_id])
    .then(result => {
      if (result.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Access denied. You can only access your children\'s content.' 
        });
      }
      next();
    })
    .catch(err => {
      console.error('Parent access check error:', err);
      res.status(500).json({ error: 'Access check failed' });
    });
    return;
  }

  res.status(403).json({ error: 'Access denied' });
};

// Check if user can modify content (teachers and admins only)
const requireContentModifyAccess = async (req, res, next) => {
  const user = req.user;

  // Only teachers and admins can modify content
  if (!['teacher', 'admin'].includes(user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Only teachers and administrators can modify content.' 
    });
  }

  // Admins have full access
  if (user.role === 'admin') {
    return next();
  }

  // Teachers can only modify content for their assigned classes
  const { grade_level, section, class_id } = req.body || req.params;

  if (class_id) {
    try {
      const result = await pool.query(`
        SELECT 1 FROM classes 
        WHERE id = $1 AND teacher_id = $2 AND school_id = $3 AND is_active = true
      `, [class_id, user.id, user.school_id]);

      if (result.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Access denied. You can only modify content for your assigned classes.' 
        });
      }
    } catch (err) {
      console.error('Class access check error:', err);
      return res.status(500).json({ error: 'Access check failed' });
    }
  }

  next();
};

// Verify school domain access
const verifySchoolAccess = (req, res, next) => {
  const requestedDomain = req.headers['x-school-domain'] || req.query.school_domain;
  const user = req.user;

  if (requestedDomain && user.school_domain !== requestedDomain) {
    return res.status(403).json({ 
      error: 'Access denied. School domain mismatch.' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSameSchool,
  requireGradeAccess,
  requireContentModifyAccess,
  verifySchoolAccess
};
