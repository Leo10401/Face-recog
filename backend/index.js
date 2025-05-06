require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI);

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  faceDescriptor: Array,
  role: { type: String, default: 'user' },
});

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'present' },
});

const User = mongoose.model('User', UserSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key';

// Routes
app.post('/api/register', upload.single('image'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      faceDescriptor: JSON.parse(req.body.faceDescriptor),
    });
    
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mark-attendance', async (req, res) => {
  try {
    const { userId, faceDescriptor } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if today's attendance already exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      userId,
      date: { $gte: today }
    });
    
    if (existingAttendance) {
      return res.json({ message: 'Attendance already marked today' });
    }
    
    // If faceDescriptor is provided, verify face match
    if (faceDescriptor) {
      // Compare face descriptors
      const distance = faceDescriptor.reduce((sum, val, i) => 
        sum + Math.abs(val - user.faceDescriptor[i]), 0);
      
      if (distance >= 0.6) { // Threshold for face match
        return res.status(400).json({ error: 'Face not recognized' });
      }
    }
    
    // Mark attendance
    const attendance = new Attendance({ userId });
    await attendance.save();
    return res.json({ message: 'Attendance marked successfully' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/:userId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ userId: req.params.userId })
      .sort({ date: -1 })
      .populate('userId', 'name');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/:userId/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      userId: req.params.userId,
      date: { $gte: today }
    });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user data including face descriptor
app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data with descriptor
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      faceDescriptor: user.faceDescriptor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));