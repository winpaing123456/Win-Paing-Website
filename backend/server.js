// Import required modules
import express from 'express';
import cors from 'cors';


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import pkg from 'pg';
import dotenv from 'dotenv';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const PORT = process.env.PORT || 5000;


// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: 
        process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    
});


pool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
});





// Enable CORS and JSON body parsing
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "https://frontend-1ltb.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Log for debugging
            console.log(`CORS: Request from origin: ${origin}`);
            // Allow all origins for now to fix the issue - you can restrict this later
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password']
}));

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

// Serve uploaded images with CORS headers
app.use('/uploads', (req, res, next) => {
    // Set CORS headers for static files
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
}, express.static('uploads'));

// Configure Resend email service
// Resend is a modern email API that works well with cloud platforms like Render
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.warn('⚠️  Resend API key not found in environment variables');
    console.warn('   Make sure RESEND_API_KEY is set in .env file');
    console.warn('   Get your API key from https://resend.com/api-keys');
} else {
    console.log('✅ Resend API key found');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Fallback: Support SMTP if RESEND_API_KEY is not set (for backward compatibility)
const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const useResend = !!resendApiKey;

// Set up API routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Backend is running'
    });
});

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
        
        // Delete associated image file if it exists
        const deletedProject = result.rows[0];
        if (deletedProject.image_url) {
            // Remove leading slash and construct full path
            const imagePath = path.join(__dirname, deletedProject.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('✅ Deleted project image:', imagePath);
            }
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
        
        // Delete associated image file if it exists
        const deletedBlog = result.rows[0];
        if (deletedBlog.image) {
            // Remove leading slash and construct full path
            const imagePath = path.join(__dirname, deletedBlog.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('✅ Deleted blog image:', imagePath);
            }
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

    // Recipient email (where you want to receive contact form messages)
    const recipientEmail = process.env.CONTACT_EMAIL || 'winpaingse25@gmail.com';
    // Sender email (FROM_EMAIL for Resend - use onboarding@resend.dev for free tier, or your verified domain)
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    // Check if email configuration is set
    if (useResend && !resendApiKey) {
        console.error('Email configuration missing: RESEND_API_KEY must be set in .env');
        return res.status(500).json({ error: 'Email service is not configured' });
    } else if (!useResend && (!smtpUser || !smtpPass)) {
        console.error('Email configuration missing: EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS must be set in .env');
        return res.status(500).json({ error: 'Email service is not configured' });
    }

    try {
        let emailResult;
        
        if (useResend) {
            // Use Resend API (recommended for cloud platforms)
            const emailText = `New Contact Form Message

From: ${name}
Email: ${email}
Date: ${new Date().toLocaleString()}

Message:
${message}`;

            emailResult = await resend.emails.send({
                from: `Contact Form <${fromEmail}>`,
                to: recipientEmail,
                replyTo: email,
                subject: `Contact Form Message from ${name}`,
                text: emailText,
            });
            
            console.log('✅ Contact form email sent via Resend:', emailResult.data?.id);
        } else {
            // Fallback to SMTP (nodemailer) if Resend is not configured
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 60000,
            });

            const mailOptions = {
                from: `"${name}" <${smtpUser}>`,
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

            const emailPromise = transporter.sendMail(mailOptions);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Email sending timed out')), 45000)
            );
            
            emailResult = await Promise.race([emailPromise, timeoutPromise]);
            console.log('✅ Contact form email sent via SMTP:', emailResult.messageId);
        }

        // Save contact form submission to database (non-blocking)
        pool.query(
            `INSERT INTO contact (name, email, message, created_at)
             VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [name.trim(), email.trim(), message.trim()]
        ).then(dbResult => {
            console.log('✅ Contact form saved to database:', dbResult.rows[0].id);
        }).catch(dbErr => {
            // Log database error but don't fail the request since email was sent
            console.error('⚠️  Error saving contact form to database:', dbErr);
            console.warn('   Email was sent successfully, but database save failed');
        });

        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            messageId: useResend ? emailResult.data?.id : emailResult.messageId
        });
    } catch (err) {
        console.error('Error sending contact form email:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            command: err.command,
            response: err.response,
            responseCode: err.responseCode,
            errno: err.errno,
            syscall: err.syscall,
            address: err.address,
            port: err.port
        });
        
        let errorMessage = 'Failed to send message. Please try again later.';
        
        if (err.message === 'Email sending timed out') {
            errorMessage = 'Email service is taking too long. Please try again later.';
        } else if (err.code === 'EAUTH' || err.responseCode === 535) {
            errorMessage = 'Email authentication failed. Please check SMTP credentials.';
        } else if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT' || err.code === 'ETIMEOUT') {
            // More detailed error for connection issues
            if (useResend) {
                errorMessage = `Resend API error: ${err.message || 'Failed to send email'}`;
            } else {
                console.error('SMTP Connection failed. Common causes:');
                console.error('  1. Gmail may be blocking connections from cloud providers');
                console.error('  2. Render may be blocking outbound SMTP connections');
                console.error('  3. Firewall or network restrictions');
                console.error('  4. Incorrect SMTP_HOST, SMTP_PORT, or SMTP_SECURE settings');
                console.error('  5. Consider using Resend API instead (set RESEND_API_KEY)');
                errorMessage = `Cannot connect to email server (${err.code}). This may be due to network restrictions. Please try again or contact support.`;
            }
        } else if (err.code === 'ESOCKET' || err.code === 'EENOTFOUND') {
            errorMessage = useResend 
                ? `Resend API error: ${err.message}` 
                : 'Cannot resolve email server address. Please check SMTP_HOST configuration.';
        } else if (err.response) {
            errorMessage = `Email service error: ${err.response}`;
        } else if (err.message) {
            errorMessage = `Email error: ${err.message}`;
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log('Backend running at port ' + PORT);
});
