// Import required modules
import express from 'express';
import cors from 'cors';


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import pkg from 'pg';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pkg;
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'Personal Web',
    password: process.env.PGPASSWORD || 'wipaing123',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
});
pool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
});

// Create the Express app

const app = express();
// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is healthy' });
});

// Enable CORS and JSON body parsing
app.use(cors());

app.use(express.json());

// Make sure uploads folders exist (for blog and projects images)
const uploadsRoot = path.join(__dirname, 'uploads');
const blogFolder = path.join(uploadsRoot, 'blog');
const projectsFolder = path.join(uploadsRoot, 'projects');
if (!fs.existsSync(blogFolder)) {
    fs.mkdirSync(blogFolder, { recursive: true });
}
if (!fs.existsSync(projectsFolder)) {
    fs.mkdirSync(projectsFolder, { recursive: true });
}

// Multer setup for project images
const projectStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, projectsFolder);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'project-' + uniqueSuffix + ext);
    }
});
const uploadProjectImage = multer({ storage: projectStorage });

// Multer setup for blog images
const blogStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, blogFolder);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'blog-' + uniqueSuffix + ext);
    }
});
const uploadBlogImage = multer({ storage: blogStorage });

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Configure nodemailer transporter
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser || !smtpPass) {
    console.warn('⚠️  SMTP credentials not found in environment variables');
    console.warn('   Make sure SMTP_USER and SMTP_PASS are set in .env file');
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter error:', error.message);
        console.warn('⚠️  Email functionality may not work. Please check your SMTP configuration in .env');
    } else {
        console.log('✅ Email transporter ready');
    }
});

// Set up API routes

// GET /api/projects - fetch all projects
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});


// POST /api/projects - create a new project (with optional image upload)
app.post('/api/projects', uploadProjectImage.single('image'), async (req, res) => {
    // If sent as multipart/form-data, fields are in req.body, file in req.file
    const { title, description, tech_stack, repo_url, live_url } = req.body;
    let image_url = null;
    if (req.file) {
        image_url = `/uploads/projects/${req.file.filename}`;
    } else if (req.body.image_url) {
        image_url = req.body.image_url;
    }
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO projects (title, description, tech_stack, live_url, repo_url, image_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
            [title, description, tech_stack || null, live_url || null, repo_url || null, image_url || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});



// DELETE /api/projects/:id - delete a project by id
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Project id is required' });
    }
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// GET /api/blogs - fetch all blogs
app.get('/api/blogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blogs ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching blogs:', err);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// POST /api/blogs - create a new blog (with optional image upload)
app.post('/api/blogs', uploadBlogImage.single('image'), async (req, res) => {
    // If sent as multipart/form-data, fields are in req.body, file in req.file
    const { title, content } = req.body;
    let image = null;
    if (req.file) {
        image = `/uploads/blog/${req.file.filename}`;
    } else if (req.body.image) {
        image = req.body.image;
    }
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO blogs (title, content, image, created_at)
             VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [title, content, image || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating blog:', err);
        res.status(500).json({ error: 'Failed to create blog' });
    }
});

// DELETE /api/blogs/:id - delete a blog by id
app.delete('/api/blogs/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Blog id is required' });
    }
    try {
        const result = await pool.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('Error deleting blog:', err);
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});

// POST /api/contact/send - send email from contact form
app.post('/api/contact/send', async (req, res) => {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    // Validate field lengths
    if (name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (message.trim().length < 10) {
        return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }

    // Check if email configuration is set
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('Email configuration missing: SMTP_USER and SMTP_PASS must be set in .env');
        return res.status(500).json({ error: 'Email service is not configured' });
    }

    // Recipient email (where you want to receive contact form messages)
    const recipientEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;

    try {
        // Email options
        const mailOptions = {
            from: `"${name}" <${process.env.SMTP_USER}>`,
            replyTo: email,
            to: recipientEmail,
            subject: `Contact Form Message from ${name}`,
            text: `New Contact Form Message

From: ${name}
Email: ${email}
Date: ${new Date().toLocaleString()}

Message:
${message}`
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Contact form email sent:', info.messageId);

        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            messageId: info.messageId
        });
    } catch (err) {
        console.error('Error sending contact form email:', err);
        res.status(500).json({ 
            error: 'Failed to send message. Please try again later.' 
        });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Backend running at port ' + PORT);
});
