require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/bugs', require('./routes/bugs'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/members', require('./routes/members'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0', runtime: 'node' });
});

// Start server
const start = async () => {
  await connectDB();

  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@clickflow.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      email: adminEmail, password_hash: hash,
      name: 'Admin', role: 'admin',
    });
    console.log(`Admin seeded: ${adminEmail}`);
  } else {
    const match = await bcrypt.compare(adminPassword, existing.password_hash);
    if (!match) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await User.updateOne({ email: adminEmail }, { $set: { password_hash: hash } });
      console.log('Admin password updated');
    }
  }

  // Write test credentials
  const memDir = path.join(__dirname, '..', 'memory');
  if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(path.join(memDir, 'test_credentials.md'),
    `# Test Credentials\n\n## Admin\n- Email: ${adminEmail}\n- Password: ${adminPassword}\n- Role: admin\n`
  );

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClickFlow API running on http://0.0.0.0:${PORT}`);
  });
};

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
