const express = require("express");
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require("dotenv").config();
const pool = require("./db");

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users for real-time features
const connectedUsers = new Map();

// 1️⃣ Middleware
app.use(express.json({ limit: '10mb' })); // parses incoming JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // parses URL-encoded data

// Serve static files (uploads and frontend)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', express.static(path.join(__dirname, 'frontend')));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS (allow frontend to connect)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 2️⃣ Import and mount all routes  
const authRoutes = require("./routes/auth");
const assignmentRoutes = require("./routes/assignments");
const dashboardRoutes = require("./routes/dashboard");
const classRoutes = require("./routes/classes");
const attendanceRoutes = require("./routes/attendance");
const gradeRoutes = require("./routes/grades");
const notificationRoutes = require("./routes/notifications");
const parentRoutes = require("./routes/parents");
const adminRoutes = require("./routes/admin");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/admin", adminRoutes);

// 3️⃣ Test DB connection
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("❌ DB test failed:", err.message);
  } else {
    console.log("✅ DB connected:", result.rows[0]);
  }
});

// 4️⃣ Default route
app.get("/", (req, res) => {
  res.send("🎓 Welcome to AutoM8 School Management System API");
});

// 5️⃣ Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready for real-time notifications`);
});

// Socket.IO real-time communication
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Handle user authentication for socket
  socket.on('authenticate', (data) => {
    const { userId, role, schoolId } = data;
    connectedUsers.set(socket.id, { userId, role, schoolId, socket });
    socket.join(`school_${schoolId}`); // Join school-specific room
    socket.join(`user_${userId}`); // Join user-specific room
    console.log(`✅ User ${userId} (${role}) authenticated and joined school ${schoolId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    console.log('❌ User disconnected:', socket.id);
  });
});

// Utility function to broadcast notifications
function broadcastNotification(schoolId, notification, targetUsers = null) {
  if (targetUsers) {
    // Send to specific users
    targetUsers.forEach(userId => {
      io.to(`user_${userId}`).emit('notification', notification);
    });
  } else {
    // Send to entire school
    io.to(`school_${schoolId}`).emit('notification', notification);
  }
}

// Make io and broadcastNotification available to routes
app.set('io', io);
app.set('broadcastNotification', broadcastNotification);
