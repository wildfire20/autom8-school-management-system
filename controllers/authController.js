// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const registerUser = async (req, res) => {
  const { full_name, email, password, role, school_id } = req.body;

  try {
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password, role, school_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [full_name, email, hashedPassword, role, school_id]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Registration failed" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Login failed" });
  }
};

module.exports = { registerUser, loginUser };
