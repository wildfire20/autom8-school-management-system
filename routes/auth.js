const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authenticateToken } = require("../middleware/auth");

// ✅ TEST route
router.get("/test", (req, res) => {
  res.send("✅ Auth routes are working!");
});

// ✅ REGISTER route - Updated for school domain support
router.post("/register", async (req, res) => {
  const { full_name, email, student_number, password, role, school_domain, grade_level, section } = req.body;

  // Basic validation
  if (!full_name || !password || !role || !school_domain) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Role-specific validation
  if (role === 'student' && !student_number) {
    return res.status(400).json({ error: "Student number is required for student registration" });
  }
  
  if ((role === 'teacher' || role === 'admin') && !email) {
    return res.status(400).json({ error: "Email is required for teacher/admin registration" });
  }    try {
        // Get school by domain
        const schoolResult = await pool.query("SELECT * FROM schools WHERE domain_name = $1", [school_domain]);
        if (schoolResult.rows.length === 0) {
            return res.status(400).json({ error: "Invalid school domain" });
        }
        const school = schoolResult.rows[0];

    // Check if user already exists
    let existingUserQuery;
    let existingUserParams;
    
    if (role === 'student') {
      existingUserQuery = "SELECT * FROM users WHERE student_number = $1 AND school_id = $2";
      existingUserParams = [student_number, school.id];
    } else {
      existingUserQuery = "SELECT * FROM users WHERE email = $1";
      existingUserParams = [email];
    }

    const existingUser = await pool.query(existingUserQuery, existingUserParams);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: role === 'student' 
          ? "Student with this number already exists" 
          : "User with this email already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user data
    const userData = {
      full_name,
      password: hashedPassword,
      role,
      school_id: school.id,
      email: email || null,
      student_number: student_number || null,
      grade_level: grade_level || null,
      section: section || null,
      is_active: true
    };

    const result = await pool.query(`
      INSERT INTO users (full_name, email, student_number, password, role, school_id, grade_level, grade_section, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id, full_name, email, student_number, role, school_id, grade_level, grade_section, created_at`,
      [userData.full_name, userData.email, userData.student_number, userData.password, 
       userData.role, userData.school_id, userData.grade_level, userData.section, userData.is_active]
    );

    res.status(201).json({ 
      message: "User registered successfully", 
      user: result.rows[0] 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ✅ LOGIN route - Support student number/password and email/password with domain verification
router.post("/login", async (req, res) => {
  const { identifier, password, school_domain } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Login credentials are required" });
  }

  try {
    let user = null;
    let isStudentLogin = false;
    
    // Determine if this is a student login (no @ symbol = student number)
    if (!identifier.includes('@')) {
      isStudentLogin = true;
      
      // Student login with student number
      const studentResult = await pool.query(`
        SELECT u.*, s.domain_name as school_domain, s.name as school_name, s.full_domain
        FROM users u 
        JOIN schools s ON u.school_id = s.id 
        WHERE u.student_number = $1 AND u.role = 'student' AND u.is_active = true`,
        [identifier]
      );
      
      if (studentResult.rows.length > 0) {
        user = studentResult.rows[0];
      }
    } else {
      // Email login for teachers/admins
      const emailResult = await pool.query(`
        SELECT u.*, s.domain_name as school_domain, s.name as school_name, s.full_domain
        FROM users u 
        JOIN schools s ON u.school_id = s.id 
        WHERE u.email = $1 AND u.is_active = true`,
        [identifier]
      );
      
      if (emailResult.rows.length > 0) {
        user = emailResult.rows[0];
      }
    }

    if (!user) {
      return res.status(401).json({ 
        error: isStudentLogin 
          ? "Invalid student number or password" 
          : "Invalid email or password" 
      });
    }

    // Verify school domain if provided
    if (school_domain && user.school_domain !== school_domain) {
      return res.status(401).json({ 
        error: "Access denied. Please use your school's portal: " + user.full_domain 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: isStudentLogin 
          ? "Invalid student number or password" 
          : "Invalid email or password" 
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token with enhanced claims
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        student_number: user.student_number,
        role: user.role, 
        school_id: user.school_id,
        school_domain: user.school_domain,
        grade_level: user.grade_level,
        section: user.grade_section,
        full_name: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
      school_info: {
        name: user.school_name,
        domain: user.school_domain,
        full_domain: user.full_domain
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ✅ GET PROFILE route (protected)
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, student_number, role, school_id, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ✅ LOGOUT route (optional - mainly for client-side token removal)
router.post("/logout", authenticateToken, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ message: "Logged out successfully" });
});

// ✅ GET SCHOOL by domain (public route for login page)
router.get("/school/:domain", async (req, res) => {
  const { domain } = req.params;
  
  try {
    const result = await pool.query(
      "SELECT id, name, domain_name, logo_url, primary_color, secondary_color FROM schools WHERE domain_name = $1",
      [domain]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "School not found" });
    }

    res.json({ school: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch school information" });
  }
});

// ✅ VALIDATE STUDENT NUMBER route (for registration)
router.post("/validate-student-number", async (req, res) => {
  const { student_number, school_domain } = req.body;

  if (!student_number || !school_domain) {
    return res.status(400).json({ error: "Student number and school domain are required" });
  }

  try {
    const result = await pool.query(`
      SELECT sn.*, u.id as user_id, u.full_name as current_user
      FROM student_numbers sn
      LEFT JOIN users u ON sn.assigned_user_id = u.id
      JOIN schools s ON sn.school_id = s.id
      WHERE sn.student_number = $1 AND s.domain_name = $2`,
      [student_number, school_domain]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invalid student number for this school" });
    }

    const studentData = result.rows[0];
    
    if (studentData.user_id) {
      return res.status(409).json({ error: "This student number is already assigned to a user" });
    }

    res.json({ 
      valid: true, 
      student_info: {
        student_number: studentData.student_number,
        grade_level: studentData.grade_level,
        section: studentData.section,
        is_active: studentData.is_active
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to validate student number" });
  }
});

module.exports = router;
